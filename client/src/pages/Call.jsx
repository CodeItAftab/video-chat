import { useCallback, useEffect, useRef, useState } from "react";
import { useCall } from "@/hooks/call";
import {
  ArrowsClockwise,
  MicrophoneSlash,
  PhoneSlash,
  Spinner,
  VideoCamera,
  Microphone,
  VideoCameraSlash,
  ArrowsCounterClockwise,
} from "phosphor-react";

function Call() {
  const {
    localStream,
    remoteStream,
    endCall,
    switchCamera,
    isSwitchingCamera,
    isMuted = false,
    toggleMute = () => console.log("Toggle mute"),
    isVideoOff = false,
    toggleVideo = () => console.log("Toggle video"),
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isRotating, setIsRotating] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isVideoSwapped, setIsVideoSwapped] = useState(false);

  // State for draggable local video
  const [localVideoDrag, setLocalVideoDrag] = useState({
    isDragging: false,
    position: { x: null, y: null },
    initialPosition: { x: null, y: null },
    offset: { x: 0, y: 0 },
    corner: "bottom-right", // Default corner position
  });

  // Handle camera switch
  const handleRotateClick = async () => {
    if (!isSwitchingCamera) {
      setIsRotating(true);
      await switchCamera();
      setTimeout(() => setIsRotating(false), 800);
    }
  };

  // Call timer
  useEffect(() => {
    let timer;
    if (remoteStream) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [remoteStream]);

  // Format call duration
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout;
    const handleMovement = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 5000);
    };

    document.addEventListener("mousemove", handleMovement);
    document.addEventListener("touchstart", handleMovement);

    // Initial timeout
    timeout = setTimeout(() => setShowControls(false), 5000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousemove", handleMovement);
      document.removeEventListener("touchstart", handleMovement);
    };
  }, []);

  // Attach streams based on swap state
  // useEffect(() => {
  //   if (isVideoSwapped) {
  //     if (remoteStream && localVideoRef.current) {
  //       localVideoRef.current.srcObject = remoteStream;
  //     }
  //     if (localStream && remoteVideoRef.current) {
  //       remoteVideoRef.current.srcObject = localStream;
  //     }
  //   } else {
  //     if (localStream && localVideoRef.current) {
  //       localVideoRef.current.srcObject = localStream;
  //     }
  //     if (remoteStream && remoteVideoRef.current) {
  //       remoteVideoRef.current.srcObject = remoteStream;
  //     }
  //   }

  //   const localVideo = localVideoRef.current;
  //   const remoteVideo = remoteVideoRef.current;

  //   return () => {
  //     if (localVideo) {
  //       localVideo.srcObject = null;
  //     }
  //     if (remoteVideo) {
  //       remoteVideo.srcObject = null;
  //     }
  //   };
  // }, [localStream, remoteStream, isVideoSwapped]);

  useEffect(() => {
    if (isVideoSwapped) {
      // When videos are swapped
      if (remoteStream && localVideoRef.current) {
        localVideoRef.current.srcObject = remoteStream;
        localVideoRef.current.muted = false; // Unmute to hear remote audio
      }
      if (localStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = localStream;
        remoteVideoRef.current.muted = true; // Mute to prevent feedback
      }
    } else {
      // Default state
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Mute local video
      }
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false; // Unmute remote video
      }
    }

    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;

    return () => {
      if (localVideo) {
        localVideo.srcObject = null;
      }
      if (remoteVideo) {
        remoteVideo.srcObject = null;
      }
    };
  }, [localStream, remoteStream, isVideoSwapped]);
  // Handle video swap
  const handleVideoSwap = () => {
    // Toggle the video swap state
    setIsVideoSwapped(!isVideoSwapped);
  };

  // Draggable local video handlers
  const handleDragStart = (e) => {
    // Prevent default only if it's a mouse event to allow touch events to work properly
    if (e.type === "mousedown") {
      e.preventDefault();
    }

    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    const rect = e.currentTarget.getBoundingClientRect();

    setLocalVideoDrag({
      ...localVideoDrag,
      isDragging: true,
      initialPosition: { x: clientX, y: clientY },
      position:
        localVideoDrag.position.x !== null
          ? localVideoDrag.position
          : { x: rect.left, y: rect.top },
    });
  };

  const handleDragMove = useCallback(
    (e) => {
      if (!localVideoDrag.isDragging) return;

      e.preventDefault();
      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - localVideoDrag.initialPosition.x;
      const deltaY = clientY - localVideoDrag.initialPosition.y;

      // Calculate new position
      const newX = localVideoDrag.position.x + deltaX;
      const newY = localVideoDrag.position.y + deltaY;

      // Get window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Get video element dimensions
      const videoElement = e.currentTarget;
      const videoWidth = videoElement.offsetWidth;
      const videoHeight = videoElement.offsetHeight;

      // Determine which corner the video is closest to
      let corner;

      // Calculate distances to each corner
      const distToTopLeft = Math.sqrt(Math.pow(newX, 2) + Math.pow(newY, 2));
      const distToTopRight = Math.sqrt(
        Math.pow(windowWidth - newX - videoWidth, 2) + Math.pow(newY, 2)
      );
      const distToBottomLeft = Math.sqrt(
        Math.pow(newX, 2) + Math.pow(windowHeight - newY - videoHeight, 2)
      );
      const distToBottomRight = Math.sqrt(
        Math.pow(windowWidth - newX - videoWidth, 2) +
          Math.pow(windowHeight - newY - videoHeight, 2)
      );

      // Find the minimum distance
      const minDist = Math.min(
        distToTopLeft,
        distToTopRight,
        distToBottomLeft,
        distToBottomRight
      );

      if (minDist === distToTopLeft) corner = "top-left";
      else if (minDist === distToTopRight) corner = "top-right";
      else if (minDist === distToBottomLeft) corner = "bottom-left";
      else corner = "bottom-right";

      setLocalVideoDrag({
        ...localVideoDrag,
        position: { x: newX, y: newY },
        initialPosition: { x: clientX, y: clientY },
        corner,
      });
    },
    [localVideoDrag]
  );

  const handleDragEnd = useCallback(() => {
    if (!localVideoDrag.isDragging) return;

    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Get video element dimensions
    const videoElement = document.querySelector(".local-video-container");
    const videoWidth = videoElement ? videoElement.offsetWidth : 120;
    const videoHeight = videoElement ? videoElement.offsetHeight : 160;

    // Calculate final position based on corner
    let finalX, finalY;

    const padding = 24; // Padding from edges
    const controlsHeight = 120; // Height reserved for controls at bottom

    switch (localVideoDrag.corner) {
      case "top-left":
        finalX = padding;
        finalY = padding;
        break;
      case "top-right":
        finalX = windowWidth - videoWidth - padding;
        finalY = padding;
        break;
      case "bottom-left":
        finalX = padding;
        finalY = windowHeight - videoHeight - controlsHeight;
        break;
      case "bottom-right":
      default:
        finalX = windowWidth - videoWidth - padding;
        finalY = windowHeight - videoHeight - controlsHeight;
        break;
    }

    setLocalVideoDrag({
      ...localVideoDrag,
      isDragging: false,
      position: { x: finalX, y: finalY },
      corner: localVideoDrag.corner,
    });
  }, [localVideoDrag]);

  // Add event listeners for drag
  useEffect(() => {
    if (localVideoDrag.isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [handleDragEnd, handleDragMove, localVideoDrag]);

  // Set initial position on first render
  useEffect(() => {
    if (localVideoDrag.position.x === null) {
      // Default to bottom-right corner
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const videoWidth = 120; // Default width
      const videoHeight = 160; // Default height (3:4 aspect ratio)
      const padding = 24; // Padding
      const controlsHeight = 120; // Height reserved for controls

      setLocalVideoDrag({
        ...localVideoDrag,
        position: {
          x: windowWidth - videoWidth - padding,
          y: windowHeight - videoHeight - controlsHeight,
        },
        corner: "bottom-right",
      });
    }
  }, [localVideoDrag]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (localVideoDrag.position.x !== null) {
        handleDragEnd();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [localVideoDrag, handleDragEnd]);

  // Calculate local video position styles
  const getLocalVideoStyle = () => {
    if (localVideoDrag.position.x === null) {
      return {};
    }

    return {
      position: "fixed",
      left: `${localVideoDrag.position.x}px`,
      top: `${localVideoDrag.position.y}px`,
      zIndex: 20,
      touchAction: "none",
      transition: localVideoDrag.isDragging ? "none" : "all 0.3s ease-out",
    };
  };

  return (
    <div
      className="relative h-full w-full flex flex-col bg-[#111b21] overflow-hidden"
      onMouseMove={() => setShowControls(true)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Call info bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white text-sm font-medium">
              WhatsApp Call
            </span>
          </div>
          <div className="text-white text-sm font-medium">
            {remoteStream ? formatTime(callDuration) : "Connecting..."}
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-grow relative w-full">
        {/* Remote video (main view) */}
        <div className="absolute inset-0 bg-[#111b21] flex items-center justify-center">
          <video
            className="h-full w-full object-contain"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />

          {/* Loading state for remote video */}
          {localStream && !remoteStream && !isSwitchingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21]/90 text-white">
              <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center mb-4">
                <Spinner
                  size={32}
                  className="animate-spin text-white"
                  weight="bold"
                />
              </div>
              <div className="text-lg font-medium">Connecting...</div>
              <div className="mt-2 text-[#8696a0] text-sm">
                End-to-end encrypted
              </div>
            </div>
          )}
        </div>

        {/* Local video (draggable picture-in-picture) */}
        <div
          className={`local-video-container
            w-[30%] min-w-[100px] max-w-[150px] aspect-[3/4] rounded-lg overflow-hidden shadow-xl 
            border-2 border-[#00a884] 
            transition-all duration-300 z-20 cursor-move touch-none
            ${showControls ? "opacity-100" : "opacity-90"}`}
          style={getLocalVideoStyle()}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="h-full w-full relative" onClick={handleVideoSwap}>
            <video
              className="h-full w-full object-contain bg-[#1f2c34]"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            />

            {/* Loading state for local video */}
            {(!localStream && !remoteStream) || isSwitchingCamera ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1f2c34]/90 text-white">
                {isSwitchingCamera ? (
                  <>
                    <Spinner
                      size={20}
                      className="animate-spin text-[#00a884] mb-1"
                      weight="bold"
                    />
                    <span className="text-xs">Switching...</span>
                  </>
                ) : (
                  <Spinner
                    size={20}
                    className="animate-spin text-[#00a884]"
                    weight="bold"
                  />
                )}
              </div>
            ) : null}

            {/* Video off indicator */}
            {isVideoOff && localStream && !isVideoSwapped && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1f2c34] text-white">
                <div className="h-12 w-12 rounded-full bg-[#00a884]/20 flex items-center justify-center">
                  <span className="text-sm font-bold">You</span>
                </div>
              </div>
            )}

            {/* Swap indicator */}
            {isVideoSwapped && (
              <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1">
                <ArrowsCounterClockwise
                  size={12}
                  weight="bold"
                  className="text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls - WhatsApp style */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 pb-6 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0"
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Main controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Mic toggle */}
            <button
              onClick={toggleMute}
              className={`${
                isMuted ? "bg-[#ea4335]" : "bg-[#202c33]"
              } text-white p-3 h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95`}
            >
              {isMuted ? (
                <MicrophoneSlash className="h-6 w-6" weight="fill" />
              ) : (
                <Microphone className="h-6 w-6" weight="fill" />
              )}
            </button>

            {/* Camera switch button - Moved to main controls */}
            <button
              onClick={handleRotateClick}
              disabled={isSwitchingCamera}
              className="bg-[#202c33] text-white p-3 h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg transition-transform active:scale-95"
              title="Switch camera (front/back)"
            >
              <ArrowsClockwise
                className={`h-6 w-6 ${isRotating ? "animate-spin" : ""}`}
                weight="fill"
              />
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              className="bg-[#ea4335] text-white p-3 h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <PhoneSlash className="h-7 w-7 sm:h-8 sm:w-8" weight="fill" />
            </button>

            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className={`${
                isVideoOff ? "bg-[#ea4335]" : "bg-[#202c33]"
              } text-white p-3 h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95`}
            >
              {isVideoOff ? (
                <VideoCameraSlash className="h-6 w-6" weight="fill" />
              ) : (
                <VideoCamera className="h-6 w-6" weight="fill" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* End-to-end encrypted label */}
      <div
        className={`absolute bottom-2 left-0 right-0 text-center text-xs text-[#8696a0] transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        End-to-end encrypted
      </div>
    </div>
  );
}

export default Call;
