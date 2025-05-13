import React from "react";
import CallManager from "../Components/CallManager";
import { useCall } from "../Context/CallContext";

const VideoCall = () => {
  const { callType, callData } = useCall();

  if (callType !== "video" || !callData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">Video Call</h2>
        <p className="text-sm text-gray-300">
          Connected with {callData.role === "doctor" ? "Patient" : "Doctor"}
        </p>
      </div>

      <CallManager
        userId={callData.userId}
        targetUserId={callData.targetUserId}
        role={callData.role}
        mediaType="video"
        icon={null}
      />
    </div>
  );
};

export default VideoCall;
