import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../../Context/AppContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faLock, faEye, faEyeSlash,
  faStethoscope, faPen
} from "@fortawesome/free-solid-svg-icons";
import Spinner from "../../Components/Spinner";

const DoctorSignup = () => {
  
  const { doctorSignup, loading } = useContext(AppContext);
  const navigate = useNavigate();
  

  const [selectedRole, setSelectedRole] = useState("doctor");
  const [focusedField, setFocusedField] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [emailValid, setEmailValid] = useState(true);
  const [errors, setErrors] = useState({});


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "password") {
      const strength = checkPasswordStrength(e.target.value);
      setPasswordStrength(strength);
    }
    if (e.target.name === "email") {
      setEmailValid(validateEmail(e.target.value));
    }
  };

  const checkPasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8) return "Strong";
    return "Medium";
  };

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  let newErrors = {};
  if (!formData.username) newErrors.username = "Username is required.";
  if (!emailValid) newErrors.email = "Invalid email format.";
  if (!formData.password) newErrors.password = "Password is required.";
  if (passwordStrength === "Weak") newErrors.password = "Password is too weak.";
  if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // ✅ Prepare signup data
  const signupData = {
    username: formData.username,
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    specialization: "general"
  };

  try {
    // ✅ Call backend to send OTP
    const response = await fetch("http://localhost:5000/api/doctors/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signupData.email }),
    });

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.msg || "Failed to send OTP.");
      return;
    }

    // ✅ Save signup data locally for verification step
    localStorage.setItem("pendingDoctorSignup", JSON.stringify(signupData));

    toast.success("OTP sent! Please verify.");
    navigate("/docverify-otp");
  } catch (err) {
    console.error("Signup OTP error:", err);
    toast.error("Something went wrong. Please try again.");
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-300  rounded-xl shadow-xl">

        {/* Role Selection */}
        <div className="flex justify-center gap-6 mb-6">
          <div
            className={`flex flex-col items-center cursor-pointer transition ${selectedRole === "patient" ? "text-gray-400 hover:text-blue-500" : "text-gray-400 hover:text-blue-500"}`}
            onClick={() => navigate("/signup")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" />
            <p className="text-sm font-medium mt-1">Patient</p>
          </div>
          <div className="flex flex-col items-center text-blue-600 cursor-pointer">
            <FontAwesomeIcon icon={faStethoscope} size="2x" />
            <p className="text-sm font-medium mt-1">Doctor</p>
          </div>
          <div
            className="flex flex-col items-center cursor-pointer text-gray-400 hover:text-blue-500 transition"
            onClick={() => navigate("/admin-login")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" />
            <p className="text-sm font-medium mt-1">Admin</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Doctor Signup</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField("")}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            {focusedField === "username" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            {focusedField === "email" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <FontAwesomeIcon
              icon={passwordVisible ? faEyeSlash : faEye}
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
              onClick={() => setPasswordVisible(!passwordVisible)}
            />
          </div>

          {/* Password Strength */}
          {formData.password && (
            <p className={`text-sm font-medium mt-1 ${
              passwordStrength === "Weak" ? "text-red-500" :
              passwordStrength === "Medium" ? "text-yellow-500" : "text-green-600"
            }`}>
              Password Strength: {passwordStrength}
            </p>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField("")}
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <FontAwesomeIcon
              icon={faEye}
              className="absolute right-3 top-3 text-gray-500 cursor-pointer"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/doctor-login")}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default DoctorSignup;
