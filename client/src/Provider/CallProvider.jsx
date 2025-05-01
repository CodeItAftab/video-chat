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

function CallProvider({ children }) {
  const callRef = useRef(null);
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
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
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // <-- Set local stream state

        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream, // Use the captured stream
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
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Local stream captured:", stream);
        setLocalStream(stream); // <-- Set local stream state

        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream, // Use the captured stream
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
    };

    socket?.on("incomming-call", handleIncomingCall);
    socket?.on("call-ended", handleCallEnded);

    return () => {
      socket?.off("incomming-call", handleIncomingCall);
      socket?.off("call-ended", handleCallEnded);
      // Clean up listeners for 'call-accepted' added inside initiateCall if component unmounts before acceptance
      // socket?.off("call-accepted"); // This might be tricky depending on exact flow
    };
  }, [socket, dispatch, destroyCall, setOpen]); // Added missing dependencies

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
        // Pass necessary state/refs if still needed elsewhere
        callRef, // Keep if direct peer access is needed, e.g., for advanced features
        open,
        setOpen,
        handleOpen, // Consider removing if 'open' is only for incoming calls
        handleClose, // Consider removing
        // You might not need destroyCall exposed if endCall covers usage
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export default CallProvider;
