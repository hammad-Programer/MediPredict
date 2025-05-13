const Chat = require("../Model/Chat");
const DocProfile = require("../Model/DocProfile");
const Patient = require("../Model/Patient");

// ✅ Save a message
const saveMessage = async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      senderId,
      senderModel,
      text,
      type,
      fileData,
      fileName,
    } = req.body;

    if (!doctorId || !patientId || !senderId || !senderModel) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    let chat = await Chat.findOne({ doctorId, patientId });

    if (!chat) {
      chat = new Chat({ doctorId, patientId, messages: [] });
    }

    const newMessage = {
      senderId,
      senderModel,
      timestamp: new Date(),
      ...(text && { text }),
      ...(type && { type }),
      ...(fileData && { fileData }),
      ...(fileName && { fileName }),
    };

    chat.messages.push(newMessage);
    await chat.save();

    const messagesWithChatId = chat.messages.map((msg) => ({
      ...msg.toObject(),
      chatId: chat._id,
    }));

    return res
      .status(200)
      .json({ success: true, messages: messagesWithChatId });
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    if (!doctorId || !patientId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing doctorId or patientId." });
    }

    const chat = await Chat.findOne({ doctorId, patientId })
      .populate("doctorId", "name email")
      .populate("patientId", "username email");

    if (!chat) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messagesWithChatId = chat.messages.map((msg) => ({
      ...msg.toObject(),
      chatId: chat._id,
    }));

    return res
      .status(200)
      .json({ success: true, messages: messagesWithChatId });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Edit message
const editMessage = async (req, res) => {
  try {
    const { chatId, messageId, newText } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    const message = chat.messages.id(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });

    message.text = newText;
    await chat.save();

    return res
      .status(200)
      .json({ success: true, message: "Message updated successfully" });
  } catch (error) {
    console.error("Error editing message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete message
const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });

    const message = chat.messages.id(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });

    message.remove();
    await chat.save();

    return res
      .status(200)
      .json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get doctor profile from linked Doctor model (_id from JWT)
const doctorInfo = async (req, res) => {
  try {
    const doctor = await DocProfile.findOne({
      doctorRefId: req.params.doctorId,
    });

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all chat patients for a doctor
const getDoctorChats = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const chats = await Chat.find({ doctorId }).populate(
      "patientId",
      "username email"
    );

    const patients = chats.map((chat) => {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return {
        _id: chat.patientId._id,
        username: chat.patientId.username,
        latestMessage: lastMsg?.text || "No messages yet",
        unreadCount: 0, // Add actual logic if implementing unread tracking
      };
    });

    return res.status(200).json({ success: true, patients });
  } catch (error) {
    console.error("Error fetching doctor chats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  saveMessage,
  getChatHistory,
  editMessage,
  deleteMessage,
  doctorInfo,
  getDoctorChats,
};
