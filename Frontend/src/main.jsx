import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./Context/AppContext";
import { ProfileProvider } from "./Context/ProfileContext"; // ✅ import profile context
import { AppointmentProvider} from "./Context/AppointmentContext"; // ✅ import profile context
import App from "./App";
import "./index.css";
import ChatProvider from "./Context/ChatContext"; // ✅ Correct Import


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <ProfileProvider>
      <AppointmentProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
          duration: 2500, // ⏱ 2.5 seconds
          }}
        />
        <ChatProvider>
        <App />
        </ChatProvider>
          
        </BrowserRouter>
      </AppointmentProvider>
      </ProfileProvider>
    </AppProvider>
  </React.StrictMode>
);
