import React, { useRef, useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import socket from "../../Socket/socket";
import { useChat } from "../../Context/ChatContext";

const MessageInput = ({ currentUserId, currentUserRole, receiverId }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const { messages, setMessages } = useChat(); // ✅ fixed: messages was undefined

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      const messagePayload = {
        doctorId: currentUserRole === "Patient" ? receiverId : currentUserId,
        patientId: currentUserRole === "Patient" ? currentUserId : receiverId,
        senderId: currentUserId,
        senderModel: currentUserRole,
        type: file.type.includes("pdf") ? "file" : "image",
        fileData: base64,
        fileName: file.name,
        timestamp: new Date(),
      };

      await sendMessage(messagePayload);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (payload) => {
    try {
      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const roomId = [String(payload.doctorId), String(payload.patientId)].sort().join("_");
        socket.emit("send-message", payload);

        // ✅ Prevent duplicates
        const newMessages = data.messages.filter(
          (msg) => !messages.some((m) => m._id === msg._id)
        );

        setMessages((prev) => [...prev, ...newMessages]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const messagePayload = {
      doctorId: currentUserRole === "Patient" ? receiverId : currentUserId,
      patientId: currentUserRole === "Patient" ? currentUserId : receiverId,
      senderId: currentUserId,
      senderModel: currentUserRole,
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };

    sendMessage(messagePayload);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="w-full bg-white p-3 relative z-10">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-10 z-30 scale-75 origin-bottom-left">
          <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
        </div>
      )}

      <div className="flex items-center bg-gray-200 rounded-full shadow-md px-4 py-2">
        <input
          type="file"
          accept="image/*,.pdf"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <Paperclip
          className="text-gray-400 hover:text-gray-600 mr-3 cursor-pointer"
          onClick={() => fileInputRef.current.click()}
        />

        <Smile
          className="text-gray-400 hover:text-gray-600 mr-3 cursor-pointer"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        />

        <input
          type="text"
          className="flex-grow bg-transparent focus:outline-none text-sm p-2 rounded-full"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <button
          onClick={handleSend}
          className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
