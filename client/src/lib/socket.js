import { io } from "socket.io-client";

// let socket;

export const connectSocket = (userId) => {
  const socket = io("http://localhost:3000", {
    query: { userId },
  });
  return socket;
};
