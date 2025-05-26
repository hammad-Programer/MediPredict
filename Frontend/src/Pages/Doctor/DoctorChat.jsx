import React, { useEffect, useState } from "react";
import ChatWindow from "../../Components/ChatWindow";
import { fetchDoctorMessages } from "../../Components/Chat/chatApi";
import ChatProvider from "../../Context/ChatContext";
import { jwtDecode } from "jwt-decode";
import socket from "../../Socket/socket";

const DoctorChat = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const authDoctorId = decoded.id;

        const fetchProfile = async () => {
          try {
            const res = await fetch(`http://localhost:5000/api/chat/get-doctor/${authDoctorId}`);
            const data = await res.json();
            if (data.success) {
              setDoctorId(data.doctor._id);
            }
          } catch (err) {
            console.error("Error fetching doctor profile:", err);
          }
        };

        fetchProfile();
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorId) return;
      try {
        const data = await fetchDoctorMessages(doctorId);
        if (data.success) {
          setPatients(data.patients);
        }
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    };
    loadPatients();
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && patients.length > 0) {
      patients.forEach((pat) => {
        const roomId = [String(doctorId), String(pat._id)].sort().join("_");
        socket.emit("join-room", {
          doctorId: String(doctorId),
          patientId: String(pat._id),
        });
      });
    }
  }, [doctorId, patients]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Chat with Patients</h2>

      {/* Patient list (no sidebar) */}
      <div className="flex flex-wrap gap-4 mb-6">
        {patients.length === 0 ? (
          <p className="text-gray-500">No messages from patients yet.</p>
        ) : (
          patients.map((pat) => (
            <button
              key={pat._id}
              onClick={() => setSelectedPatient(pat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedPatient?._id === pat._id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-100"
              }`}
            >
              {pat.name}
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      {selectedPatient ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <ChatProvider doctorId={doctorId} patientId={selectedPatient._id}>
            <ChatWindow
              doctorId={doctorId}
              patientId={selectedPatient._id}
              senderRole="DocProfile"
            />
          </ChatProvider>
        </div>
      ) : (
        <p className="text-gray-400 text-center">Select a patient to start chatting.</p>
      )}
    </div>
  );
};

export default DoctorChat;
