import { useEffect } from "react";
import { useCall } from "@/hooks/call";

function Call() {
  const {
    isCalling,
    callUser: user,
    myVideoRef,
    peerVideoRef,

    initializeMediaStream,
  } = useCall();

  // Ensure media stream is initialized when the component mounts
  useEffect(() => {
    initializeMediaStream();
  }, [initializeMediaStream]);

  console.log("isCalling", isCalling);

  return (
    <div className="h-full w-full bg-white/90">
      {isCalling && (
        <div className="h-full w-full flex items-center justify-center">
          <div className="flex sm:w-[400px] sm:h-[400px] h-full w-full flex-col items-center sm:justify-around justify-between py-12 gap-2 bg--slate-200 p-1">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-16 w-16 bg-black rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={
                    "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg"
                  }
                  alt="av"
                  className="w-full object-center object-cover"
                  loading="lazy"
                />
              </div>
              <span className="sm:inline-block md:text-xl text-lg">
                {user?.name || "Aftab Alam"}
              </span>
              {isCalling && (
                <span className="font-work-sans w-full animate-pulse text-blue-700 h-5 flex items-center justify-center font-normal text-base text-center mx-auto">
                  Calling...
                </span>
              )}

              <button type="button">End Call</button>
            </div>
          </div>
        </div>
      )}
      {!isCalling && (
        <div className="h-full w-full bg-black/90 flex flex-col">
          <div className="flex-grow flex md:flex-row flex-col p-8 gap-8 items-center justify-center">
            <video
              className="md:w-1/2 w-full md:h-full h-1/2 bg-slate-800 rounded-2xl object-fill"
              autoPlay
              playsInline
              muted
              ref={myVideoRef}
            ></video>
            <video
              className="md:w-1/2 w-full md:h-full h-1/2 bg-slate-800 rounded-2xl"
              autoPlay
              playsInline
              muted
              ref={peerVideoRef}
            ></video>
          </div>
        </div>
      )}
    </div>
  );
}

export default Call;
