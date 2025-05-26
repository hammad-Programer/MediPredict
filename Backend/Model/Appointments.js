const mongoose = require("mongoose");
const AppointmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "DocProfile" },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  appointmentDate: String,
  appointmentTime: String,
  status: { type: String, default: "active" }, // active or cancelled
  cancelledAt: Date, // ✅ New field
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
