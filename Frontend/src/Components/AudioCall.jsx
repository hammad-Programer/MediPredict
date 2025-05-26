import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../Socket/socket";
import { useCall } from "../Context/CallContext";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import ringtone from "../assets/simple-ringtone-25290.mp3";
import outgoingTone from "../assets/outgoing.mp3";

const AudioCall = () => {
  const { callData, callType } = useCall();
  const navigate = useNavigate();

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const outgoingRing = useRef(new Audio(outgoingTone));

  const [isMuted, setIsMuted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const pendingCandidates = useRef([]);

  const userId = callData?.userId;
  const targetUserId = callData?.targetUserId;
  const role = callData?.role;
  const targetName = callData?.targetName;
  const offerFromCaller = callData?.offer;

  const cleanup = () => {
    if (peerRef.current) peerRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    outgoingRing.current.pause();
    outgoingRing.current.currentTime = 0;
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!userId || !targetUserId || callType !== "audio") return;

    setupSocketListeners();

    if (role === "patient") startCallAsCaller();
    else if (role === "doctor" && offerFromCaller) startCallAsReceiver(offerFromCaller);

    return () => cleanup();
  }, [userId, targetUserId]);

  const setupSocketListeners = () => {
    socket.on("call-accepted", async ({ answer }) => {
  stopOutgoingTone();
  await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  await drainCandidates();
  setInCall(true);
  startTimer();
});


    socket.on("ice-candidate", async ({ candidate }) => {
      const rtcCandidate = new RTCIceCandidate(candidate);
      if (peerRef.current && peerRef.current.remoteDescription) {
        await peerRef.current.addIceCandidate(rtcCandidate);
      } else {
        pendingCandidates.current.push(rtcCandidate);
      }
    });

    socket.on("call-ended", () => {
      stopAllAudio();
      navigate(-1);
    });
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          toUserId: targetUserId,
          candidate: e.candidate,
        });
      }
    };

   peer.ontrack = (event) => {
  const [stream] = event.streams;
  remoteAudioRef.current.srcObject = stream;
  remoteAudioRef.current.play().catch(console.error);
};



    return peer;
  };

  const startCallAsCaller = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peerRef.current = peer;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      playOutgoingTone();

      socket.emit("call-user", {
        fromUserId: userId,
        toUserId: targetUserId,
        offer,
        callType: "audio",
      });
    } catch (err) {
      alert("Microphone access is required.");
    }
  };

  const startCallAsReceiver = async (incomingOffer) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peerRef.current = peer;

      await peer.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("accept-call", {
        toUserId: targetUserId,
        answer,
      });

      setInCall(true);
      startTimer();
    } catch (err) {
      console.error("Error starting call as receiver:", err);
    }
  };

 const drainCandidates = async () => {
  for (const candidate of pendingCandidates.current) {
    await peerRef.current.addIceCandidate(candidate);
  }
  pendingCandidates.current = [];
};

  const endCall = () => {
    socket.emit("end-call", { toUserId: targetUserId });
    stopAllAudio();
    navigate(-1);
  };

  const stopAllAudio = () => {
    cleanup();
  };

  const playOutgoingTone = () => {
    outgoingRing.current.loop = true;
    outgoingRing.current.play().catch(console.error);
  };

  const stopOutgoingTone = () => {
    outgoingRing.current.pause();
    outgoingRing.current.currentTime = 0;
  };

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  if (!callData || callType !== "audio") return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center text-black">
      <h2 className="text-xl font-bold mb-2">
        {inCall ? `Connected with ${targetName}` : `Calling ${targetName}...`}
      </h2>
      <p className="text-sm text-gray-500">{inCall ? "Call Active" : "Ringing..."}</p>

      {inCall && (
        <div className="text-green-600 font-mono mb-3 text-sm">
          Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
        </div>
      )}

      <div className="flex gap-4 mt-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full text-white ${isMuted ? "bg-gray-500" : "bg-yellow-500 animate-pulse"}`}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={endCall} className="p-4 rounded-full bg-red-600 text-white">
          <PhoneOff />
        </button>
      </div>

      <audio ref={remoteAudioRef} hidden autoPlay />
    </div>
  );
};

export default AudioCall;
