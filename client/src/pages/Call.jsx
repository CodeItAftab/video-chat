import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsCalling, setIsOnCall } from "@/app/slices/call";
import { useSocket } from "@/hooks/socket";
import { Button } from "@/components/ui/button";
import { MicrophoneSlash, Phone, VideoCameraSlash } from "phosphor-react";

function Call() {
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const localVideoBoxRef = useRef(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const currentSide = useRef("right");

  const { isCalling, callUser, isOnCall } = useSelector((state) => state.call);
  const { socket } = useSocket();
  const dispatch = useDispatch();

  const InitLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current.muted = true;
          localVideoRef.current.play();
        };
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  }, []);

  useEffect(() => {
    document.title = "Call | Video Chat App";
  }, []);

  useEffect(() => {
    InitLocalStream();
  }, [InitLocalStream]);

  useEffect(() => {
    socket?.on("call-accepted", (data) => {
      console.log("Call accepted", data);
      alert("Call accepted");
      // dispatch(setIsCalling(false));
      // dispatch(setIsOnCall(true));
    });

    return () => {
      socket?.off("call-accepted");
    };
  }, [socket, dispatch]);

  // Add confirmation before reloading or leaving the page
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      console.log("Before unload event triggered");
      // Show a confirmation dialog to the user
      event.returnValue = "Are you sure you want to leave?";
      // This is required for modern browsers to show the confirmation dialog

      // event.returnValue = ""; // Required for modern browsers to show the confirmation dialog
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="bg-black h-full w-full flex flex-col relative">
      {!isCalling && isOnCall && (
        <div className="flex relative items-center sm:justify-center justify-between lg:bg--yellow-200 md:bg--red-400 sm:bg--slate-200 p--4 h-full w-full">
          <div className="lg:w-2/3 md:w-10/12 sm:h-[95%] h-full grow--0 sm:rounded-md bg-slate--900">
            <video
              className="object-fit h-full object-center aspect-video"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            ></video>
          </div>
          <div
            ref={localVideoBoxRef}
            className="local-video-box w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-40 lg:w-40 lg:h-48 absolute lg:bottom-4 md:bottom-2 bottom-2 lg:right-10 md:right-8 right-4 rounded-md bg-slate-600"
          ></div>
        </div>
      )}
      {isCalling && (
        <div className="h-full w-full bg-slate-900 flex p-8 justify-center">
          <div className="min-h-64 min-w-64 max-h-1/2 flex flex-col items-center gap-6 bg-slate--300">
            <h1 className="text-white text-xl font-normal">Calling...</h1>
            <div className="h-24 w-24 mt-16 bg-black rounded-full overflow-hidden flex items-center justify-center">
              <img src={callUser?.avatar} alt={callUser?.name} />
            </div>
            <h2 className="text-white text-xl">{callUser?.name}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default Call;
