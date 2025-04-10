// import { Button } from "@/components/ui/button";
// import { MicrophoneSlash, Phone, VideoCameraSlash } from "phosphor-react";
// import React, { useCallback, useEffect, useRef, useState } from "react";

// function Call() {
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const InitLocalStream = useCallback(async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: false,
//     });

//     setLocalStream(stream);
//     localVideoRef.current.srcObject = stream;
//     // Wait for the video metadata to load before playing
//     localVideoRef.current.onloadedmetadata = () => {
//       localVideoRef.current.muted = true;
//       localVideoRef.current.play();
//     };
//   }, []);

//   useEffect(() => {
//     document.title = "Call | Video Chat App";
//   }, []);

//   useEffect(() => {
//     InitLocalStream();
//   }, [InitLocalStream]);

//   return (
//     <div className="bg-black  h-full w-full flex flex-col relative">
//       <div className="flex relative items-center justify-center lg:bg--yellow-200 md:bg--red-400 sm:bg--slate-200 p--4 h-full w-full">
//         <div className="lg:w-2/3 md:w-10/12 h-[95%] grow--0 rounded-md bg-slate-900">
//           <video
//             className="object-contain  h-full object-center aspect-video"
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//           ></video>
//         </div>
//         <div className="local-video-box w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-40 lg:w-40 lg:h-48 absolute lg:bottom-4 md:bottom-2 bottom-2  lg:right-10 md:right-8  right-4 rounded-md bg-slate-600"></div>
//       </div>
//       <div className="control-panel h-24 w-full flex justify-center items--center bg-slate--700">
//         <div className="w-fit h-16 flex rounded-md items-center justify-center gap-8 bg-slate-200 p-2 md:px-20 px-10">
//           <Button className={"w-12  cursor-pointer h-12 rounded-full"}>
//             <VideoCameraSlash
//               size={24}
//               style={{ width: "24px", height: "24px" }}
//             />
//           </Button>
//           <Button className={"w-12 cursor-pointer  h-12 rounded-full"}>
//             <MicrophoneSlash
//               size={24}
//               style={{ width: "24px", height: "24px" }}
//             />
//           </Button>
//           <Button
//             className={"w-12 cursor-pointer  h-12 rounded-full bg-red-600"}
//           >
//             <Phone size={24} style={{ width: "24px", height: "24px" }} />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Call;

import { Button } from "@/components/ui/button";
import { MicrophoneSlash, Phone, VideoCameraSlash } from "phosphor-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

function Call() {
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const localVideoBoxRef = useRef(null);
  const isDragging = useRef(false); // To track drag state
  const offset = useRef({ x: 0, y: 0 }); // To store mouse offset
  // const initialPosition = useRef({ left: "16px", top: "8px" }); // Initial position
  const currentSide = useRef("right"); // Track which side the box is on

  const { isCalling, callUser } = useSelector((state) => state.call); // Assuming you have call data in your Redux store

  // const InitLocalStream = useCallback(async () => {
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: false,
  //   });

  //   setLocalStream(stream);
  //   localVideoRef.current.srcObject = stream;
  //   localVideoRef.current.onloadedmetadata = () => {
  //     localVideoRef.current.muted = true;
  //     localVideoRef.current.play();
  //   };
  // }, []);

  const InitLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setLocalStream(stream);

      // Ensure the ref is attached before setting the srcObject
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

  const handleMouseDown = (e) => {
    const box = localVideoBoxRef.current;
    const rect = box.getBoundingClientRect();

    // Calculate the offset of the mouse pointer relative to the box
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    isDragging.current = true;

    // Disable CSS transitions during dragging
    box.style.transition = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    const parent =
      localVideoBoxRef.current.parentElement.getBoundingClientRect();
    const box = localVideoBoxRef.current;

    // Calculate new position
    let x = e.clientX - offset.current.x;
    let y = e.clientY - offset.current.y;

    // Ensure it stays within vertical bounds
    const spacing = 16; // Matches `right-4` and `bottom-2` (4 * 4px = 16px)
    y = Math.max(
      spacing,
      Math.min(y, parent.height - box.offsetHeight - spacing)
    );

    // Update box position
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) return;

    const parent =
      localVideoBoxRef.current.parentElement.getBoundingClientRect();
    const box = localVideoBoxRef.current;

    // Calculate final position
    const boxCenterX = e.clientX;
    const parentCenterX = parent.left + parent.width / 2;

    // Determine which side to snap to
    const spacing = 16; // Matches `right-4` and `bottom-2` (4 * 4px = 16px)
    if (boxCenterX < parentCenterX) {
      // Snap to the left
      box.style.left = `${spacing}px`;
      currentSide.current = "left";
    } else {
      // Snap to the right
      box.style.left = `${parent.width - box.offsetWidth - spacing}px`;
      currentSide.current = "right";
    }

    // Restore CSS transitions for smooth snapping
    box.style.transition = "left 0.3s ease, top 0.3s ease";

    isDragging.current = false;
  };

  const handleTouchMove = (e) => {
    const parent =
      localVideoBoxRef.current.parentElement.getBoundingClientRect();
    const box = localVideoBoxRef.current;

    let x = e.touches[0].clientX - box.offsetWidth / 2;
    let y = e.touches[0].clientY - box.offsetHeight / 2;

    // Ensure it stays within vertical bounds
    const spacing = 16;
    y = Math.max(
      spacing,
      Math.min(y, parent.height - box.offsetHeight - spacing)
    );

    // Update box position
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
  };

  const handleTouchEnd = (e) => {
    const parent =
      localVideoBoxRef.current.parentElement.getBoundingClientRect();
    const box = localVideoBoxRef.current;

    // Calculate final position
    const boxCenterX = e.changedTouches[0].clientX;
    const parentCenterX = parent.left + parent.width / 2;

    // Determine which side to snap to
    const spacing = 16;
    if (boxCenterX < parentCenterX) {
      // Snap to the left
      box.style.left = `${spacing}px`;
      currentSide.current = "left";
    } else {
      // Snap to the right
      box.style.left = `${parent.width - box.offsetWidth - spacing}px`;
      currentSide.current = "right";
    }

    // Restore CSS transitions for smooth snapping
    box.style.transition = "left 0.3s ease, top 0.3s ease";
  };

  return (
    <div
      className="bg-black h-full w-full flex flex-col relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isCalling && (
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
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              bottom: "8px", // Matches `bottom-2` (2 * 4px = 8px)
              right: "16px", // Matches `right-4` (4 * 4px = 16px)
              transition: "left 0.3s ease, top 0.3s ease", // Smooth transitions
            }}
          >
            <video
              className="object-cover h-full object-center aspect-video"
              // ref={localVideoRef}
              autoPlay
              playsInline
              muted
            ></video>
          </div>
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

      <div
        className={`control-panel sm:h-24 h-[72px] w-full flex justify-center sm:items-start items-center ${
          isCalling && "bg-slate-900"
        }`}
      >
        <div className="sm:w-fit sm:h-16 w-full h-full flex sm:rounded-md items-center justify-center gap-8 bg-slate-700 p-2 md:px-16 px-10">
          <Button
            className={
              "w-12 cursor-pointer active:scale-95 bg-slate-500 h-12 rounded-full"
            }
          >
            <VideoCameraSlash
              size={24}
              style={{ width: "24px", height: "24px" }}
            />
          </Button>
          <Button
            className={
              "w-12 cursor-pointer active:scale-95 bg-slate-500 h-12 rounded-full"
            }
          >
            <MicrophoneSlash
              size={24}
              style={{ width: "24px", height: "24px" }}
            />
          </Button>
          <Button
            className={
              "w-12 cursor-pointer active:scale-95 h-12 rounded-full bg-red-500 hover:bg-red-700"
            }
          >
            <Phone size={24} style={{ width: "24px", height: "24px" }} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Call;
