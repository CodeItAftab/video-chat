import React, { useCallback, useEffect, useRef, useState } from "react"; // Import useState
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SimplePeer from "simple-peer-light";
import {
  clearCallState,
  setCallUser,
  setIsCallAccepted,
  setIsIncommingCall,
  setIsOnCall,
  setSignalData,
} from "@/app/slices/call";
import { CallContext } from "@/context/CallContext";
import { useSocket } from "@/hooks/socket";
import toast from "react-hot-toast";

function CallProvider({ children }) {
  const callRef = useRef(null);
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' = front, 'environment' = rear

  const { callUser, signalData: userSignalData } = useSelector(
    (state) => state.call
  );

  // --- Add State for Streams ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // ---------------------------

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const initiateCall = useCallback(() => {
    // ... (check callUser) ...

    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // <-- Set local stream state

        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream, // Use the captured stream
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }, // Google's free STUN server
            ],
          },
        });

        // Store peer instance (localStream is now handled by state)
        callRef.current = { peer }; // <-- Removed localStream from here

        peer.on("signal", (signalData) => {
          socket?.emit("initiate-call", { userId: callUser._id, signalData });
        });

        peer.on("stream", (incomingRemoteStream) => {
          console.log("Remote stream received:", incomingRemoteStream);
          setRemoteStream(incomingRemoteStream); // <-- Set remote stream state
          // No longer need window event:
          // callRef.current.remoteStream = remoteStream;
          // window.dispatchEvent(new Event("remote-stream-received"));
        });

        socket?.on("call-accepted", ({ signalData }) => {
          dispatch(setIsCallAccepted(true));
          peer.signal(signalData);
        });

        navigate("/call");
      })
      .catch((err) => {
        console.error("Failed to get local media:", err);
        alert("Could not access camera/microphone.");
        setLocalStream(null); // Clear stream state on error
      });
  }, [callUser, socket, dispatch, navigate]);

  const answerCall = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // <-- Set local stream state

        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream, // Use the captured stream
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }, // Google's free STUN server
            ],
          },
        });

        callRef.current = { peer }; // <-- Removed localStream from here

        dispatch(setIsOnCall(true));
        dispatch(setIsIncommingCall(false));
        setOpen(false); // Close modal/dialog on answer

        peer.on("signal", (signalData) => {
          socket?.emit("answer-call", { userId: callUser._id, signalData });
        });

        peer.on("stream", (incomingRemoteStream) => {
          console.log("Remote stream received:", incomingRemoteStream);
          setRemoteStream(incomingRemoteStream); // <-- Set remote stream state
          // No longer need window event
        });

        peer.signal(userSignalData);
        navigate("/call");
      })
      .catch((err) => {
        console.error("Failed to get local media:", err);
        alert("Could not access camera/microphone.");
        setLocalStream(null); // Clear stream state on error
        // Optionally reject call state or navigate away
        dispatch(clearCallState());
        setOpen(false);
      });
  }, [callUser, socket, userSignalData, dispatch, navigate]);

  const destroyCall = useCallback(() => {
    callRef.current?.peer?.destroy();

    // --- Stop local stream tracks ---
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      console.log("Local stream tracks stopped.");
    }
    // --------------------------------

    callRef.current = null;
    dispatch(clearCallState());
    setLocalStream(null); // <-- Clear local stream state
    setRemoteStream(null); // <-- Clear remote stream state
    navigate("/home", { replace: true });
    setOpen(false);
  }, [dispatch, navigate, localStream]); // <-- Add localStream dependency

  const endCall = useCallback(() => {
    socket?.emit("end-call", { userId: callUser?._id }); // Added safe navigation for callUser
    destroyCall();
  }, [callUser, socket, destroyCall]);

  const rejectCall = useCallback(() => {
    console.log("Call rejected");
    setOpen(false);
    dispatch(clearCallState());
    // Optionally inform the caller via socket
    // socket?.emit("reject-call", { userId: callUser?._id });
  }, [dispatch /*, socket, callUser*/]); // Add dependencies if using socket here

  // Inside your CallProvider function component

  // Inside your CallProvider function component

  const switchCamera = useCallback(async () => {
    // --- Start Device Check (Keep this as requested) ---
    const userAgent = navigator.userAgent;
    const hasTouch = navigator.maxTouchPoints > 0;
    const isMobileOrTabletDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ) || hasTouch;

    if (!isMobileOrTabletDevice) {
      console.log("Camera switching is only enabled on mobile/tablet devices.");
      toast.success("Camera switching is only available on mobile or tablets.");

      return;
    }
    // --- End Device Check ---

    if (!localStream) {
      console.warn("Cannot switch camera: Local stream not available.");
      toast.error("Local stream not available for switching.");
      return;
    }

    try {
      // Enumerate devices again to ensure we have the latest list and labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      if (videoInputs.length < 2) {
        console.log("No alternate camera found.");
        toast.success("No alternate camera found.");
        return;
      }

      // Find the index of the current camera and determine the next
      const currentIndex = videoInputs.findIndex(
        (d) => d.deviceId === currentCameraId
      );
      const nextIndex = (currentIndex + 1) % videoInputs.length;
      const nextCameraInfo = videoInputs[nextIndex];
      const nextDeviceId = nextCameraInfo.deviceId;

      // --- Stop all tracks in the *current* local stream ---
      console.log("Stopping current local stream tracks...");
      localStream.getTracks().forEach((track) => {
        // Check if the track is still active before stopping
        if (track.readyState !== "ended") {
          console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop();
        } else {
          console.log(`Track already ended: ${track.kind}, ID: ${track.id}`);
        }
      });
      console.log("Current local stream tracks stopped.");
      // Give a very small moment for tracks to potentially release (heuristic, not guaranteed cross-browser)
      // await new Promise(resolve => setTimeout(resolve, 50)); // Optional: uncomment if still seeing issues, but test without first.
      // ---------------------------------------------------

      // --- Get the *new* stream from the next camera ---
      console.log(
        `Attempting to get new stream from device ID: ${nextDeviceId}`
      );
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId } },
        audio: true, // Request audio as well to maintain the stream structure
      });
      console.log("New stream obtained:", newStream);
      // ---------------------------------------------

      // --- Replace the video track in the peer connection ---
      if (callRef.current?.peer && callRef.current.peer._pc) {
        console.log("Replacing video track in peer connection...");
        const pc = callRef.current.peer._pc;
        const senders = pc.getSenders();
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === "video"
        );
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (videoSender && newVideoTrack) {
          // Ensure the sender's track isn't already the new one (shouldn't happen in switch but good check)
          if (videoSender.track !== newVideoTrack) {
            await videoSender.replaceTrack(newVideoTrack);
            console.log("Video track replaced successfully.");
          } else {
            console.log("Track already replaced, skipping replaceTrack.");
          }
        } else {
          console.warn(
            "No suitable video sender found or new video track missing. Attempting to add tracks."
          );
          // If replaceTrack isn't possible, try adding the new tracks.
          // This might happen if video was initially off or sender is gone.
          // Be cautious: adding tracks might require renegotiation depending on SimplePeer/browser.
          newStream.getTracks().forEach((track) => {
            // Avoid adding the same track multiple times
            const existingSender = senders.find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              pc.addTrack(track, newStream); // Note: addTrack might need the stream as second arg in some libraries/specs
              console.log(`Added new track to peer connection: ${track.kind}`);
            } else {
              console.log(
                `Track already has a sender, skipping addTrack: ${track.kind}`
              );
            }
          });
          console.log("New tracks processed for peer connection.");
        }
      } else {
        console.warn(
          "Peer connection or its internal PC not available when switching camera. Stream updated locally only."
        );
      }
      // ------------------------------------------------------

      // --- Update local state ---
      setLocalStream(newStream);
      setCurrentCameraId(nextDeviceId);

      // Attempt to update facing mode based on device info (heuristic)
      const settings = newStream.getVideoTracks()[0].getSettings();
      if (settings.facingMode) {
        setFacingMode(settings.facingMode);
        console.log("Facing mode updated:", settings.facingMode);
      } else if (nextCameraInfo.label) {
        // Fallback to checking label if facingMode is not directly available in settings
        const label = nextCameraInfo.label.toLowerCase();
        if (label.includes("front") || label.includes("user")) {
          setFacingMode("user");
          console.log("Facing mode inferred from label: user");
        } else if (label.includes("back") || label.includes("environment")) {
          setFacingMode("environment");
          console.log("Facing mode inferred from label: environment");
        } else {
          setFacingMode("user"); // Default if unable to determine
          console.log(
            "Could not infer facing mode from label, defaulting to user."
          );
        }
      } else {
        setFacingMode("user"); // Default if no label or settings
        console.log(
          "Could not infer facing mode, defaulting to user (no settings/label)."
        );
      }
      // --------------------------
    } catch (err) {
      console.error("Failed to switch camera:", err);
      toast.error("Failed to switch camera.");

      // --- Add Robust Error Recovery ---
      console.log(
        "Attempting to recover local stream by getting a default stream..."
      );
      // If switching to the specific camera fails, try to get *any* video and audio stream
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((recoveredStream) => {
          console.log(
            "Successfully recovered a local stream:",
            recoveredStream
          );
          setLocalStream(recoveredStream); // Update local state with the recovered stream
          toast.success("Camera switched (recovered).");

          // Attempt to replace the track in the peer connection with the recovered track
          if (callRef.current?.peer && callRef.current.peer._pc) {
            console.log("Attempting to replace track with recovered stream...");
            const pc = callRef.current.peer._pc;
            const senders = pc.getSenders();
            const videoSender = senders.find(
              (sender) => sender.track && sender.track.kind === "video"
            );
            const recoveredVideoTrack = recoveredStream.getVideoTracks()[0];

            if (videoSender && recoveredVideoTrack) {
              if (videoSender.track !== recoveredVideoTrack) {
                videoSender.replaceTrack(recoveredVideoTrack);
                console.log(
                  "Video track replaced with recovered stream track."
                );
              } else {
                console.log("Recovered track is already the current track.");
              }

              // Update current camera ID and facing mode based on the recovered stream
              const trackSettings = recoveredVideoTrack.getSettings();
              if (trackSettings.deviceId) {
                setCurrentCameraId(trackSettings.deviceId);
              }
              if (trackSettings.facingMode) {
                setFacingMode(trackSettings.facingMode);
              } else if (trackSettings.deviceId) {
                // Try to infer facing mode from device list again using deviceId
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                  const device = devices.find(
                    (d) => d.deviceId === trackSettings.deviceId
                  );
                  if (device && device.label) {
                    const label = device.label.toLowerCase();
                    if (label.includes("front") || label.includes("user"))
                      setFacingMode("user");
                    else if (
                      label.includes("back") ||
                      label.includes("environment")
                    )
                      setFacingMode("environment");
                    else setFacingMode("user"); // Default
                  }
                });
              } else {
                setFacingMode("user"); // Default if no info
              }
            } else {
              console.warn(
                "Could not find video sender or recovered video track to replace. Attempting to add recovered tracks."
              );
              // Fallback: just add the tracks from the recovered stream
              recoveredStream.getTracks().forEach((track) => {
                const existingSender = senders.find(
                  (sender) => sender.track === track
                );
                if (!existingSender) {
                  pc.addTrack(track, recoveredStream);
                  console.log(`Added recovered track: ${track.kind}`);
                }
              });
            }
          } else {
            console.warn(
              "Peer connection not available during recovery attempt. Stream updated locally only."
            );
          }
        })
        .catch((recoveryErr) => {
          console.error(
            "Failed to recover local stream after switch error:",
            recoveryErr
          );
          toast.error("Critical error: Could not restore camera.");
          // If recovery also fails, consider ending the call as the camera is unusable
          destroyCall(); // Automatically end call if camera fails critically
        });
      // --- End Robust Error Recovery ---
    }
  }, [
    localStream,
    callRef,
    currentCameraId,
    setLocalStream,
    setCurrentCameraId,
    setFacingMode,
    destroyCall,
  ]); // Added destroyCall dependency for error recovery

  useEffect(() => {
    // Ensure socket handlers don't rely on potentially stale state from closure
    // Use refs or ensure callbacks are updated if dependencies change

    const handleIncomingCall = ({ signalData, user }) => {
      dispatch(setIsIncommingCall(true));
      dispatch(setCallUser(user));
      dispatch(setSignalData(signalData));
      setOpen(true);
    };

    const handleCallEnded = () => {
      // Make sure destroyCall uses the latest state (useCallback handles this)
      destroyCall();
      navigate("/home", { replace: true });
      toast.success("Call ended");
    };

    socket?.on("incomming-call", handleIncomingCall);
    socket?.on("call-ended", handleCallEnded);

    return () => {
      socket?.off("incomming-call", handleIncomingCall);
      socket?.off("call-ended", handleCallEnded);
      // Clean up listeners for 'call-accepted' added inside initiateCall if component unmounts before acceptance
      // socket?.off("call-accepted"); // This might be tricky depending on exact flow
    };
  }, [socket, dispatch, destroyCall, setOpen, navigate]); // Added missing dependencies

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);

      // Default to first camera
      if (videoInputs.length > 0) {
        setCurrentCameraId(videoInputs[0].deviceId);
      }
    });
  }, []);

  return (
    <CallContext.Provider
      value={{
        // Pass state directly
        localStream,
        remoteStream,
        // Pass functions
        initiateCall,
        answerCall,
        endCall,
        rejectCall,
        callRef,
        open,
        setOpen,
        handleOpen,
        handleClose,
        switchCamera,
        videoDevices,
        currentCameraId,
        setCurrentCameraId,
        setVideoDevices,
        facingMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export default CallProvider;
