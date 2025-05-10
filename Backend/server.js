require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/db");
const http = require("http");
const { setupSocket } = require("../Backend/Socket/socketServer");

const authRoutes = require("./Routes/authPatient");
const testimonialRoutes = require("./Routes/testimonialRoutes");
const doctorRoutes = require("./Routes/doctorRoutes");
const doctorProfileRoutes = require("./Routes/docProfileRoutes");
const appointmentRoutes = require("./Routes/appointmentRoutes");
const newsletterRoutes = require("./Routes/subscriberRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const feedbackRoutes = require("./Routes/feedbackRoutes");
const announcementRoutes = require("./Routes/announcementRoutes");
const chatRoutes = require("./Routes/chatRoutes");

const app = express();
const server = http.createServer(app); // ✅ Correct server

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Connect to DB
connectDB();

// All Routes
app.use("/api/auth", authRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor-profile", doctorProfileRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/announcement", announcementRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Setup WebSocket server
setupSocket(server);

// ✅ Listen with SERVER, not app
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running with Socket.IO on port ${PORT}`)
);
