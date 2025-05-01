const { Server } = require("socket.io");
const User = require("../models/user");
const user = require("../models/user");

_io = null;

const userIdToSocketId = new Map();

const ConnectSocket = (server) => {
  if (!_io) {
    _io = new Server(server, {
      cors: {
        origin: "https://video-chat-gamma-sand.vercel.app",
        // origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    _io.on("connection", async (socket) => {
      console.log("New client connected:", socket.id);
      // const { userId } = socket.handshake.query;
      const yourId = socket.handshake.query.userId;
      const myData = await User.findById(yourId).select("name email avatar");
      if (!yourId) {
        console.log("No userId provided in socket connection");
        return;
      }
      userIdToSocketId.set(yourId, socket.id);
      console.log("userIdToSocketId", userIdToSocketId);

      const otherActiveUsers = [...userIdToSocketId.keys()].filter(
        (id) => id !== yourId
      );

      const OtherUsersWithDetails = await User.find({
        _id: { $in: otherActiveUsers },
      }).select("name email avatar");
      // console.log("OtherUsersWithDetails", OtherUsersWithDetails);

      _io.to(socket.id).emit("hello", {
        message: "Hello from server",
        activeUsers: OtherUsersWithDetails,
      });

      // Notify Each Active User that a new user has come online and send the user details
      for (const userId of otherActiveUsers) {
        const socketId = userIdToSocketId.get(userId);
        if (socketId) {
          _io.to(socketId).emit("new-user-came-online", {
            user: myData,
          });
        }
      }

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        userIdToSocketId.delete(yourId);
        console.log("userIdToSocketId", userIdToSocketId);

        // Notify Each Active User that a user has gone offline

        const otherActiveUsers = [...userIdToSocketId.keys()].filter(
          (id) => id !== yourId
        );

        for (const userId of otherActiveUsers) {
          const socketId = userIdToSocketId.get(userId);
          if (socketId) {
            _io.to(socketId).emit("user-went-offline", {
              user: myData,
            });
          }
        }
      });

      socket.on("initiate-call", async ({ userId, signalData }) => {
        //
        console.log("initiate-call", {
          userId,
          signalData,
        });
        const to = userIdToSocketId.get(userId);

        _io.to(to).emit("incomming-call", {
          signalData,
          user: myData,
        });
      });

      socket.on("answer-call", (data) => {
        to = userIdToSocketId.get(data.userId);
        _io.to(to).emit("call-accepted", { signalData: data.signalData });
        console.log("callAccepted", data.signalData);
      });

      socket.on("endCall", ({ to }) => {
        _io.to(to).emit("callEnded");
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
