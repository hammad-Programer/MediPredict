// socketServer.js
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("../Model/Chat");

const onlineUsers = new Map();
let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ [Socket] Connected: ${socket.id}`);

    socket.on("user-online", ({ userId, role }) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      console.log(`🟢 ${role} (${userId}) is online`);
      io.emit("update-user-status", { userId, status: "online" });
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} went offline`);
          io.emit("update-user-status", { userId, status: "offline" });
          break;
        }
      }
    });

    socket.on("join-room", ({ doctorId, patientId }) => {
      if (!doctorId || !patientId) return;
      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      socket.join(roomId);
      console.log(`🧠 Joined room: ${roomId}`);
    });

    socket.on("send-message", async (data) => {
      const {
        doctorId,
        patientId,
        senderId,
        senderModel,
        text,
        type,
        fileData,
        fileName,
      } = data;

      if (
        !doctorId ||
        !patientId ||
        !senderId ||
        !senderModel ||
        (!text && !fileData)
      ) {
        return console.error("❌ Invalid message payload");
      }

      try {
        let chat = await Chat.findOne({ doctorId, patientId });
        if (!chat) {
          chat = new Chat({ doctorId, patientId, messages: [] });
        }

        const newMessage = {
          senderId,
          senderModel,
          text,
          type: type || "text",
          timestamp: new Date(),
        };

        if (fileData) {
          newMessage.fileData = fileData;
          newMessage.fileName = fileName;
        }

        chat.messages.push(newMessage);
        await chat.save();

        const roomId = [String(doctorId), String(patientId)].sort().join("_");
        io.to(roomId).emit("receive-message", {
          _id: newMessage._id,
          senderId,
          senderModel,
          text,
          fileData,
          fileName,
          type,
          timestamp: newMessage.timestamp,
          chatId: chat._id,
        });
      } catch (error) {
        console.error("❌ Error sending message:", error.message);
      }
    });

    socket.on("call-user", ({ toUserId, fromUserId, offer, callType }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("incoming-call", {
          fromUserId,
          offer,
          callType,
        });
        console.log(`📞 Call from ${fromUserId} to ${toUserId} (${callType})`);
      }
    });

    socket.on("accept-call", ({ toUserId, answer }) => {
      const callerSocket = onlineUsers.get(toUserId);
      if (callerSocket) {
        io.to(callerSocket).emit("call-accepted", { answer });
      }
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", { candidate });
      }
    });

    socket.on("end-call", ({ toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended");
      }
    });

    socket.on("call-chat", ({ toUserId, fromUserId, message }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-chat", { fromUserId, message });
      }
    });
  });
};

module.exports = {
  setupSocket,
  getIO: () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
  },
};
