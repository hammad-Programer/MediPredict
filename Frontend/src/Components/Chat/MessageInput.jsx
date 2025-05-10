import React, { useState, useRef } from "react";
import { useChat } from "../../Context/ChatContext";
import socket from "../../Socket/socket";
import { Smile, Paperclip } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

function MessageInput({ currentUserId, receiverId, currentUserRole = "Patient" }) {
  const { setMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (newMessage.trim() === "") return;

    const messagePayload = {
      doctorId: currentUserRole === "Patient" ? receiverId : currentUserId,
      patientId: currentUserRole === "Patient" ? currentUserId : receiverId,
      senderId: currentUserId,
      senderModel: currentUserRole,
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };

    try {
      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });

      const data = await res.json();
      if (data.success) {
        socket.emit("send-message", messagePayload);
        setMessages((prev) => [...prev, ...data.messages.slice(prev.length)]); // Append only new
        setNewMessage("");
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileMessage = {
        doctorId: currentUserRole === "Patient" ? receiverId : currentUserId,
        patientId: currentUserRole === "Patient" ? currentUserId : receiverId,
        senderId: currentUserId,
        senderModel: currentUserRole,
        type: file.type.startsWith("image/") ? "image" : "file",
        fileName: file.name,
        fileData: reader.result,
        timestamp: new Date(),
      };

      try {
        const res = await fetch("http://localhost:5000/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fileMessage),
        });

        const data = await res.json();
        if (data.success) {
          socket.emit("send-message", fileMessage);
          setMessages((prev) => [...prev, ...data.messages.slice(prev.length)]);
        }
      } catch (err) {
        console.error("❌ Error sending file:", err);
      }
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-white p-3 relative z-10">
      {/* Emoji Picker */}
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
          className="ml-3 flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full text-sm"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
