import React, { useCallback, useEffect, useRef, useState } from "react";
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
import toast from "react-hot-toast"; // Assuming you are using react-hot-toast

function CallProvider({ children }) {
  const callRef = useRef(null);
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' = front, 'environment' = rear

  // --- State for Camera Switching Loading ---
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  // ------------------------------------------------

  const { callUser, signalData: userSignalData } = useSelector(
    (state) => state.call
  );

  // --- State for Streams ---
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // ---------------------------

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const initiateCall = useCallback(() => {
    // Add check if already on call or calling
    if (!callUser || callRef.current?.peer) {
      console.warn(
        "Cannot initiate call: No call user or peer already exists."
      );
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // Set local stream state

        const peer = new SimplePeer({
          initiator: true,
          trickle: false, // Consider setting to true for faster connection setup
          stream, // Use the captured stream
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }, // Google's free STUN server
              // You might want to add TURN servers for better reliability
            ],
          },
        });

        callRef.current = { peer };

        peer.on("signal", (signalData) => {
          console.log("Peer signal (initiator):", signalData);
          socket?.emit("initiate-call", { userId: callUser._id, signalData });
        });

        peer.on("stream", (incomingRemoteStream) => {
          console.log("Remote stream received:", incomingRemoteStream);
          setRemoteStream(incomingRemoteStream); // Set remote stream state
        });

        peer.on("error", (err) => {
          console.error("Peer error (initiator):", err);
          toast.error("Call error occurred.");
          destroyCall(); // Automatically end call on peer error
        });

        peer.on("close", () => {
          console.log("Peer connection closed (initiator).");
          // Handle peer closure if not triggered by explicit endCall
          // destroyCall(); // destroyCall already called by call-ended or explicit endCall
        });

        socket?.on("call-accepted", ({ signalData }) => {
          console.log("Call accepted by remote user.");
          dispatch(setIsCallAccepted(true));
          peer.signal(signalData);
        });
        // Clean up the specific listener once accepted or if initiate fails
        peer.once("signal", () => {
          // assuming signal is sent once for offer/answer
          socket?.off("call-accepted"); // Clean up after the offer is sent and accepted
        });

        dispatch(setIsOnCall(true)); // Indicate call is attempting to connect
        navigate("/call");
      })
      .catch((err) => {
        console.error("Failed to get local media for initiating call:", err);
        toast.error("Could not access camera/microphone.");
        setLocalStream(null); // Clear stream state on error
        // Optionally clear call state or navigate back if media access is required
        dispatch(clearCallState());
        navigate("/home"); // Navigate away if call cannot start
      });
  }, [callUser, socket, dispatch, navigate, destroyCall]); // Added destroyCall dependency

  const answerCall = useCallback(() => {
    if (!userSignalData || !callUser || callRef.current?.peer) {
      console.warn(
        "Cannot answer call: Missing signal data, call user, or peer already exists."
      );
      // Optionally reject call or clear state if in an invalid state
      rejectCall(); // Use rejectCall to clean up
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // Set local stream state

        const peer = new SimplePeer({
          initiator: false, // Answering user is not the initiator
          trickle: false, // Consider setting to true
          stream, // Use the captured stream
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }, // Google's free STUN server
              // Add TURN servers here
            ],
          },
        });

        callRef.current = { peer };

        dispatch(setIsOnCall(true)); // Indicate call is active
        dispatch(setIsIncommingCall(false)); // No longer an incoming call
        setOpen(false); // Close modal/dialog on answer

        peer.on("signal", (signalData) => {
          console.log("Peer signal (answerer):", signalData);
          socket?.emit("answer-call", { userId: callUser._id, signalData });
        });

        peer.on("stream", (incomingRemoteStream) => {
          console.log("Remote stream received:", incomingRemoteStream);
          setRemoteStream(incomingRemoteStream); // Set remote stream state
        });

        peer.on("error", (err) => {
          console.error("Peer error (answerer):", err);
          toast.error("Call error occurred.");
          destroyCall(); // Automatically end call on peer error
        });

        peer.on("close", () => {
          console.log("Peer connection closed (answerer).");
          // Handle peer closure
        });

        peer.signal(userSignalData); // Signal the initiator with the answer
        navigate("/call");
      })
      .catch((err) => {
        console.error("Failed to get local media for answering call:", err);
        toast.error("Could not access camera/microphone to answer.");
        setLocalStream(null); // Clear stream state on error
        // Reject the call state and close modal if media access fails
        rejectCall(); // Use rejectCall for cleanup
      });
  }, [
    callUser,
    socket,
    userSignalData,
    dispatch,
    navigate,
    rejectCall,
    setOpen,
    destroyCall,
  ]); // Added dependencies

  const destroyCall = useCallback(() => {
    console.log("Destroying call...");
    // Stop peer connection
    if (callRef.current?.peer) {
      callRef.current.peer.removeAllListeners(); // Clean up peer listeners
      callRef.current.peer.destroy();
      callRef.current.peer = null; // Dereference the peer
      console.log("SimplePeer instance destroyed.");
    } else {
      console.log("No peer instance to destroy.");
    }

    // Stop local stream tracks
    if (localStream) {
      console.log("Stopping local stream tracks...");
      localStream.getTracks().forEach((track) => {
        if (track.readyState !== "ended") {
          console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop();
        } else {
          console.log(`Track already ended: ${track.kind}, ID: ${track.id}`);
        }
      });
      console.log("Local stream tracks stopped.");
    } else {
      console.log("No local stream to stop tracks.");
    }

    // Clear state
    dispatch(clearCallState()); // Clear Redux call state
    setLocalStream(null); // Clear local stream state
    setRemoteStream(null); // Clear remote stream state
    callRef.current = null; // Clear ref
    setIsSwitchingCamera(false); // Ensure switching state is false
    setOpen(false); // Close any open dialogs

    console.log("Call state cleared and resources released.");

    // Navigate away from the call page
    // Use replace: true to avoid navigating back to the call page with the browser back button
    if (window.location.pathname === "/call") {
      navigate("/home", { replace: true });
      console.log("Navigated away from call page.");
    } else {
      console.log("Not on call page, skipping navigation.");
    }
  }, [dispatch, navigate, localStream]); // Dependency on localStream is needed to stop its tracks

  const endCall = useCallback(() => {
    console.log("Ending call via user action.");
    // Emit socket event to inform the other user
    if (socket && callUser?._id) {
      socket.emit("end-call", { userId: callUser._id });
      console.log(`Emitted 'end-call' for user: ${callUser._id}`);
    } else {
      console.warn(
        "Socket not available or callUser missing when ending call."
      );
    }

    // Clean up local resources and state
    destroyCall();
  }, [callUser, socket, destroyCall]); // Dependencies are correct

  const rejectCall = useCallback(() => {
    console.log("Call rejected.");
    // Inform the caller via socket if needed (optional based on your backend)
    // if (socket && callUser?._id) {
    //     socket.emit("reject-call", { userId: callUser._id });
    //     console.log(`Emitted 'reject-call' for user: ${callUser._id}`);
    // } else {
    //     console.warn("Socket not available or callUser missing when rejecting call.");
    // }

    // Clean up local state
    destroyCall(); // Use destroyCall to clean up state and potentially streams/peer
  }, [destroyCall /* Add socket, callUser if you emit reject-call */]);

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
      toast.info("Camera switching is only available on mobile or tablets.");
      return;
    }
    // --- End Device Check ---

    if (!localStream) {
      console.warn("Cannot switch camera: Local stream not available.");
      toast.error("Local stream not available for switching.");
      return;
    }

    setIsSwitchingCamera(true); // <-- Set switching state to true when switching starts

    try {
      // Enumerate devices again to ensure we have the latest list and labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      if (videoInputs.length < 2) {
        console.log("No alternate camera found.");
        toast.info("No alternate camera found.");
        setIsSwitchingCamera(false); // <-- Set switching state to false if no alternate camera
        return;
      }

      const currentIndex = videoInputs.findIndex(
        (d) => d.deviceId === currentCameraId
      );
      const nextIndex = (currentIndex + 1) % videoInputs.length;
      const nextCameraInfo = videoInputs[nextIndex];
      const nextDeviceId = nextCameraInfo.deviceId;

      // --- Stop all tracks in the *current* local stream ---
      console.log("Stopping current local stream tracks...");
      localStream.getTracks().forEach((track) => {
        if (track.readyState !== "ended") {
          console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop(); // Signal the browser to stop the track
        } else {
          console.log(`Track already ended: ${track.kind}, ID: ${track.id}`);
        }
      });
      console.log("Current local stream tracks stopped.");

      // Optional: await new Promise(resolve => setTimeout(resolve, 50));

      console.log(
        `Attempting to get new stream from device ID: ${nextDeviceId}`
      );
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId } }, // Request video from the specific next device
        audio: true, // Include audio
      });
      console.log("New stream obtained:", newStream);

      // --- Replace the video track in the peer connection ---
      if (callRef.current?.peer && callRef.current.peer._pc) {
        console.log("Replacing video track in peer connection...");
        const pc = callRef.current.peer._pc; // Get the underlying RTCPeerConnection
        const senders = pc.getSenders(); // Get the list of RtpSenders
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === "video"
        );
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (videoSender && newVideoTrack) {
          if (videoSender.track !== newVideoTrack) {
            await videoSender.replaceTrack(newVideoTrack); // Replace the old track with the new one
            console.log("Video track replaced successfully.");
          } else {
            console.log("Track already replaced, skipping replaceTrack.");
          }
        } else {
          console.warn(
            "No suitable video sender found or new video track missing. Attempting to add tracks."
          );
          newStream.getTracks().forEach((track) => {
            const existingSender = senders.find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              pc.addTrack(track, newStream);
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

      const settings = newStream.getVideoTracks()[0].getSettings();
      if (settings.facingMode) {
        setFacingMode(settings.facingMode);
      } else if (nextCameraInfo.label) {
        const label = nextCameraInfo.label.toLowerCase();
        if (label.includes("front") || label.includes("user"))
          setFacingMode("user");
        else if (label.includes("back") || label.includes("environment"))
          setFacingMode("environment");
        else setFacingMode("user");
      } else {
        setFacingMode("user");
      }
      console.log("Facing mode updated (heuristic/settings):", facingMode);

      setIsSwitchingCamera(false); // <-- Set switching state to false on success
    } catch (err) {
      // --- Error Handling and Recovery ---
      console.error("Failed to switch camera:", err);
      toast.error("Failed to switch camera.");

      console.log(
        "Attempting to recover local stream by getting a default stream..."
      );
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((recoveredStream) => {
          console.log(
            "Successfully recovered a local stream:",
            recoveredStream
          );
          setLocalStream(recoveredStream);
          toast.success("Camera switched (recovered default camera).");

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
              const trackSettings = recoveredVideoTrack.getSettings();
              if (trackSettings.deviceId)
                setCurrentCameraId(trackSettings.deviceId);
              if (trackSettings.facingMode)
                setFacingMode(trackSettings.facingMode);
              else {
                setFacingMode("user");
                console.log(
                  "Could not determine recovered stream facing mode, defaulting to user."
                );
              }
            } else {
              console.warn(
                "Could not find video sender or recovered video track to replace. Attempting to add recovered tracks."
              );
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
          destroyCall(); // End the call if recovery fails
        })
        .finally(() => {
          setIsSwitchingCamera(false); // <-- Set switching state to false after recovery attempt finishes
        });
      // --- End Error Handling and Recovery ---
    }
  }, [
    localStream,
    callRef,
    currentCameraId,
    setLocalStream,
    setCurrentCameraId,
    setFacingMode,
    toast,
    destroyCall,
    setIsSwitchingCamera,
  ]); // Add setIsSwitchingCamera dependency

  useEffect(() => {
    // Ensure socket handlers don't rely on potentially stale state from closure
    // Use refs or ensure callbacks are updated if dependencies change

    const handleIncomingCall = ({ signalData, user }) => {
      console.log("Received incoming call from:", user);
      // Check if already on a call
      if (callRef.current?.peer || localStream) {
        console.warn(
          "Ignoring incoming call: Already in a call or stream active."
        );
        // Optionally emit a busy signal back
        // socket?.emit("call-busy", { userId: user._id });
        return;
      }
      dispatch(setIsIncommingCall(true));
      dispatch(setCallUser(user));
      dispatch(setSignalData(signalData));
      setOpen(true); // Open the incoming call dialog/modal
    };

    const handleCallEnded = () => {
      console.log("Received call-ended signal from remote user.");
      // Make sure destroyCall uses the latest state (useCallback handles this)
      destroyCall();
      // navigate("/home", { replace: true }); // destroyCall already navigates
      toast.success("Call ended");
    };

    // Clean up function for useEffect
    const cleanupSocketListeners = () => {
      console.log("Cleaning up socket listeners...");
      socket?.off("incomming-call", handleIncomingCall);
      socket?.off("call-ended", handleCallEnded);
      // Note: 'call-accepted' listener is added/removed inside initiateCall
    };

    // Set up listeners
    console.log("Setting up socket listeners...");
    socket?.on("incomming-call", handleIncomingCall);
    socket?.on("call-ended", handleCallEnded);

    // Return cleanup function
    return cleanupSocketListeners;

    // Dependencies: socket is needed to attach/detach listeners.
    // dispatch, destroyCall, setOpen, navigate are needed inside the handlers,
    // and useCallback/useMemo on the handlers ensure they are stable if their
    // dependencies change. Listing them here ensures the effect re-runs
    // if the handlers themselves change identity (due to their dependencies changing).
  }, [socket, dispatch, destroyCall, setOpen, navigate]);

  // Effect to enumerate media devices on mount
  useEffect(() => {
    console.log("Enumerating media devices...");
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);

        // Default to first camera found
        if (videoInputs.length > 0) {
          setCurrentCameraId(videoInputs[0].deviceId);
          // Attempt to set initial facing mode based on the first device label
          const firstCamera = videoInputs[0];
          if (firstCamera.label) {
            const label = firstCamera.label.toLowerCase();
            if (label.includes("front") || label.includes("user"))
              setFacingMode("user");
            else if (label.includes("back") || label.includes("environment"))
              setFacingMode("environment");
            else setFacingMode("user"); // Default
          } else {
            setFacingMode("user"); // Default if no label
          }
          console.log("Initial camera ID set:", videoInputs[0].deviceId);
          console.log("Initial facing mode set (heuristic):", facingMode); // Note: facingMode state might not update instantly here
        } else {
          console.warn("No video input devices found.");
          setCurrentCameraId(null);
          setFacingMode("user"); // Default facing mode
        }
      })
      .catch((err) => {
        console.error("Error enumerating devices:", err);
        toast.error("Could not access media devices list.");
      });
  }, []); // Empty dependency array means this effect runs once on mount

  // Clean up local stream and peer connection when component unmounts
  useEffect(() => {
    return () => {
      console.log("CallProvider unmounting. Cleaning up resources.");
      // Ensure peer and streams are destroyed on unmount if still active
      // The destroyCall function already handles state cleanup and navigation,
      // but we might want a minimal cleanup here just for peer/streams
      // if destroyCall wasn't fully executed (e.g., navigation happened unexpectedly).
      // However, relying on destroyCall called by endCall/call-ended/error is standard.
      // Let's ensure peer is destroyed if it still exists.
      if (callRef.current?.peer) {
        console.log("Destroying peer on unmount.");
        callRef.current.peer.removeAllListeners();
        callRef.current.peer.destroy();
        callRef.current.peer = null;
      }
      if (localStream) {
        console.log("Stopping local stream tracks on unmount.");
        localStream.getTracks().forEach((track) => {
          if (track.readyState !== "ended") {
            track.stop();
          }
        });
        setLocalStream(null); // Clean up state
      }
      if (remoteStream) {
        console.log("Clearing remote stream on unmount.");
        // Remote stream tracks are usually stopped when the remote peer stops sending or peer connection closes
        setRemoteStream(null); // Clean up state
      }
      dispatch(clearCallState()); // Ensure Redux state is clean
      setIsSwitchingCamera(false); // Ensure state is reset
      setOpen(false); // Close dialog
      callRef.current = null; // Clear ref
    };
  }, [dispatch, localStream, remoteStream]); // Dependencies for cleanup

  return (
    <CallContext.Provider
      value={{
        // Pass state directly
        localStream,
        remoteStream,
        isSwitchingCamera, // <-- Pass the new state via context
        // Pass functions
        initiateCall,
        answerCall,
        endCall,
        rejectCall,
        switchCamera, // Pass the updated switchCamera
        callRef,
        open,
        setOpen,
        handleOpen,
        handleClose,
        videoDevices,
        currentCameraId,
        setCurrentCameraId,
        setVideoDevices,
        facingMode, // Pass facingMode if you use it in the Call component
        setFacingMode, // Pass setFacingMode if you need to change it from Call component
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export default CallProvider;
