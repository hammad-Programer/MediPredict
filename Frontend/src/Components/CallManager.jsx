import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../Socket/socket";
import ringtone from "../assets/simple-ringtone-25290.mp3"; // incoming
import ringtone1 from "../assets/outgoing.mp3";             // outgoing
import {
  PhoneOff,
  Mic,
  MicOff,
  MonitorUp,
  Video,
  VideoOff,
} from "lucide-react";

const CallManager = ({
  userId,
  targetUserId,
  role,
  mediaType = "video",
  icon,
  targetName,
}) => {
  const myVideoRef = useRef();
  const remoteVideoRef = useRef();
  const connectionRef = useRef();
  const incomingRing = useRef(new Audio(ringtone));
  const outgoingRing = useRef(new Audio(ringtone1));
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [ringTimeoutId, setRingTimeoutId] = useState(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    socket.emit("user-online", { userId, role });

    const handleIncomingCall = ({ fromUserId, offer }) => {
      incomingRing.current.loop = true;
      incomingRing.current.play().catch((err) => console.error("Ringtone error:", err));
      const timeoutId = setTimeout(() => {
        incomingRing.current.pause();
        setIncomingCall(null);
        alert("Call timed out.");
        socket.emit("end-call", { toUserId: fromUserId });
      }, 30000);
      setRingTimeoutId(timeoutId);
      setIncomingCall({ fromUserId, offer });
    };

    const handleCallAccepted = async ({ answer }) => {
      outgoingRing.current.pause();
      await connectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setInCall(true);
      startCallTimer();
    };

    const handleIceCandidate = async ({ candidate }) => {
      await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleCallEnded = () => {
      stopAllRingtones();
      stopCallTimer();
      cleanupMedia();
      setInCall(false);
    };

    const handleCallChat = ({ fromUserId, message }) => {
      setChatMessages((prev) => [...prev, `Caller: ${message}`]);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-chat", handleCallChat);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-chat", handleCallChat);
      cleanupMedia();
      stopAllRingtones();
    };
  }, [userId, role]);

  useEffect(() => {
    if (!icon) startCall();
  }, [icon]);

  const stopAllRingtones = () => {
    incomingRing.current.pause();
    outgoingRing.current.pause();
  };

  const cleanupMedia = () => {
  const myStream = myVideoRef.current?.srcObject;
  const remoteStream = remoteVideoRef.current?.srcObject;

  if (myStream) {
    myStream.getTracks().forEach((track) => track.stop());
    myVideoRef.current.srcObject = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteVideoRef.current.srcObject = null;
  }
};


  const startCall = async () => {
    const isVideo = mediaType === "video";
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
    } catch {
      alert("Please allow camera and microphone access.");
      return;
    }

    if (isVideo && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }

    const peer = new RTCPeerConnection();
    connectionRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          toUserId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    outgoingRing.current.loop = true;
    outgoingRing.current.play().catch((err) => console.error("Ringtone error:", err));

    socket.emit("call-user", {
      toUserId: targetUserId,
      fromUserId: userId,
      offer: { sdp: offer, type: mediaType },
    });

    setTimeout(() => {
      if (!inCall) {
        outgoingRing.current.pause();
        alert("No answer. Call ended.");
        endCall();
      }
    }, 30000);
  };

  const acceptCall = async (offer, callerId) => {
    incomingRing.current.pause();
    const isVideo = mediaType === "video";
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
    } catch {
      alert("Camera/Mic permission needed.");
      return;
    }

    if (isVideo && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }

    const peer = new RTCPeerConnection();
    connectionRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          toUserId: callerId,
          candidate: event.candidate,
        });
      }
    };

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("accept-call", { toUserId: callerId, answer });

    setInCall(true);
    setIncomingCall(null);
    startCallTimer();
  };

 const endCall = () => {
  if (connectionRef.current) {
    connectionRef.current.close();
    connectionRef.current = null;
  }

  // Clear video/audio streams
  cleanupMedia();

  // Stop ringtones
  stopAllRingtones();

  // Notify the other user
  socket.emit("end-call", { toUserId: targetUserId });

  // Clear state
  stopCallTimer();
  setInCall(false);
  setIsMuted(false);
  setCameraOn(false);
  setIsSharingScreen(false);
  setChatMessages([]);
  setChatInput("");

  navigate(-1);
};



  const toggleMute = () => {
    const track = myVideoRef.current?.srcObject?.getAudioTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = myVideoRef.current?.srcObject?.getVideoTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = connectionRef.current
        .getSenders()
        .find((s) => s.track.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
      screenTrack.onended = stopScreenShare;
      setIsSharingScreen(true);
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const camTrack = camStream.getVideoTracks()[0];
    const sender = connectionRef.current
      .getSenders()
      .find((s) => s.track.kind === "video");
    if (sender) sender.replaceTrack(camTrack);
    setIsSharingScreen(false);
  };

  const startCallTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    clearInterval(timerRef.current);
    setCallDuration(0);
  };

  const acceptIncomingCall = () => {
    if (incomingCall) {
      clearTimeout(ringTimeoutId);
      acceptCall(incomingCall.offer.sdp, incomingCall.fromUserId);
    }
  };

  const rejectIncomingCall = () => {
    if (incomingCall) {
      clearTimeout(ringTimeoutId);
      incomingRing.current.pause();
      socket.emit("end-call", { toUserId: incomingCall.fromUserId });
      setIncomingCall(null);
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      socket.emit("call-chat", {
        toUserId: targetUserId,
        fromUserId: userId,
        message: chatInput,
      });
      setChatMessages((prev) => [...prev, `You: ${chatInput}`]);
      setChatInput("");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white z-50 p-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">
            Talking to {targetName || (role === "doctor" ? "Patient" : "Doctor")}
          </h2>
          <p className="text-sm text-gray-300">
            {inCall ? "Call connected" : "Waiting for the other person to join..."}
          </p>
        </div>

        {mediaType === "video" && inCall && (
          <>
            {cameraOn ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-3/4 rounded mb-2 border-4 border-red-500"
              />
            ) : (
              <div className="w-3/4 h-[60vh] rounded mb-2 border-4 border-red-500 flex items-center justify-center bg-gray-800 text-white text-3xl font-semibold">
                {targetName || "Doctor/Patient"}
              </div>
            )}
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              muted
              className="w-1/4 rounded absolute bottom-5 right-5 border-4 border-green-500"
            />
          </>
        )}

        {inCall && (
          <p className="text-lg font-mono text-green-400 mt-2">
            Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
          </p>
        )}

        <div className="flex gap-4 mt-6">
          <button onClick={toggleMute} className="bg-yellow-600 p-3 rounded-full">
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button onClick={toggleCamera} className="bg-purple-600 p-3 rounded-full">
            {cameraOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          {mediaType === "video" && (
            <button onClick={toggleScreenShare} className="bg-indigo-600 p-3 rounded-full">
              <MonitorUp size={22} />
            </button>
          )}
          <button onClick={endCall} className="bg-red-700 p-3 rounded-full">
            <PhoneOff size={22} />
          </button>
        </div>

        {inCall && (
          <div className="w-full max-w-md bg-white text-black rounded mt-6 p-3">
            <div className="h-40 overflow-y-auto border-b mb-2 text-sm">
              {chatMessages.map((msg, idx) => (
                <p key={idx} className={`mb-1 ${msg.startsWith("You:") ? "text-right text-blue-600" : "text-left text-gray-800"}`}>
                  {msg}
                </p>
              ))}
            </div>
            <div className="flex">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                className="flex-1 border p-2 rounded-l text-sm"
                placeholder="Type message..."
              />
              <button onClick={sendChatMessage} className="bg-blue-600 text-white px-4 rounded-r">Send</button>
            </div>
          </div>
        )}
      </div>

      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white text-black rounded-lg shadow-xl p-6 w-[300px] text-center animate-pulse ring-4 ring-red-400 ring-offset-2">
            <div className="flex justify-center mb-3 text-red-500 animate-bounce text-3xl">📞</div>
            <h3 className="text-lg font-semibold mb-4">Incoming {mediaType} call</h3>
            <div className="flex justify-center gap-4">
              <button onClick={acceptIncomingCall} className="bg-green-500 text-white font-bold py-2 px-4 rounded">Accept</button>
              <button onClick={rejectIncomingCall} className="bg-red-500 text-white font-bold py-2 px-4 rounded">Reject</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallManager;
