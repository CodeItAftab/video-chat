import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming you use shadcn/ui Button
import { useCall } from "@/hooks/call"; // Assuming useCall hook gets values from CallContext
import {
  ArrowsClockwise,
  MicrophoneSlash,
  PhoneSlash,
  Spinner,
  VideoCamera,
  Microphone, // Assuming you might toggle mic
  VideoCameraSlash, // Assuming you might toggle video
} from "phosphor-react"; // Assuming you use phospher-react icons

function Call() {
  // --- Consume the new state ---
  const {
    localStream,
    remoteStream,
    endCall,
    switchCamera,
    isSwitchingCamera, // <-- Consume the new state
    // Add other context values you need, e.g.,
    // isMuted, toggleMute, isVideoOff, toggleVideo, facingMode
  } = useCall();
  // -------------------------------

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isRotating, setIsRotating] = useState(false); // State for button animation

  const handleRotateClick = async () => {
    // Only trigger rotation animation and switch if not already switching
    if (!isSwitchingCamera) {
      setIsRotating(true);
      // switchCamera will handle the isSwitchingCamera state internally
      await switchCamera();
      // The rotation animation duration should ideally cover the expected switch time
      // Adjust the timeout based on how long the perceived switch takes
      setTimeout(() => setIsRotating(false), 800); // Shorter spin time, adjust as needed
    } else {
      console.log("Camera switch already in progress.");
    }
  };

  // Effect to attach local stream to the video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("Setting local video srcObject.");
      localVideoRef.current.srcObject = localStream;
    } else if (localVideoRef.current) {
      console.log("Clearing local video srcObject.");
      localVideoRef.current.srcObject = null;
    }
    // Cleanup function for useEffect
    return () => {
      if (localVideoRef.current) {
        // When component unmounts or stream changes, detach the old stream
        localVideoRef.current.srcObject = null;
        console.log("Local video srcObject cleared on cleanup.");
      }
    };
  }, [localStream]); // Re-run effect when localStream changes

  // Effect to attach remote stream to the video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("Setting remote video srcObject.");
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteVideoRef.current) {
      console.log("Clearing remote video srcObject.");
      remoteVideoRef.current.srcObject = null;
    }
    // Cleanup function for useEffect
    return () => {
      if (remoteVideoRef.current) {
        // When component unmounts or stream changes, detach the old stream
        remoteVideoRef.current.srcObject = null;
        console.log("Remote video srcObject cleared on cleanup.");
      }
    };
  }, [remoteStream]); // Re-run effect when remoteStream changes

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black">
      <div className="flex md:flex-row flex-col w-full items-center justify-center md:gap-8 gap-3 md:p-8 px-2 py-3 flex-grow bg-black">
        {/* Local Video */}
        <div className="relative md:w-1/2 w-auto md:h-full h-[45%] rounded-2xl bg-white overflow-hidden">
          {/* Added overflow-hidden */}
          <video
            className="size-full object-cover bg-black h-full"
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // Mute local video to avoid echo
          />
          {/* Show spinner if local stream is null OR if currently switching camera */}
          {!localStream || isSwitchingCamera ? (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center text-white bg-black bg-opacity-75">
              {/* Added bg-opacity for better visibility */}
              {isSwitchingCamera ? (
                // Spinner specifically for camera switching
                <div className="flex flex-col items-center">
                  <Spinner size={40} className="animate-spin" />
                  <span className="mt-2 text-sm">Switching Camera...</span>
                </div>
              ) : (
                // Original spinner for initial stream loading
                <Spinner size={40} className="animate-spin" />
              )}
            </div>
          ) : null}
        </div>

        {/* Remote Video */}
        <div className="relative md:w-1/2 w-auto md:h-full h-[45%] rounded-2xl bg-white overflow-hidden">
          {/* Added overflow-hidden */}
          <video
            className="size-full object-cover bg-black h-full"
            ref={remoteVideoRef}
            autoPlay
            playsInline
            // Remote video should NOT be muted by default
          />
          {/* Show spinner while waiting for remote stream */}
          {localStream &&
            !remoteStream &&
            !isSwitchingCamera && ( // Don't show remote spinner if local is switching
              <div className="absolute inset-0 flex h-full w-full items-center justify-center text-white bg-black bg-opacity-75">
                <Spinner size={40} className="animate-spin" />
              </div>
            )}
          {/* Show "Please wait..." if neither stream is available initially */}
          {!localStream && !remoteStream && !isSwitchingCamera && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-75">
              Please wait...
            </div>
          )}
          {/* Optionally show a placeholder or remote user's avatar/name if remoteStream is null */}
          {/* Example: */}
          {!remoteStream && (localStream || isSwitchingCamera) && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-75">
              {/* Replace with remote user's info if available */}
              Waiting for remote user...
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:h-20 h-16 flex justify-center bg-black/90 shrink-0">
        <div className="flex items-center justify-center gap-4 md:w-[400px] w-3/4 h-10/12 rounded-md bg-slate-700 px-2">
          {/* Added some padding */}
          {/* Video Toggle Button (example) */}
          <Button className="text-white p-3 size-10 rounded-full text-lg font-semibold">
            {/* Replace with state variable for video toggle */}
            {/* {isVideoOff ? <VideoCameraSlash /> : <VideoCamera />} */}
            <VideoCamera className="text-white size-6" weight="duotone" />
          </Button>
          {/* Microphone Toggle Button (example) */}
          <Button className="text-white p-3 size-10 rounded-full text-lg font-semibold">
            {/* Replace with state variable for mic toggle */}
            {/* {isMuted ? <MicrophoneSlash /> : <Microphone />} */}
            <MicrophoneSlash className="text-white size-6" weight="duotone" />
          </Button>
          {/* End Call Button */}
          <Button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full text-lg font-semibold"
          >
            <PhoneSlash className="text-white size-6" weight="duotone" />
          </Button>
          {/* Camera Rotate Button */}
          <Button
            onClick={handleRotateClick}
            disabled={isSwitchingCamera} // <-- Disable button while switching
            className="text-white size-10 p-3 rounded-full text-lg font-semibold disabled:opacity-50 disabled:pointer-events-none" // Add disabled styles
          >
            <ArrowsClockwise
              className={`text-white size-6 ${
                isRotating ? "animate-once-spin" : "" // Keep your rotation animation
              }`}
              weight="duotone"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Call;
