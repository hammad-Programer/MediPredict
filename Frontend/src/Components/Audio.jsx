import React from "react";
import CallManager from "../Components/CallManager";
import { useCall } from "../Context/CallContext";

const Audio = () => {
  const { callType, callData } = useCall();

  if (callType !== "audio" || !callData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="w-[360px] p-6 bg-white rounded-lg shadow-lg text-center text-black">
        <h2 className="text-lg font-semibold mb-2">Audio Call</h2>
        <p className="text-sm mb-4 text-gray-600">
          Talking to {callData.role === "doctor" ? "Patient" : "Doctor"}
        </p>
        <CallManager
          userId={callData.userId}
          targetUserId={callData.targetUserId}
          role={callData.role}
          mediaType="audio"
          icon={null}
        />
      </div>
    </div>
  );
};

export default Audio;
