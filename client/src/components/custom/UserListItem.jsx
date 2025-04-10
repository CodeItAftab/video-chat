import React, { useCallback } from "react";
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
import { useSocket } from "@/hooks/socket";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCallUser, setIsCalling } from "@/app/slices/call";

function UserListItem({ user }) {
  const [open, setOpen] = React.useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleOpen = () => {
    setOpen(!open);
  };
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleCallStart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent the dialog from closing
      console.log("Start Call Clicked");
      dispatch(setCallUser(user));
      dispatch(setIsCalling(true));

      socket.emit("call-user", { userId: user._id });
      navigate("/call");
      handleClose(); // Close the dialog after emitting the event
      // Add your logic for starting the call here
    },
    [socket, user, navigate, handleClose, dispatch]
  );

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
        <DialogContent showCloseButton={false} className={"w-[320px] p-4"}>
          <DialogHeader>
            <DialogTitle>
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
              This will start a video call with {user.name}. Are you sure?
            </DialogDescription>
            {/* <div className="mt-6 w-10/12 mx-auto flex items-center justify-center gap-2">
              <Button
                variant={"outline"}
                className={"w-1/2  cursor-pointer bg-slate-200"}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className={"w-1/2 cursor-pointer font-normal  ml-2"}
                onClick={handleCallStart}
              >
                Start Call
              </Button>
            </div> */}
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
                onClick={handleCallStart}
              >
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
