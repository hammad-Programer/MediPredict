const mongoose = require("mongoose");

const docProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    speciality: String,
    education: String,
    experience: String,
    fees: String,
    address1: String,
    address2: String,
    about: String,
    imageUrl: String,
    timing: String,
    daysAvailable: [String],
  },
  { timestamps: true }
);

// ✅ Avoid OverwriteModelError
module.exports =
  mongoose.models.DocProfile || mongoose.model("DocProfile", docProfileSchema);
