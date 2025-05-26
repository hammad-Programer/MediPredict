import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { fetchDoctorMessages } from "../../Components/Chat/chatApi";

const DoctorChatList = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!doctorId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/chat/get-doctor/${doctorId}`);
        const data = await res.json();
        if (data.success) {
          const profileId = data.doctor._id;
          const patientsRes = await fetchDoctorMessages(profileId);
          if (patientsRes.success) {
            setPatients(patientsRes.patients);
            console.log("Loaded patients with unreadCount:", patientsRes.patients);
          }
        }
      } catch (err) {
        console.error("Failed to load patients", err);
      }
    };
    fetchProfile();
  }, [doctorId]);

  return (
    <>
    <h1 className="text-2xl font-bold text-blue-600 mb-4">Patients Messages</h1>
     <div className="p-6 min-h-screen">
      {patients.length === 0 ? (
        <p className="text-gray-500">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {patients.map((pat) => (
            <li key={pat._id}>
              <button
                onClick={() => navigate(`/docDashboard/messages/${pat._id}`, { state: { patient: pat } })}
                className="w-full flex items-center justify-between bg-white shadow-md p-4 rounded hover:bg-blue-50 transition"
              >
                {/* Left: name and latest message */}
                <div className="flex items-center gap-3">
  {/* Circle Avatar with First Letter */}
  <div className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center font-semibold">
    {pat.username?.charAt(0).toUpperCase()}
  </div>

  {/* Name and Latest Message */}
  <div className="text-left">
    <p className="text-sm font-semibold text-blue-700">{pat.username}</p>
    <p className="text-xs text-gray-500 truncate">
      {pat.latestMessage || "Start chatting..."}
    </p>
  </div>
</div>
                {/* Right: unread message badge */}
                {(pat.unreadCount ?? 0) > 0 && (
                  <span className="ml-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pat.unreadCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    
    </>
   
  );
};

export default DoctorChatList;
