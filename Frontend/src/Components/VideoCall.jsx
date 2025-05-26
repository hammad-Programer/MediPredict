import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../Socket/socket";
import { useCall } from "../Context/CallContext";
import ringtone from "../assets/simple-ringtone-25290.mp3";
import ringtone1 from "../assets/outgoing.mp3";
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";

const VideoCall = () => {
  const { callData, callType } = useCall();
  const navigate = useNavigate();

  const connectionRef = useRef();
  const myStream = useRef(null);
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const incomingRing = useRef(new window.Audio(ringtone));
  const outgoingRing = useRef(new window.Audio(ringtone1));
  const timerRef = useRef();
  const callTimeoutRef = useRef();

  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [callStatus, setCallStatus] = useState("Ringing...");

  const userId = callData?.userId;
  const targetUserId = callData?.targetUserId;
  const role = callData?.role;
  const targetName = callData?.targetName;

  useEffect(() => {
    if (!userId || !targetUserId || callType !== "video") return;

    socket.emit("user-online", { userId, role });

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);

    startVideoCall();

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      cleanup();
    };
  }, [userId, targetUserId, callType]);

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      myStream.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      if (incomingRing.current.paused) {
        try {
          outgoingRing.current.loop = true;
          await outgoingRing.current.play();
        } catch (e) {
          console.warn("Outgoing ring play error", e);
        }
      }

      socket.emit("call-user", {
        toUserId: targetUserId,
        fromUserId: userId,
        offer,
        callType: "video",
      });

      setCallStatus("Ringing...");
      callTimeoutRef.current = setTimeout(() => {
        endCall("No answer. Call timed out.");
      }, 30000);
    } catch (err) {
      alert("Please allow microphone and camera access.");
    }
  };

  const handleIncomingCall = ({ fromUserId, offer }) => {
    if (incomingRing.current.paused) {
      try {
        incomingRing.current.loop = true;
        incomingRing.current.play().catch((e) => console.warn("Incoming ring play error", e));
      } catch (e) {
        console.warn("Incoming ring play error", e);
      }
    }
    setCallStatus("Incoming call...");
    setIncomingCall({ fromUserId, offer });
  };

  const acceptCall = async () => {
    try {
      if (!incomingRing.current.paused) {
        incomingRing.current.pause();
        incomingRing.current.currentTime = 0;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      myStream.current = stream;
      if (myVideo.current) myVideo.current.srcObject = stream;

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("accept-call", {
        toUserId: incomingCall.fromUserId,
        answer,
      });

      drainCandidates(peer);
      setCallStatus("Call Connected");
      clearTimeout(callTimeoutRef.current);
      setInCall(true);
      setIncomingCall(null);
      startCallTimer();
    } catch (err) {
      alert("Failed to accept video call.");
    }
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          toUserId: targetUserId || incomingCall?.fromUserId,
          candidate: e.candidate,
        });
      }
    };

    connectionRef.current = peer;
    return peer;
  };

  const handleCallAccepted = async ({ answer }) => {
    if (!outgoingRing.current.paused) {
      outgoingRing.current.pause();
      outgoingRing.current.currentTime = 0;
    }
    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    drainCandidates(connectionRef.current);
    setInCall(true);
    setCallStatus("Call Connected");
    startCallTimer();
    clearTimeout(callTimeoutRef.current);
  };

  const handleIceCandidate = async ({ candidate }) => {
    if (!connectionRef.current || !connectionRef.current.remoteDescription) {
      setPendingCandidates((prev) => [...prev, candidate]);
    } else {
      try {
        await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    }
  };

  const drainCandidates = async (peer) => {
    for (const candidate of pendingCandidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add pending ICE candidate", err);
      }
    }
    setPendingCandidates([]);
  };

  const handleCallEnded = () => {
    if (!incomingRing.current.paused) {
      incomingRing.current.pause();
      incomingRing.current.currentTime = 0;
    }
    if (!outgoingRing.current.paused) {
      outgoingRing.current.pause();
      outgoingRing.current.currentTime = 0;
    }
    setCallStatus("Call Ended");
    cleanup();
    navigate(-1);
  };

  const endCall = (customMessage) => {
    socket.emit("end-call", { toUserId: targetUserId });
    setCallStatus(customMessage || "Call Ended");
    cleanup();
    setTimeout(() => navigate(-1), 1000);
  };

  const cleanup = () => {
    if (connectionRef.current) connectionRef.current.close();
    if (myStream.current) {
      myStream.current.getTracks().forEach((track) => track.stop());
    }
    stopCallTimer();
    if (!incomingRing.current.paused) {
      incomingRing.current.pause();
      incomingRing.current.currentTime = 0;
    }
    if (!outgoingRing.current.paused) {
      outgoingRing.current.pause();
      outgoingRing.current.currentTime = 0;
    }
    clearTimeout(callTimeoutRef.current);
    setInCall(false);
  };

  const toggleMute = () => {
    const track = myStream.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = myStream.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    }
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

  const rejectCall = () => {
    socket.emit("end-call", { toUserId: incomingCall.fromUserId });
    if (!incomingRing.current.paused) {
      incomingRing.current.pause();
      incomingRing.current.currentTime = 0;
    }
    setCallStatus("Call Rejected");
    setIncomingCall(null);
  };

  if (!callData || callType !== "video") return null;

  return (
    <div className="fixed inset-0 bg-white z-50 text-black flex flex-col items-center justify-center relative">
      <h2 className="text-xl font-bold mb-2">
        {inCall ? `Connected with ${targetName}` : `Calling ${targetName}...`}
      </h2>
      <p className="text-sm text-gray-500 mb-4">{callStatus}</p>

      <div className="relative flex justify-center items-center w-full max-w-4xl mx-auto h-[80vh] bg-black rounded-lg overflow-hidden">
        {/* Remote video fills container */}
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Optional small local video preview in bottom right */}
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full text-white transition ${
            isMuted ? "bg-gray-500" : "bg-yellow-500 animate-pulse"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full text-white transition ${
            isVideoOff ? "bg-gray-500" : "bg-yellow-500 animate-pulse"
          }`}
          title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {isVideoOff ? <VideoOff /> : <VideoIcon />}
        </button>
        <button
          onClick={() => endCall()}
          className="p-4 rounded-full bg-red-600 text-white"
          title="End Call"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
