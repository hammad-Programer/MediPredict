import { createContext, useContext, useState } from "react";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const [callType, setCallType] = useState(null); // "audio" or "video"
  const [callData, setCallData] = useState(null); // { userId, targetUserId, role }

  const startCall = ({ type, userId, targetUserId, role }) => {
    setCallType(type);
    setCallData({ userId, targetUserId, role });
  };

  return (
    <CallContext.Provider
      value={{ callType, setCallType, callData, setCallData, startCall }}
    >
      {children}
    </CallContext.Provider>
  );
};
