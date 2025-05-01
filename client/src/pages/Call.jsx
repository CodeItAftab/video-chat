import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCall } from "@/hooks/call";
import {
  ArrowsClockwise,
  MicrophoneSlash,
  PhoneSlash,
  Spinner,
  VideoCamera,
} from "phosphor-react";

function Call() {
  const { localStream, remoteStream, endCall, switchCamera } = useCall(); // ✅ include switchCamera
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateClick = async () => {
    setIsRotating(true);
    await switchCamera(); // ✅ Switch camera while on call
    setTimeout(() => setIsRotating(false), 800); // Shorter spin time
  };

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    return () => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [remoteStream]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black">
      <div className="flex md:flex-row flex-col w-full items-center justify-center md:gap-8 gap-3 md:p-8 px-2 py-3 flex-grow bg-black">
        <div className="relative md:w-1/2 w-auto md:h-full h-[45%] rounded-2xl bg-white">
          <video
            className="size-full object-cover bg-black h-full"
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          />
          {!localStream && (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center text-white">
              <Spinner size={40} className="animate-spin" />
            </div>
          )}
        </div>

        <div className="relative md:w-1/2 w-auto md:h-full h-[45%] rounded-2xl bg-white">
          <video
            className="size-full object-cover bg-black h-full"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />
          {localStream && !remoteStream && (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center text-white">
              <Spinner size={40} className="animate-spin" />
            </div>
          )}
          {!localStream && !remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Please wait...
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:h-20 h-16 flex justify-center bg-black/90 shrink-0">
        <div className="flex items-center justify-center gap-4 md:w-[400px] w-3/4 h-10/12 rounded-md bg-slate-700">
          <Button className="text-white p-3 size-10 rounded-full text-lg font-semibold">
            <VideoCamera className="text-white size-6" weight="duotone" />
          </Button>

          <Button className="text-white p-3 size-10 rounded-full text-lg font-semibold">
            <MicrophoneSlash className="text-white size-6" weight="duotone" />
          </Button>

          <Button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full text-lg font-semibold"
          >
            <PhoneSlash className="text-white size-6" weight="duotone" />
          </Button>

          <Button
            onClick={handleRotateClick}
            className="text-white size-10 p-3 rounded-full text-lg font-semibold"
          >
            <ArrowsClockwise
              className={`text-white size-6 ${
                isRotating ? "animate-once-spin" : ""
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
