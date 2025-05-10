import React, { createContext, useContext, useEffect, useState } from "react";
import socket from "../Socket/socket";
import { fetchChatHistory } from "../Components/Chat/chatApi";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

function ChatProvider({ children, doctorId, patientId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId || !patientId) return;

    const loadHistory = async () => {
      try {
        console.log("📚 Fetching chat history for:", { doctorId, patientId });
        const data = await fetchChatHistory(doctorId, patientId);
        if (data.success) {
          setMessages(data.messages);
          console.log("✅ Loaded chat history:", data.messages);
        }
      } catch (error) {
        console.error("❌ Failed to load chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [doctorId, patientId]);

  // 🧠 Join socket room
  useEffect(() => {
    if (doctorId && patientId) {
      const roomId = [doctorId, patientId].sort().join("_");
      socket.emit("join-room", { doctorId, patientId });
      console.log("🧠 Joined room:", roomId);
    }
  }, [doctorId, patientId]);

  useEffect(() => {
    const handleReceive = (message) => {
      console.log("📨 Real-time message received:", message);
      setMessages((prev) => [...prev, message]);
    };
  
    socket.on("receive-message", handleReceive);
    return () => socket.off("receive-message", handleReceive);
  }, []);
  
  

  return (
    <ChatContext.Provider value={{ messages, setMessages, loading }}>
      {children}
    </ChatContext.Provider>
  );
}

export default ChatProvider;
