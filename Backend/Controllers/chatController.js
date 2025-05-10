const Chat = require("../Model/Chat");
const DocProfile = require("../Model/DocProfile");
const Patient = require("../Model/Patient");

// ✅ Save a new message and return messages with chatId
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

    // Attach chatId to all messages
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

// ✅ Get chat history and include chatId in each message
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    if (!doctorId || !patientId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing doctorId or patientId." });
    }

    const chat = await Chat.findOne({ doctorId, patientId })
      .populate("doctorId", "username email specialization")
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

// ✅ Edit a message
const editMessage = async (req, res) => {
  try {
    const { chatId, messageId, newText } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

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

// ✅ Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

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

// ✅ Fetch single doctor info
const doctorInfo = async (req, res) => {
  try {
    const doctor = await DocProfile.findById(req.params.doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all chat summaries for a doctor
const getDoctorChats = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const chats = await Chat.find({ doctorId }).populate("patientId", "name");

    const patients = chats.map((chat) => {
      const latestMessage =
        chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1].text || "File"
          : "No messages yet";
      return {
        _id: chat.patientId._id,
        name: chat.patientId.name,
        latestMessage,
      };
    });

    res.status(200).json({ success: true, patients });
  } catch (error) {
    console.error("Error fetching doctor chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
