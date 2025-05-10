import React, { useEffect, useState } from "react";
import { Video, Phone } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import ChatWindow from "../../Components/ChatWindow";
import { fetchDoctorMessages } from "../../Components/Chat/chatApi";
import ChatProvider from "../../Context/ChatContext";
import { jwtDecode } from "jwt-decode";

const DoctorChat = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
    }
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await fetchDoctorMessages(doctorId);
        if (data.success) setPatients(data.patients);
      } catch (err) {
        console.error("Error loading patients:", err);
      } finally {
        setLoading(false);
      }
    };
    if (doctorId) loadPatients();
  }, [doctorId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-[300px] bg-white border-r border-gray-400 shadow-lg h-screen sticky top-0 overflow-y-auto">
        <div className="flex items-center gap-2 p-4 text-xl font-bold text-gray-600">
          <FontAwesomeIcon icon={faComment} className="text-gray-600" />
          My Chats
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No chats available yet.</div>
        ) : (
          <ul>
            {patients.map((pat) => (
              <li
                key={pat._id}
                onClick={() => setSelectedPatient(pat)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition ${
                  selectedPatient?._id === pat._id ? "bg-blue-100" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                  {pat.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">{pat.name}</h4>
                  <p className="text-xs text-gray-500">{pat.latestMessage || "Start chatting..."}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="flex-1 bg-white flex flex-col">
        {selectedPatient && doctorId ? (
          <ChatProvider doctorId={doctorId} patientId={selectedPatient._id}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-200 shadow-md border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">{selectedPatient.name}</h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex gap-3 text-blue-500">
                <Phone className="cursor-pointer" />
                <Video className="cursor-pointer" />
              </div>
            </div>
            <ChatWindow doctorId={doctorId} patientId={selectedPatient._id} senderRole="DocProfile" />
          </ChatProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a patient to start chatting.
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorChat;
