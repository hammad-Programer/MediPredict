const { Server } = require("socket.io");

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
      if (!userId) {
        console.error("❌ [Socket] userId missing in user-online event");
        return;
      }
      onlineUsers.set(String(userId), socket.id);
      console.log(`🟢 ${role} (${userId}) is online`);
      console.log(`[Socket] Online users:`, Array.from(onlineUsers.entries()));
      // Broadcast to all clients, including those in rooms
      io.emit("update-user-status", { userId: String(userId), status: "online" });
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
      if (!doctorId || !patientId) {
        console.error("❌ [Socket] Missing doctorId or patientId in join-room");
        return;
      }
      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      socket.join(roomId);
      console.log(`🧠 [Socket] ${socket.id} joined room: ${roomId}`);
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
        console.error("❌ [Socket] Invalid message payload:", data);
        return;
      }

      const roomId = [String(doctorId), String(patientId)].sort().join("_");
      io.to(roomId).emit("receive-message", {
        _id: data._id || new Date().getTime().toString(),
        senderId,
        senderModel,
        text,
        fileData,
        fileName,
        type: type || "text",
        timestamp: new Date(data.timestamp),
        chatId: roomId,
      });
      console.log(`📤 [Socket] Message sent to room ${roomId}`);
    });

    socket.on("call-user", ({ toUserId, fromUserId, offer, callType }) => {
      if (!toUserId || !fromUserId || !offer || !callType) {
        console.error("❌ [Socket] Invalid call-user payload:", { toUserId, fromUserId, callType });
        socket.emit("call-error", { message: "Invalid call parameters" });
        return;
      }
      const targetSocketId = onlineUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("incoming-call", {
          fromUserId,
          offer,
          callType,
        });
        console.log(
          `📞 [Socket] Call from ${fromUserId} to ${toUserId} (${callType})`
        );
      } else {
        console.error(`❌ [Socket] No socket found for toUserId: ${toUserId}`);
        socket.emit("call-error", {
          message: `User ${toUserId} is not online`,
        });
      }
    });

    socket.on("accept-call", ({ toUserId, answer }) => {
      const callerSocket = onlineUsers.get(String(toUserId));
      if (callerSocket) {
        io.to(callerSocket).emit("call-accepted", { answer });
        console.log(`✅ [Socket] Call accepted, answer sent to ${toUserId}`);
      } else {
        console.error(`❌ [Socket] No socket found for toUserId: ${toUserId}`);
      }
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      const targetSocketId = onlineUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", { candidate });
        console.log(`🧊 [Socket] ICE candidate sent to ${toUserId}`);
      } else {
        console.error(`❌ [Socket] No socket found for toUserId: ${toUserId}`);
      }
    });

    socket.on("end-call", ({ toUserId, doctorId, patientId }) => {
      const targetSocketId = onlineUsers.get(String(toUserId));
      const roomId = doctorId && patientId ? [String(doctorId), String(patientId)].sort().join("_") : null;
      
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended");
        console.log(`📴 [Socket] Call ended for ${toUserId}`);
      }
      if (roomId) {
        io.to(roomId).emit("call-ended");
        console.log(`📴 [Socket] Call ended for room ${roomId}`);
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