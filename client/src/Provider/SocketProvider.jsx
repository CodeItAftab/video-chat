import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket } from "@/lib/socket";
import { SocketContext } from "@/context/SocketContext";
import { setActiveusers } from "@/app/slices/user";

const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket && user) {
      const sc = connectSocket(user?._id);
      setSocket(sc);
    }
  }, [socket, user]);

  useEffect(() => {
    socket?.on("connect", () => {
      console.log("Connected to server with socketId", socket.id);
    });

    socket?.on("hello", (data) => {
      console.log("Received hello event from server:", data);
      dispatch(setActiveusers(data.activeUsers));
    });

    return () => {
      socket?.off("connect");
      socket?.off("hello");
    };
  }, [socket, dispatch]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
