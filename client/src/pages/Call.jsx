import React, { useEffect, useRef } from "react"; // Removed useState
import { Button } from "@/components/ui/button";
import { useCall } from "@/hooks/call"; // Assuming this hook correctly gets context

function Call() {
  // Get streams and functions directly from context via the hook
  const { localStream, remoteStream, endCall } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Effect to set the local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("Assigning local stream to video element:", localStream);
      localVideoRef.current.srcObject = localStream;
    } else if (localVideoRef.current) {
      // Clear srcObject if stream becomes null (e.g., on call end)
      localVideoRef.current.srcObject = null;
    }
    // Optional: Cleanup to explicitly remove srcObject when effect re-runs or component unmounts
    // return () => {
    //   if (localVideoRef.current) localVideoRef.current.srcObject = null;
    // }
  }, [localStream]); // Depend on the localStream state from context

  // Effect to set the remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("Assigning remote stream to video element:", remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteVideoRef.current) {
      // Clear srcObject if stream becomes null
      remoteVideoRef.current.srcObject = null;
    }
    // Optional: Cleanup
    // return () => {
    //   if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    // }
  }, [remoteStream]); // Depend on the remoteStream state from context

  // No longer need the event listener for remote stream

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-200 gap-2">
      <div className="flex flex-col items-center justify-center gap-4 flex-grow">
        {/* Local Video */}
        <div className="relative">
          <video
            className="h-[200px] w-[200px] bg-slate-600 rounded" // Darker bg for contrast
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // Keep local muted to avoid echo
          ></video>
          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Setting up...
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div className="relative">
          <video
            className="h-[200px] w-[200px] bg-slate-500 rounded"
            ref={remoteVideoRef}
            autoPlay
            playsInline // Important for mobile
          ></video>
          {localStream &&
            !remoteStream && ( // Show waiting only if we are ready but they aren't yet
              <div className="absolute inset-0 flex items-center justify-center text-white">
                Connecting...
              </div>
            )}
          {!localStream &&
            !remoteStream && ( // Optional: Show different message if local isn't ready either
              <div className="absolute inset-0 flex items-center justify-center text-white">
                Please wait...
              </div>
            )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="w-full h-40 flex items-center justify-center">
        {/* Disable button if streams aren't ready or call isn't fully established? */}
        <Button
          onClick={endCall}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full text-lg font-semibold disabled:opacity-50"
          // disabled={!localStream || !remoteStream} // Example: enable only when connected
        >
          End Call
        </Button>
      </div>
    </div>
  );
}

export default Call;
