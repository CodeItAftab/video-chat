import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";
const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
};

export { useSocket };
// This custom hook allows you to access the socket instance from the SocketContext.
