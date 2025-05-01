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

  const switchCamera = useCallback(async () => {
    // --- Start Device Check ---
    const userAgent = navigator.userAgent;
    const hasTouch = navigator.maxTouchPoints > 0;
    // A simple check for common mobile/tablet indicators
    const isMobileOrTabletDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ) || hasTouch;

    if (!isMobileOrTabletDevice) {
      console.log("Camera switching is only enabled on mobile/tablet devices.");
      // Optionally show a toast or alert to the user
      toast.info("Camera switching is only available on mobile or tablets."); // Assuming toast is available from react-hot-toast import
      return; // Stop the function if not mobile/tablet
    }
    // --- End Device Check ---

    if (!localStream) {
      console.warn("Cannot switch camera: Local stream not available.");
      toast.error("Local stream not available.");
      return;
    }

    try {
      // Enumerate devices again to ensure we have the latest list and labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      if (videoInputs.length < 2) {
        console.log("No alternate camera found.");
        toast.info("No alternate camera found.");
        return; // Return if only one camera is available
      }

      // Find the index of the current camera and determine the next
      const currentIndex = videoInputs.findIndex(
        (d) => d.deviceId === currentCameraId
      );
      const nextIndex = (currentIndex + 1) % videoInputs.length;
      const nextCameraInfo = videoInputs[nextIndex]; // Get info for label/facing mode check later
      const nextDeviceId = nextCameraInfo.deviceId;

      // --- Stop all tracks in the *current* local stream ---
      console.log("Stopping current local stream tracks...");
      localStream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      console.log("Current local stream tracks stopped.");
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
      if (callRef.current?.peer) {
        console.log("Replacing video track in peer connection...");
        const senders = callRef.current.peer._pc.getSenders();
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === "video"
        );

        if (videoSender) {
          videoSender.replaceTrack(newStream.getVideoTracks()[0]);
          console.log("Video track replaced successfully.");
        } else {
          console.warn(
            "No video sender found in peer connection. Adding new track."
          );
          // This might happen if video was initially off. Add the new track.
          newStream.getTracks().forEach((track) => {
            // Check if track is already added to avoid errors
            const existingSender = senders.find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              callRef.current.peer.addTrack(track, newStream);
              console.log(`Added track: ${track.kind}`);
            }
          });
          console.log("New tracks added to peer connection.");
        }
      } else {
        console.warn(
          "Peer connection not available when switching camera. Stream updated locally only."
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
      // Optional: Add logic here to handle failure more gracefully,
      // e.g., attempt to revert to the previous stream or signal an error state.
      // For now, the error is logged and a toast is shown.
    }
  }, [
    localStream,
    callRef,
    currentCameraId,
    setLocalStream,
    setCurrentCameraId,
    setFacingMode,
  ]);

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
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export default CallProvider;
