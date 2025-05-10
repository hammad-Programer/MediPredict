const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 20 * 60 * 1000),
  },
  tempUser: {
    username: { type: String },
    hashedPassword: { type: String },
  },
});

module.exports = mongoose.model("OTP", OTPSchema);
