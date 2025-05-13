import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Phone, Video } from "lucide-react";
import ChatProvider from "../../Context/ChatContext";
import ChatWindow from "../../Components/ChatWindow";
import { io } from "socket.io-client";
import { useCall } from "../../Context/CallContext";

// Create socket connection
const socket = io("http://localhost:5000");

const DoctorChatWindow = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { startCall } = useCall();

  const patientName = location.state?.patient?.username || "Patient";
  const [doctorId, setDoctorId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [patientStatus, setPatientStatus] = useState("offline");

  // Decode token and extract doctor ID
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setDoctorId(decoded.id);
    }
  }, []);

  // Fetch full doctor profile ID
  useEffect(() => {
    const fetchProfile = async () => {
      if (!doctorId) return;
      const res = await fetch(`http://localhost:5000/api/chat/get-doctor/${doctorId}`);
      const data = await res.json();
      if (data.success) {
        setProfileId(data.doctor._id);
      }
    };
    fetchProfile();
  }, [doctorId]);

  // Emit online status
  useEffect(() => {
    if (profileId) {
      socket.emit("user-online", { userId: profileId, role: "doctor" });
      return () => socket.disconnect();
    }
  }, [profileId]);

  // Listen to patient's online/offline updates
  useEffect(() => {
    socket.on("update-user-status", ({ userId, status }) => {
      if (userId === patientId) {
        setPatientStatus(status);
      }
    });
    return () => socket.off("update-user-status");
  }, [patientId]);

  return (
    <div className="p-6 bg-white shadow rounded max-w-4xl mx-auto min-h-screen">
      {/* ✅ Chat Header */}
      <div className="flex items-center justify-between bg-blue-100 px-4 py-3 rounded-t shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center font-semibold">
            {patientName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-blue-800">{patientName}</p>
            <p className="text-xs text-gray-600">
              {patientStatus === "online" ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* ✅ Call Icons */}
        <div className="flex gap-4 text-blue-600">
          {profileId && patientId && (
            <>
              <button
                onClick={() => {
                  startCall({
                    type: "audio",
                    userId: profileId,
                    targetUserId: patientId,
                    role: "doctor",
                  });
                  navigate("/audio-call", {
                    state: { returnTo: location.pathname },
                  });
                }}
                className="hover:text-blue-800"
                title="Start Audio Call"
              >
                <Phone />
              </button>

              <button
                onClick={() => {
                  startCall({
                    type: "video",
                    userId: profileId,
                    targetUserId: patientId,
                    role: "doctor",
                  });
                  navigate("/video-call", {
                    state: { returnTo: location.pathname },
                  });
                }}
                className="hover:text-blue-800"
                title="Start Video Call"
              >
                <Video />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ✅ Chat Body */}
      <div className="mt-4">
        {profileId ? (
          <ChatProvider doctorId={profileId} patientId={patientId}>
            <ChatWindow doctorId={profileId} patientId={patientId} senderRole="DocProfile" />
          </ChatProvider>
        ) : (
          <p className="text-gray-500">Loading chat...</p>
        )}
      </div>
    </div>
  );
};

export default DoctorChatWindow;
