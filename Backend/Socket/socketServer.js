const { Server } = require("socket.io");
const Chat = require("../Model/Chat");

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ New user connected:", socket.id);

    socket.on("join-room", ({ doctorId, patientId }) => {
      const roomId = [doctorId, patientId].sort().join("_");
      socket.join(roomId);
      console.log(`🧠 User joined room: ${roomId}`);
    });

    socket.on("send-message", async (messageData) => {
      console.log("📥 Server received message:", messageData);

      const {
        doctorId,
        patientId,
        senderId,
        senderModel,
        text,
        type,
        fileData,
        fileName,
      } = messageData;

      if (
        !doctorId ||
        !patientId ||
        !senderId ||
        !senderModel ||
        (!text && !fileData)
      ) {
        console.log("❌ Missing fields in messageData");
        return;
      }

      try {
        let chat = await Chat.findOne({ doctorId, patientId });
        if (!chat) chat = new Chat({ doctorId, patientId, messages: [] });

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

        const savedMessage = chat.messages[chat.messages.length - 1];

        const roomId = [doctorId, patientId].sort().join("_");
        console.log(`📡 Broadcasting to room: ${roomId}`);

        io.to(roomId).emit("receive-message", {
          _id: savedMessage._id, // 🔥 include this
          senderId: savedMessage.senderId,
          senderModel: savedMessage.senderModel,
          text: savedMessage.text,
          fileData: savedMessage.fileData,
          fileName: savedMessage.fileName,
          type: savedMessage.type,
          timestamp: savedMessage.timestamp,
        });
      } catch (error) {
        console.error("❌ Error saving message:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
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
