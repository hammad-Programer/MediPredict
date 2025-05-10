import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import ChatWindow from "../../Components/ChatWindow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { Phone, Video } from "lucide-react";
import ChatProvider from "../../Context/ChatContext";

const Messages = () => {
  const token = localStorage.getItem("token");
  const [patientId, setPatientId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setPatientId(decoded.id);
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, [token]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/appointments/chat-doctors/${patientId}`);
        const data = await res.json();
        if (data.success) setDoctors(data.doctors);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchDoctors();
  }, [patientId]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[300px] bg-white border-r border-gray-300 shadow flex flex-col">
        <div className="flex items-center gap-2 p-4 text-xl font-bold text-gray-600 border-b">
          <FontAwesomeIcon icon={faComment} />
          My Chats
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No chats yet.</div>
          ) : (
            <ul>
              {doctors.map((doc) => (
                <li
                  key={doc._id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 ${
                    selectedDoctor?._id === doc._id ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.imageUrl || "/default-doctor.png"}
                      alt={doc.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">Dr. {doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.speciality}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedDoctor ? (
          <ChatProvider doctorId={selectedDoctor._id} patientId={patientId}>
            {/* Header */}
            <div className="h-[70px] flex items-center justify-between px-4 bg-gray-200 shadow shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDoctor.imageUrl || "/default-doctor.png"}
                  className="w-10 h-10 rounded-full object-cover"
                  alt={selectedDoctor.name}
                />
                <div>
                  <h2 className="font-semibold text-sm">Dr. {selectedDoctor.name}</h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex gap-3 text-blue-500">
                <Phone className="cursor-pointer" />
                <Video className="cursor-pointer" />
              </div>
            </div>

            {/* Chat window */}
            <div className="flex-1 flex flex-col overflow-hidden">
            <ChatWindow doctorId={selectedDoctor._id} patientId={patientId} senderRole="Patient" />
            </div>
          </ChatProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a doctor to start chatting.
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
