import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useSocket } from "@/hooks/socket";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setIsOnCall } from "@/app/slices/call";

function IncomingCall({ open, setOpen, user }) {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  console.log(user, "user in incoming call");

  const handleClose = useCallback(() => {
    setOpen(false);
    socket?.emit("reject-call", { userId: user?._id });
  }, [setOpen, socket, user]);

  const handleOpenChange = useCallback(
    (open) => {
      setOpen(!open);
    },
    [setOpen]
  );

  const handleAccept = useCallback(() => {
    setOpen(false);
    socket?.emit("accept-call", { userId: user?._id });
    dispatch(setIsOnCall(true));
    navigate("/call", { replace: true });
  }, [setOpen, socket, user, navigate, dispatch]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger></DialogTrigger>
      <DialogContent showCloseButton={false} className={"w-[320px] p-4"}>
        <DialogHeader>
          <DialogTitle className={"flex flex-col gap-4"}>
            <span className="shrink-0 h-6 font-normal text-center ">
              Incominng Call
            </span>
            <div className="flex w-full flex-col items-center gap-2  bg--slate-200 p-1">
              <div className="h-16 w-16  bg-black rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={
                    "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg"
                  }
                  // src={user?.avatar}
                  alt="av"
                  className="w-full object-center object-cover"
                  loading="lazy"
                />
              </div>
              <span className="sm:inline-block md:text-xl text-lg ">
                {user?.name || "Aftab Alam"}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className={"hidden"}>
            This will start a video call with {user?.name}. Are you sure?
          </DialogDescription>
          <div className="mt-6 w-full mx-auto flex items-center justify-center gap-2 px-3">
            <Button
              variant={"outline"}
              className={"w-1/2  cursor-pointer bg-slate-200"}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className={"w-1/2 cursor-pointer font-normal  ml-2"}
              onClick={handleAccept}
            >
              Accept
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingCall;
