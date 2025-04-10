import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

function IncomingCall({ open, handleClose, handleOpenChange, user }) {
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
            <Button className={"w-1/2 cursor-pointer font-normal  ml-2"}>
              Accept
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingCall;
