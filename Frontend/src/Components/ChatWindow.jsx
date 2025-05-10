import React from "react";
import ChatBox from "../Components/Chat/ChatBox";
import MessageInput from "../Components/Chat/MessageInput";

function ChatWindow({ patientId, doctorId, senderRole = "Patient" }) {
  const currentUserId = senderRole === "Patient" ? patientId : doctorId;
  const receiverId = senderRole === "Patient" ? doctorId : patientId;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ChatBox currentUserId={currentUserId} />
      </div>
      <div className="bg-white shadow-md">
        <MessageInput
          currentUserId={currentUserId}
          receiverId={receiverId}
          currentUserRole={senderRole}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
