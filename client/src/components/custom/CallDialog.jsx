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

function CallDialog({ open, handleClose, handleOpenChange, user }) {
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger></DialogTrigger>
      <DialogContent showCloseButton={false} className={"w-[400px] py-8"}>
        <DialogHeader>
          <DialogTitle>
            <div className="flex w-10/12 items-center gap-4 h-full bg-slate-200 p-3 rounded-full mx-auto">
              <div className="h-8 w-8  rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={user.avatar}
                  alt="av"
                  className="w-full object-center object-cover"
                  loading="lazy"
                />
              </div>
              <span className="sm:inline-block md:text-xl text-lg ">
                {user.name}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className={"hidden"}>
            This will start a video call with {user.name}. Are you sure?
          </DialogDescription>
          <div className="mt-6 w-10/12 mx-auto flex items-center justify-center gap-2">
            <Button
              variant={"outline"}
              className={"w-1/2  cursor-pointer bg-slate-200"}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button className={"w-1/2 cursor-pointer font-normal  ml-2"}>
              Start Call
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default CallDialog;
