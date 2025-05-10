const express = require("express");
const {
  saveMessage,
  getChatHistory,
  editMessage,
  deleteMessage,
  doctorInfo,
  getDoctorChats,
} = require("../Controllers/chatController");

const router = express.Router();

// ✅ POST: Save a new message
router.post("/send", saveMessage);
router.get("/history/:doctorId/:patientId", getChatHistory);
router.put("/edit", editMessage);
router.delete("/delete/:chatId/:messageId", deleteMessage);
router.get("/get-doctor/:doctorId", doctorInfo);
router.get("/doctor-chats/:doctorId", getDoctorChats);

module.exports = router;
