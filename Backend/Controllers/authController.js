const Patient = require("../Model/Patient");
const Doctor = require("../Model/Doctor");
const OTP = require("../Model/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../Utils/Email");
const sendEmail = require("../Utils/ContactEmail");

// 📌 Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 📌 Register - stores temp user in OTP collection
// 📌 Register - stores temp user in OTP collection
const register = async (req, res) => {
  try {
    console.log("🔹 Received Register Request:", req.body);

    let { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    email = email.trim().toLowerCase();

    const existingDoctor = await Doctor.findOne({ email });
    const existingPatient = await Patient.findOne({ email });

    if (existingDoctor || existingPatient) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 20 * 60 * 1000); // 20 min

    const tempUser = { username, hashedPassword, role };
    console.log("📦 Saving OTP with tempUser:", tempUser);

    await OTP.create({
      email,
      otp,
      expiresAt: otpExpires,
      tempUser,
    });

    await sendOTPEmail(email, otp);
    res.status(200).json({ msg: "OTP sent to email. Please verify." });
  } catch (error) {
    console.error("❌ Error in Register API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Verify OTP - finalize patient registration
const verifyOTP = async (req, res) => {
  let { email, otp } = req.body;
  email = email?.trim().toLowerCase(); // ✅ normalize

  try {
    const otpRecord = await OTP.findOne({ email });
    console.log("📦 OTP Record:", otpRecord);

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ msg: "OTP expired. Request a new one." });
    }

    if (!otpRecord.tempUser) {
      return res.status(400).json({ msg: "Temp user data missing in OTP." });
    }

    const { username, hashedPassword: password, role } = otpRecord.tempUser;

    console.log("🧾 Creating Patient with:", {
      username,
      email,
      password,
      role,
    });

    const newUser = await Patient.create({
      username,
      email,
      password,
      role: role || "patient",
      isVerified: true,
    });

    await OTP.deleteOne({ email });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      msg: "OTP verified. Registration complete.",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Error in OTP Verification API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Login (Only if Verified)

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Patient.findOne({ email }); // ✅ checking in Patient model

    if (!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Resend OTP
const resendOTP = async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    const user = await Patient.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    await OTP.deleteOne({ email });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await OTP.create({ email, otp, expiresAt: otpExpires });

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ msg: "Error sending OTP. Try again." });
    }

    res.status(200).json({ msg: "New OTP sent successfully to your email." });
  } catch (error) {
    console.error("❌ Error in Resend OTP API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📌 Contact Us
const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const response = await sendEmail({ name, email, message });

    if (!response.success) {
      return res
        .status(500)
        .json({ msg: "Failed to send message. Try again." });
    }

    res.status(200).json({ msg: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error in Contact Form API:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    // First try patient
    let user = await Patient.findById(req.user.id).select("-password");
    if (!user) {
      // Then try doctor
      user = await Doctor.findById(req.user.id).select("-password");
    }

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Get Profile Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const countPatient = async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("Error getting patient count:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  resendOTP,
  contactUs,
  getProfile,
  countPatient,
};
