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
import { isMobileDevice } from "@/lib/utils";

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

  // const switchCamera = async () => {
  //   if (!localStream) return;

  //   // Get the list of video devices again (in case it changes)
  //   const devices = await navigator.mediaDevices.enumerateDevices();
  //   const videoInputs = devices.filter((d) => d.kind === "videoinput");

  //   if (videoInputs.length < 2) return alert("No alternate camera found.");

  //   // Find next camera
  //   const currentIndex = videoInputs.findIndex(
  //     (d) => d.deviceId === currentCameraId
  //   );
  //   const nextIndex = (currentIndex + 1) % videoInputs.length;
  //   const nextDeviceId = videoInputs[nextIndex].deviceId;

  //   try {
  //     const newStream = await navigator.mediaDevices.getUserMedia({
  //       video: { deviceId: { exact: nextDeviceId } },
  //       audio: false, // Keep existing audio
  //     });

  //     // Replace the video track in the peer connection
  //     const newVideoTrack = newStream.getVideoTracks()[0];
  //     const oldVideoTrack = localStream.getVideoTracks()[0];

  //     if (callRef.current?.peer && callRef.current.peer.streams[0]) {
  //       const sender = callRef.current.peer._pc
  //         .getSenders()
  //         .find((s) => s.track?.kind === "video");

  //       if (sender) {
  //         sender.replaceTrack(newVideoTrack);
  //       }
  //     }

  //     // Stop old video track and update local stream
  //     oldVideoTrack.stop();
  //     localStream.removeTrack(oldVideoTrack);
  //     localStream.addTrack(newVideoTrack);
  //     setCurrentCameraId(nextDeviceId);
  //   } catch (err) {
  //     console.error("Failed to switch camera:", err);
  //   }
  // };

  const switchCamera = async () => {
    if (!localStream) return;

    if (isMobileDevice()) {
      // MOBILE: Use facingMode toggle
      const newFacingMode = facingMode === "user" ? "environment" : "user";

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: newFacingMode } },
          audio: false,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        const sender = callRef.current?.peer?._pc
          ?.getSenders()
          ?.find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        oldVideoTrack.stop();

        const updatedStream = new MediaStream([
          newVideoTrack,
          ...localStream.getAudioTracks(),
        ]);

        setLocalStream(updatedStream);
        setFacingMode(newFacingMode);
      } catch (err) {
        console.error("Mobile camera switch failed:", err);
      }
    } else {
      // DESKTOP: Cycle through available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      if (videoInputs.length < 2) return alert("No alternate camera found.");

      const currentIndex = videoInputs.findIndex(
        (d) => d.deviceId === currentCameraId
      );
      const nextIndex = (currentIndex + 1) % videoInputs.length;
      const nextDeviceId = videoInputs[nextIndex].deviceId;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: nextDeviceId } },
          audio: false,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        const sender = callRef.current?.peer?._pc
          ?.getSenders()
          ?.find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        oldVideoTrack.stop();
        const updatedStream = new MediaStream([
          newVideoTrack,
          ...localStream.getAudioTracks(),
        ]);

        setLocalStream(updatedStream);
        setCurrentCameraId(nextDeviceId);
      } catch (err) {
        console.error("Desktop camera switch failed:", err);
      }
    }
  };

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
        setFacingMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export default CallProvider;
