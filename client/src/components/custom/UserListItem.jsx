import React from "react";
import { VideoCamera } from "phosphor-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

function UserListItem({ user }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(!open);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div
      className="sm:w-8/12 w-full h-16 flex items-center justify-between bg-white rounded-xl py-2 px-4 md:shadow-md shadow-sm cursor-pointer"
      onClick={handleOpen}
    >
      <div className="flex items-center gap-4 h-full">
        <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
          <img
            src={user.avatar || "https://picsum.photos/200/300"}
            alt="av"
            className="w-full object-center object-cover"
            loading="lazy"
          />
        </div>
        <span className="sm:inline-block md:text-xl text-lg ">{user.name}</span>
      </div>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger>
          <div className="flex items-center justify-center p-3 hover:bg-slate-100 rounded-full active:bg-slate-200 cursor-pointer">
            <VideoCamera weight="fill" color="#1976d4" size={24} />
          </div>
        </DialogTrigger>
        <DialogContent showCloseButton={false} className={"w-[400px] py-8"}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex w-10/12 items-center gap-4 h-full bg-slate-200 p-3 rounded-full mx-auto">
                <div className="h-8 w-8  rounded-full overflow-hidden flex items-center justify-center">
                  <img
                    src={user.avatar || "https://picsum.photos/200/300"}
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
    </div>
  );
}

export default UserListItem;
