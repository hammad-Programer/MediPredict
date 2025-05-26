import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import socket from "../../Socket/socket";
import { useCall } from "../../Context/CallContext";
import ringtone from "../../assets/simple-ringtone-25290.mp3"; 
import { Phone, Video, Paperclip, Smile, Send, MicOff, PhoneOff, Mic, Monitor, Video as VideoIcon } from "lucide-react";






const DoctorChatWindow = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { startCall } = useCall();

  const patientName = location.state?.patient?.username || "Patient";
  const [doctorId, setDoctorId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [patientStatus, setPatientStatus] = useState("offline");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🔔 Incoming call modal states
  const incomingRingRef = useRef(new Audio(ringtone));
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
const [showVideoCallModal, setShowVideoCallModal] = useState(false);

const [isCameraOn, setIsCameraOn] = useState(true);
const [isScreenSharing, setIsScreenSharing] = useState(false);

const localVideoRef = useRef(null);
const remoteVideoRef = useRef(null);
const screenStreamRef = useRef(null);






  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setDoctorId(decoded.id);
      } catch (err) {
        console.error("[DoctorChatWindow] Invalid token:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!doctorId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/chat/get-doctor/${doctorId}`);
        const data = await res.json();
        if (data.success) {
          setProfileId(data.doctor._id);
          fetchMessages(data.doctor._id);
        }
      } catch (err) {
        console.error("[DoctorChatWindow] Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [doctorId]);

  const fetchMessages = async (docId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/history/${docId}/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("[DoctorChatWindow] Error loading messages:", err);
    }
  };

  useEffect(() => {
    if (profileId) {
      socket.emit("user-online", { userId: doctorId, role: "doctor" });
      socket.emit("join-room", { doctorId: profileId, patientId });
    }
  }, [profileId, patientId]);

  useEffect(() => {
    socket.on("update-user-status", ({ userId, status }) => {
      if (userId === patientId) {
        setPatientStatus(status);
      }
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    // ✅ Incoming call handler with modal
   socket.on("incoming-call", ({ fromUserId, offer, callType }) => {
  incomingRingRef.current.loop = true;
  incomingRingRef.current.play().catch(console.error);
  setIncomingCall(true);
  setIncomingCallType(callType);
  setIncomingFrom(fromUserId);
  setIncomingOffer(offer); // NEW
});

    return () => {
      socket.off("update-user-status");
      socket.off("receive-message");
      socket.off("incoming-call");
    };
  }, [patientId, profileId]);

  
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
        doctorId: profileId,
        patientId,
        senderId: profileId,
        senderModel: "DocProfile",
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
      if (data.success && data.messages.length > 0) {
        const savedMessage = data.messages[0];
        socket.emit("send-message", savedMessage);
        setMessages((prev) => [...prev, savedMessage]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("[DoctorChatWindow] Error sending message:", err);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const payload = {
      doctorId: profileId,
      patientId,
      senderId: profileId,
      senderModel: "DocProfile",
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };
    sendMessage(payload);
  };

  // ✅ Accept Call
  const handleAcceptCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    startCall({
      type: incomingCallType,
      userId: doctorId,
      targetUserId: incomingFrom,
      role: "doctor",
      targetName: patientName,
    });
    navigate(`/${incomingCallType}-call`, { state: { returnTo: location.pathname } });
  };

  // ✅ Reject Call
  const handleRejectCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    socket.emit("end-call", { toUserId: incomingFrom });
  };

useEffect(() => {
  if (!doctorId) return;

  const handleConnect = () => {
    console.log(`[Doctor] Socket connected with id: ${socket.id}`);
    console.log(`[Doctor] Emitting user-online for userId: ${doctorId}`);
    socket.emit("user-online", { userId: doctorId, role: "doctor" });
  };

  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);
  };
}, [doctorId]);
useEffect(() => {
  if (!doctorId) return;

  const handleConnect = () => {
    console.log(`[Doctor] Socket connected with id: ${socket.id}`);
    console.log(`[Doctor] Emitting user-online for userId: ${doctorId}`);
    socket.emit("user-online", { userId: doctorId, role: "doctor" });
  };

  socket.on("connect", handleConnect);

  // Optional: listen for a confirmation from server that user is registered online
  socket.on("user-online-confirm", (data) => {
    console.log(`[Doctor] Server confirmed user-online:`, data);
  });

  return () => {
    socket.off("connect", handleConnect);
    socket.off("user-online-confirm");
  };
}, [doctorId]);




  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold text-lg">
            {patientName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">{patientName}</h2>
            <p className={`text-xs font-medium ${patientStatus === "online" ? "text-green-600" : "text-gray-500"}`}>
              {patientStatus === "online" ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {profileId && patientId && (
            <>
      <button
  onClick={() => {
    setShowAudioCallModal(true);
    startCall({
      type: "audio",
      userId: profileId,
      targetUserId: patientId,
      role: "doctor",
      targetName: patientName,
    });

    socket.emit("call-user", {
      toUserId: patientId,
      fromUserId: profileId,
      offer: null,
      callType: "audio",
    });
  }}
  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-full transition"
>
  <Phone size={20} />
</button>


    <button
  onClick={() => {
  setShowVideoCallModal(true);

  // ✅ Get local video stream
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Store or send stream via WebRTC here
    })
    .catch((err) => console.error("Error accessing camera:", err));

  startCall({
    type: "video",
    userId: profileId,
    targetUserId: patientId,
    role: "doctor",
    targetName: patientName,
  });

  socket.emit("call-user", {
    toUserId: patientId,
    fromUserId: profileId,
    offer: null,
    callType: "video",
  });
}}

  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-full transition"
>
  <Video size={20} />
</button>



            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white via-blue-50 to-white">
        {messages.map((msg) => {
          const isSender = msg.senderId === profileId && msg.senderModel === "DocProfile";
          return (
            <div key={msg._id} className={`flex ${isSender ? "justify-end" : "justify-start"} mb-4`}>
              <div
                className={`max-w-xs md:max-w-sm p-4 rounded-2xl text-sm shadow-md transition-all ${
                  isSender ? "bg-white text-black rounded-br-none" : "bg-white text-black rounded-bl-none"
                }`}
              >
                {msg.type === "image" ? (
                  <img src={msg.fileData} alt="sent image" className="rounded-lg max-w-full" />
                ) : msg.type === "file" ? (
                  <div className="flex items-center gap-3 bg-red-50 text-gray-800 p-3 rounded-md shadow-sm">
                    <img src="/pdf-icon.png" alt="PDF" className="w-8 h-8" />
                    <div className="flex flex-col flex-grow overflow-hidden">
                      <p className="font-semibold truncate">{msg.fileName}</p>
                      <span className="text-xs text-gray-500">PDF • approx</span>
                    </div>
                    <a href={msg.fileData} download={msg.fileName} className="text-xl" title="Download">⬇️</a>
                  </div>
                ) : (
                  <p className="break-words leading-relaxed tracking-wide whitespace-pre-line">{msg.text}</p>
                )}
                <div className="text-[10px] text-gray-400 mt-2 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="w-full p-3 relative z-10">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-10 z-30 scale-75 origin-bottom-left">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" />
          </div>
        )}
        <div className="flex items-center rounded-full shadow-md px-4 py-2">
          <input
            type="file"
            accept="image/*,.pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Paperclip className="text-gray-400 hover:text-gray-600 mr-3 cursor-pointer" onClick={() => fileInputRef.current.click()} />
          <Smile className="text-gray-400 hover:text-gray-600 mr-3 cursor-pointer" onClick={() => setShowEmojiPicker((prev) => !prev)} />
          <input
            type="text"
            className="flex-grow bg-transparent focus:outline-none text-sm p-2 rounded-full"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full">
            <Send size={18} />
          </button>
        </div>
      </div>
  {showAudioCallModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
    <div className="bg-white rounded-3xl p-6 w-80 shadow-2xl flex flex-col items-center text-center relative animate-fade-in border border-gray-200">
      
      {/* Glowing Avatar */}
      <div className="relative mb-5">
        <div className="w-24 h-24 bg-blue-500 text-white text-4xl font-bold rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-300 animate-pulse">
          {patientName?.charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
      </div>

      {/* User Info */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{patientName}</h3>
      <p className="text-sm text-gray-500 animate-pulse mb-6">Calling...</p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shadow-md text-gray-600 transition"
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Hang Up */}
        <button
          onClick={() => {
            setShowAudioCallModal(false);
            socket.emit("end-call", { toUserId: patientId });
          }}
          title="End Call"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg text-white transition"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  </div>
)}

{showVideoCallModal && (
  <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
    <div className="relative w-full h-full">

      {/* Remote (Patient) Video - full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local (Doctor) Video - small in bottom right */}
      <div className="absolute bottom-24 right-6 w-56 h-36 rounded-xl overflow-hidden shadow-lg border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-2 bg-white/80 text-gray-900 text-xs px-2 py-0.5 rounded">
          You (Doctor)
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-white/60 backdrop-blur-lg rounded-full shadow-lg px-6 py-3">

        {/* Mute */}
        <button
          onClick={() => {
            const tracks = localVideoRef.current?.srcObject?.getAudioTracks();
            if (tracks && tracks[0]) {
              tracks[0].enabled = isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition ${
            isMuted ? "bg-gray-500 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          <Mic size={22} className={isMuted ? "opacity-30" : "opacity-100"} />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => {
            const tracks = localVideoRef.current?.srcObject?.getVideoTracks();
            if (tracks && tracks[0]) {
              tracks[0].enabled = isCameraOn;
              setIsCameraOn(!isCameraOn);
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition ${
            isCameraOn ? "bg-white text-gray-700 hover:bg-gray-200" : "bg-gray-500 text-white"
          }`}
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          <VideoIcon size={22} className={isCameraOn ? "opacity-100" : "opacity-30"} />
        </button>

        {/* Screen Share */}
        <button
          onClick={async () => {
            if (!isScreenSharing) {
              try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
              } catch (err) {
                console.error("Screen share error:", err);
              }
            } else {
              screenStreamRef.current?.getTracks()?.forEach((t) => t.stop());
              setIsScreenSharing(false);
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition ${
            isScreenSharing ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <Monitor size={22} />
        </button>

        {/* End Call */}
        <button
          onClick={() => {
            setShowVideoCallModal(false);
            socket.emit("end-call", { toUserId: patientId });

            localVideoRef.current?.srcObject?.getTracks()?.forEach((t) => t.stop());
            screenStreamRef.current?.getTracks()?.forEach((t) => t.stop());
          }}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition"
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  </div>
)}


      {/* ✅ Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white text-black p-6 rounded-lg shadow-lg text-center w-[300px]">
            <div className="flex flex-col items-center mb-4">
              <div className="w-5 h-5 bg-green-500 rounded-full animate-ping mb-2" />
              <p className="text-xl font-bold">
                📞 Incoming {incomingCallType === "audio" ? "Audio" : "Video"} Call
              </p>
            </div>
            <div className="flex justify-around">
              <button onClick={handleAcceptCall} className="bg-green-500 px-4 py-2 rounded text-white">
                Accept
              </button>
              <button onClick={handleRejectCall} className="bg-red-500 px-4 py-2 rounded text-white">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorChatWindow;

