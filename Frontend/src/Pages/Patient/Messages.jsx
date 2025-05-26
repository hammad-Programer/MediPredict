import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { faComment, faMicrophone, faPhone, faVideo, faSmile, faPaperclip, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Send } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import socket from "../../Socket/socket";
import { useCall } from "../../Context/CallContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchChatHistory } from "../../Components/Chat/chatApi";
import ringtone from "../../assets/simple-ringtone-25290.mp3";
import outgoingTone from "../../assets/outgoing.mp3";
import { Mic, MicOff, Video as VideoIcon, Monitor, PhoneOff } from "lucide-react";

const Messages = () => {
  const token = localStorage.getItem("token");
  const [patientId, setPatientId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [onlineDoctors, setOnlineDoctors] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null);
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [showAudioCallModal, setShowAudioCallModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);


  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenStreamRef = useRef(null);



  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const incomingRingRef = useRef(new Audio(ringtone));
  const outgoingRingRef = useRef(new Audio(outgoingTone));

  const { startCall } = useCall();
  const navigate = useNavigate();
  const location = useLocation();
  const { docid } = useParams(); // Extract docid from URL

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setPatientId(decoded.id);
      } catch (err) {
        console.error("[Messages] Invalid token:", err);
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
        console.error("[Messages] Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchDoctors();
  }, [patientId]);

  // Set selectedDoctor based on docid from URL
  useEffect(() => {
    if (docid && doctors.length > 0) {
      const doctor = doctors.find((doc) => doc._id === docid);
      if (doctor) {
        setSelectedDoctor(doctor);
      } else {
        console.error("[Messages] Doctor not found for docid:", docid);
        navigate("/messages"); // Redirect to /messages if docid is invalid
      }
    }
  }, [docid, doctors, navigate]);
  useEffect(() => {
  if (!patientId) return;

  const handleIncomingCall = ({ fromUserId, offer, callType }) => {
    console.log("[Messages.jsx] 📞 Incoming call from:", fromUserId, "Type:", callType);

    incomingRingRef.current.loop = true;
    incomingRingRef.current.play().catch(console.error);

    setIncomingCall(true);
    setIncomingCallType(callType);
    setIncomingFrom(fromUserId);
    setIncomingOffer(offer);
  };

  socket.on("incoming-call", handleIncomingCall);

  return () => {
    socket.off("incoming-call", handleIncomingCall);
  };
}, [patientId]);


  useEffect(() => {
    if (!patientId) return;

    socket.on("connect", () => {
      console.log("[Messages] Socket connected:", socket.id);
      socket.emit("user-online", { userId: patientId, role: "patient" });
    });

    socket.on("update-user-status", ({ userId, status }) => {
      setOnlineDoctors((prev) => ({ ...prev, [userId]: status }));
      console.log("[Messages] User status updated:", userId, status);
    });

    socket.on("receive-message", (msg) => {
      if (msg.doctorId === selectedDoctor?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

  

    return () => {
      socket.off("connect");
      socket.off("update-user-status");
      socket.off("receive-message");
      socket.off("incoming-call");
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    };
  }, [patientId, selectedDoctor]);

  useEffect(() => {
    if (patientId && selectedDoctor) {
      socket.emit("join-room", { doctorId: selectedDoctor._id, patientId });
      console.log("[Messages] Patient joined room:", `${selectedDoctor._id}:${patientId}`);
    }
  }, [patientId, selectedDoctor]);

  useEffect(() => {
    const loadChat = async () => {
      if (!selectedDoctor || !patientId) return;
      const data = await fetchChatHistory(selectedDoctor._id, patientId);
      if (data.success) setMessages(data.messages);
    };
    loadChat();
  }, [selectedDoctor, patientId]);

  const handleStartCall = (type) => {
  if (!selectedDoctor || !patientId) return;

  outgoingRingRef.current.loop = true;
  outgoingRingRef.current.play().catch(console.error);

  socket.emit("call-user", {
    toUserId: selectedDoctor._id,
    fromUserId: patientId,
    offer: null,
    callType: type,
  });

  if (type === "audio") {
    setShowAudioCallModal(true);
  } else if (type === "video") {
    setShowVideoCallModal(true);
  }

  setTimeout(() => {
    outgoingRingRef.current.pause();
    outgoingRingRef.current.currentTime = 0;
  }, 5000);
};


  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const payload = {
      doctorId: selectedDoctor._id,
      patientId,
      senderId: patientId,
      senderModel: "Patient",
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };

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
      console.error("[Messages] Error sending message:", err);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const payload = {
        doctorId: selectedDoctor._id,
        patientId,
        senderId: patientId,
        senderModel: "Patient",
        type: file.type.includes("pdf") ? "file" : "image",
        fileData: base64,
        fileName: file.name,
        timestamp: new Date(),
      };

      try {
        const res = await fetch("http://localhost:5000/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          socket.emit("send-message", data.messages[0]);
          setMessages((prev) => [...prev, ...data.messages]);
        }
      } catch (err) {
        console.error("[Messages] Error sending file:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const acceptCall = () => {
    if (!incomingFrom || !incomingCallType) return;
    const targetDoctor = doctors.find((doc) => doc._id === incomingFrom);
    startCall({
      type: incomingCallType,
      userId: patientId,
      targetUserId: incomingFrom,
      role: "patient",
      targetName: targetDoctor?.name || "Doctor",
      offer: incomingOffer,
    });
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    setIncomingOffer(null);
    navigate(`/${incomingCallType}-call`, { state: { returnTo: location.pathname } });
  };

  const rejectCall = () => {
    incomingRingRef.current.pause();
    incomingRingRef.current.currentTime = 0;
    setIncomingCall(false);
    socket.emit("end-call", { toUserId: incomingFrom });
  };
   const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDoctor || !patientId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doctorId", selectedDoctor._id);
    formData.append("patientId", patientId);
    formData.append("senderId", patientId);
    formData.append("senderModel", "Patient");
    formData.append("type", "file");
    formData.append("timestamp", new Date().toISOString());

    try {
      const res = await fetch("http://localhost:5000/api/chat/send-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        const savedMessage = data.messages[0];
        socket.emit("send-message", savedMessage);
        setMessages((prev) => [...prev, savedMessage]);
      }
    } catch (err) {
      console.error("[Messages] Error sending file:", err);
    }
  };
  useEffect(() => {
  const startVideo = async () => {
    if (showVideoCallModal) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        // Emit stream to peer (via WebRTC)
      } catch (err) {
        console.error("Failed to access camera:", err);
      }
    }
  };
  startVideo();
}, [showVideoCallModal]);
const toggleCamera = () => {
  const stream = localVideoRef.current?.srcObject;
  const videoTrack = stream?.getVideoTracks?.()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
  }
};
const toggleScreenShare = async () => {
  if (!isScreenSharing) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      localVideoRef.current.srcObject = screenStream;
      setIsScreenSharing(true);
    } catch (err) {
      console.error("Screen share error:", err);
    }
  } else {
    const tracks = screenStreamRef.current?.getTracks();
    tracks?.forEach((track) => track.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    localVideoRef.current.srcObject = camStream;
  }
};
useEffect(() => {
  const audioTrack = localVideoRef.current?.srcObject?.getAudioTracks?.()[0];
  if (audioTrack) {
    audioTrack.enabled = !isMuted;
  }
}, [isMuted]);

useEffect(() => {
  if (!patientId) return;

  const handleConnect = () => {
    console.log(`[Patient] Socket connected with id: ${socket.id}`);
    console.log(`[Patient] Emitting user-online for userId: ${patientId}`);
    socket.emit("user-online", { userId: patientId, role: "patient" });
  };

  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);
  };
}, [patientId]);
useEffect(() => {
  if (token) {
    try {
      const decoded = jwtDecode(token);
      setPatientId(decoded.id);
    } catch (err) {
      console.error("[Messages] Invalid token:", err);
    }
  }
}, [token]);





  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-[320px] bg-white border-r border-gray-200 shadow-lg rounded-tr-xl rounded-br-xl">
        <div className="p-5 text-xl font-bold text-gray-800 border-b border-gray-100 bg-gray-50">
          <FontAwesomeIcon icon={faComment} className="mr-2" />
          Messages
        </div>

        <div className="p-3 border-b border-gray-100 bg-white">
          <input
            type="text"
            className="w-full p-2 pl-10 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Search contacts..."
            style={{ backgroundImage: 'url(/icons/search.svg)', backgroundPosition: '10px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-150px)] bg-white">
          {doctors.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 text-center">No chats yet.</div>
          ) : (
            <ul className="space-y-1">
              {doctors.map((doc) => (
                <li
                  key={doc._id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    navigate(`/messages/${doc._id}`);
                  }}
                  className={`cursor-pointer flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                    selectedDoctor?._id === doc._id
                      ? "bg-blue-50"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={doc.imageUrl || "/default-doctor.png"}
                      className="w-11 h-11 rounded-full object-cover shadow-sm"
                      alt={doc.name}
                    />
                    {doc.speciality === "Cardiologist" && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                      <span className="text-xs text-gray-400">{doc.time || "3h"}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{doc.speciality || "Doctor"}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.lastMessage || "No messages yet"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedDoctor ? (
          <>
            {/* Chat Header */}
            <div className="h-[70px] flex items-center justify-between p-5 px-4 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDoctor.imageUrl || "/default-doctor.png"}
                  className="w-10 h-10 rounded-full object-cover"
                  alt={selectedDoctor.name}
                />
                <div>
                  <h2 className="font-semibold text-sm text-gray-800">{selectedDoctor.name}</h2>
                  <p className="text-xs text-gray-500">{selectedDoctor.speciality}</p>
                </div>
              </div>
              <div className="flex gap-3 text-blue-500">
                <FontAwesomeIcon icon={faPhone} className="cursor-pointer w-5 h-5" onClick={() => handleStartCall("audio")} />
                <FontAwesomeIcon icon={faVideo} className="cursor-pointer w-5 h-5" onClick={() => handleStartCall("video")} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scrollbar-hide">
              {messages.map((msg) => {
                const isSender = msg.senderId === patientId && msg.senderModel === "Patient";
                return (
                  <div key={msg._id} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs p-3 rounded-lg text-sm ${
                        isSender
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.type === "text" ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          {msg.fileName || "View File"}
                        </a>
                      )}
                      <span className="text-xs text-gray-300 block mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
  <div className="flex items-center w-full bg-gray-50 border border-gray-300 rounded-full px-3 py-2 shadow-sm">
    {/* Left Icons */}
    <div className="flex items-center gap-2 mr-3">
      <button className="text-gray-500 hover:text-gray-700 transition">
        <FontAwesomeIcon icon={faSmile} className="w-5 h-5" />
      </button>

      <label className="cursor-pointer text-gray-500 hover:text-gray-700 transition">
        <input type="file" className="hidden" onChange={handleFileSelect} />
        <FontAwesomeIcon icon={faPaperclip} className="w-5 h-5" />
      </label>
    </div>

    {/* Text Input */}
    <input
      type="text"
      className="flex-grow bg-transparent focus:outline-none text-sm text-gray-700 placeholder:text-gray-400"
      placeholder="Type a message..."
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSend()}
    />

    {/* Right Icons */}
    <div className="flex items-center gap-2 ml-3">
      <button className="text-gray-500 hover:text-blue-600 transition">
        <FontAwesomeIcon icon={faMicrophone} className="w-5 h-5" />
      </button>

      <button
        onClick={handleSend}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md"
      >
        <Send size={18} />
      </button>
    </div>
  </div>
</div>

          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start chatting.
          </div>
        )}
      </main>
 {showAudioCallModal && selectedDoctor && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
    <div className="bg-white rounded-3xl p-8 w-[320px] shadow-2xl flex flex-col items-center text-center animate-fade-in border border-gray-100 relative">

      {/* Doctor Avatar with Glow */}
      <div className="relative mb-6">
        {selectedDoctor.imageUrl ? (
          <img
            src={selectedDoctor.imageUrl}
            alt={selectedDoctor.name}
            className="w-28 h-28 rounded-full object-cover shadow-xl ring-4 ring-blue-400"
          />
        ) : (
          <div className="w-28 h-28 bg-blue-500 text-white text-4xl font-bold rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-400">
            {selectedDoctor.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-md"></span>
      </div>

      {/* Doctor Name & Status */}
      <h3 className="text-xl font-semibold text-gray-800 mb-1">{selectedDoctor.name}</h3>
      <p className="text-sm text-gray-500 mb-6 animate-pulse">Calling...</p>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-6">
        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shadow-lg text-gray-700 transition"
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* End Call */}
        <button
          onClick={() => {
            setShowAudioCallModal(false);
            socket.emit("end-call", { toUserId: selectedDoctor._id });
          }}
          title="End Call"
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg text-white transition"
        >
          <PhoneOff size={26} />
        </button>
      </div>

      {/* Call Timer Placeholder */}
      {/* <div className="absolute top-4 right-4 text-xs text-gray-400">00:15</div> */}
    </div>
  </div>
)}

{showVideoCallModal && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
    <div className="relative w-full h-full overflow-hidden">

      {/* Remote Doctor Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local Patient Video (Bottom Right) */}
      <div className="absolute bottom-28 right-6 w-64 h-40 bg-black border-2 border-white rounded-lg shadow-xl overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-2 text-white text-xs bg-black/40 px-2 py-0.5 rounded">
          You
        </div>
      </div>

      {/* Controls Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-5">
        {/* Mute Toggle */}
        <button
          onClick={() => {
            setIsMuted(prev => !prev);
            localVideoRef.current?.srcObject?.getAudioTracks().forEach(track => {
              track.enabled = !isMuted;
            });
          }}
          className="w-12 h-12 bg-white text-gray-700 hover:bg-gray-200 rounded-full shadow-lg flex items-center justify-center transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => {
            setIsCameraOn(prev => !prev);
            localVideoRef.current?.srcObject?.getVideoTracks().forEach(track => {
              track.enabled = !isCameraOn;
            });
          }}
          className="w-12 h-12 bg-white text-gray-700 hover:bg-gray-200 rounded-full shadow-lg flex items-center justify-center transition"
          title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          <VideoIcon size={22} />
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={async () => {
            try {
              if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setIsScreenSharing(true);
                localVideoRef.current.srcObject = screenStream;
              } else {
                setIsScreenSharing(false);
                const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideoRef.current.srcObject = userStream;
              }
            } catch (error) {
              console.error("Screen sharing error:", error);
            }
          }}
          className="w-12 h-12 bg-white text-gray-700 hover:bg-gray-200 rounded-full shadow-lg flex items-center justify-center transition"
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <Monitor size={22} />
        </button>

        {/* End Call */}
        <button
          onClick={() => {
            setShowVideoCallModal(false);
            socket.emit("end-call", { toUserId: selectedDoctor._id });
            localVideoRef.current?.srcObject?.getTracks()?.forEach(t => t.stop());
            remoteVideoRef.current?.srcObject?.getTracks()?.forEach(t => t.stop());
          }}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>

      {/* Doctor Name Top Left */}
      <div className="absolute top-6 left-6 text-white text-sm bg-black/40 px-3 py-1 rounded-full shadow">
        {selectedDoctor?.name || "Doctor"}
      </div>
    </div>
  </div>
)}




      {incomingCall && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-80 max-w-full p-6 flex flex-col items-center text-center animate-fade-in">
    
      <div className="relative mb-5">
        <div className="w-6 h-6 bg-green-500 rounded-full animate-ping absolute top-0 left-0"></div>
        <div className="w-6 h-6 bg-green-600 rounded-full relative"></div>
      </div>

      <p className="text-2xl font-semibold text-gray-900 mb-6 select-none">
        📞 Incoming {incomingCallType === "audio" ? "Audio" : "Video"} Call
      </p>

      <div className="flex w-full justify-center gap-6">
        <button
          onClick={acceptCall}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md transition"
          aria-label="Accept Call"
        >
          Accept
        </button>

        <button
          onClick={rejectCall}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold shadow-md transition"
          aria-label="Reject Call"
        >
          Reject
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Messages;
