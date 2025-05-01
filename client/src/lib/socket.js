import { io } from "socket.io-client";

// let socket;

export const connectSocket = (userId) => {
  const socket = io("https://video-chat-1ju5.onrender.com", {
    // const socket = io("http://localhost:3000", {
    query: { userId },
  });
  return socket;
};
