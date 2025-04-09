const { Server } = require("socket.io");
const User = require("../models/user");

_io = null;

const userIdToSocketId = new Map();

const ConnectSocket = (server) => {
  if (!_io) {
    _io = new Server(server, {
      cors: {
        origin: "https://video-chat-gamma-sand.vercel.app/",
        // origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    _io.on("connection", async (socket) => {
      console.log("New client connected:", socket.id);
      const { userId } = socket.handshake.query;
      if (!userId) {
        console.log("No userId provided in socket connection");
        return;
      }
      userIdToSocketId.set(userId, socket.id);
      console.log("userIdToSocketId", userIdToSocketId);

      const otherActiveUsers = [...userIdToSocketId.keys()].filter(
        (id) => id !== userId
      );

      const OtherUsersWithDetails = await User.find({
        _id: { $in: otherActiveUsers },
      }).select("name email avatar");
      // console.log("OtherUsersWithDetails", OtherUsersWithDetails);

      _io.to(socket.id).emit("hello", {
        message: "Hello from server",
        activeUsers: OtherUsersWithDetails,
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        userIdToSocketId.delete(userId);
        console.log("userIdToSocketId", userIdToSocketId);
      });
    });
  }
};

const getIO = () => {
  if (!_io) {
    throw new Error("Socket not initialized!");
  }
  return _io;
};

module.exports = {
  ConnectSocket,
  getIO,
  ActiveUsers: userIdToSocketId,
};
