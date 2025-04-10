import { useCallback, useEffect, useState } from "react";

import { SocketContext } from "@/context/SocketContext";
import { connectSocket } from "@/lib/socket";
import { useDispatch, useSelector } from "react-redux";
import { setUsers } from "@/app/slices/user";
import { useNavigate } from "react-router-dom";
import IncomingCall from "@/components/custom/IncommingCallDialog";
import { setCallUser } from "@/app/slices/call";

const SocketProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { callUser, isOnCall, isCalling } = useSelector((state) => state.call);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOpenChange = useCallback((open) => {
    setOpen(!open);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!socket && user) {
      const sc = connectSocket(user?._id);
      setSocket(sc);
    }

    socket?.on("connect", () => {
      console.log("Connected to server with socketId", socket.id);
    });

    socket?.on("hello", (data) => {
      console.log("Received hello event from server:", data);
      dispatch(setUsers(data.activeUsers));
    });

    socket?.on("incomming-call", ({ from, user }) => {
      console.log(
        "Received incomming call event from server:",
        user?.name,
        from
      );
      // alert(`Incoming call from ${user?.name} with socketId ${from}`);
      dispatch(setCallUser(user));
      setOpen(true);
      // Only open the dialog if the user is not in a call and is on the home page
      if (!isOnCall && !isCalling && location.pathname === "/home") {
        dispatch(setCallUser(user));
        setOpen(true);
      }

      if (isOnCall || isCalling) {
        socket?.emit("busy", { userId: user._id });
      }
    });

    () => {
      socket?.off("connect");
      socket?.off("hello");
      socket?.off("incomming-call");
      socket?.disconnect();
      console.log("Disconnected from server");
    };
  }, [socket, user, dispatch, navigate, isOnCall, isCalling]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
      {open && (
        <IncomingCall
          open={open}
          handleClose={handleClose}
          handleOpenChange={handleOpenChange}
          user={callUser}
        />
      )}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
