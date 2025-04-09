import { useEffect, useState } from "react";

import { SocketContext } from "@/context/SocketContext";
import { connectSocket } from "@/lib/socket";
import { useDispatch, useSelector } from "react-redux";
import { setUsers } from "@/app/slices/user";

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

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

    () => {
      socket?.off("connect");
      socket?.off("hello");
      socket?.disconnect();
      console.log("Disconnected from server");
    };
  }, [socket, user, dispatch]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
