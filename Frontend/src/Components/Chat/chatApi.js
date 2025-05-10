import axios from "axios";

const API_URL = "http://localhost:5000/api/chat";

// Fetch chat history between doctor and patient
export const fetchChatHistory = async (doctorId, patientId) => {
  try {
    const response = await axios.get(
      `${API_URL}/history/${doctorId}/${patientId}`
    );
    return response.data; // should be an array of messages
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Send a message (optional if you also want to save through API, not just socket)
export const sendMessage = async (messageData) => {
  try {
    const response = await axios.post(`${API_URL}/send`, messageData);
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const fetchDoctorMessages = async (doctorId) => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/chat/doctor-chats/${doctorId}`, // ← FIXED
      {
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching doctor messages:", error);
    throw error;
  }
};
