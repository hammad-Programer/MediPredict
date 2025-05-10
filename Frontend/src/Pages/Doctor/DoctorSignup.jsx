import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../../Context/AppContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faLock, faEye, faEyeSlash,
  faStethoscope, faPen
} from "@fortawesome/free-solid-svg-icons";

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

    try {
      const response = await doctorSignup({
        username: formData.username,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        specialization: "general",
      });

      if (response?.doctor && response?.msg?.toLowerCase().includes("verify")) {
        toast.success("OTP Sent! Please verify your email.");
        navigate("/docverify-otp", {
          state: { email: formData.email.trim().toLowerCase() }
        });
        setFormData({ username: "", email: "", password: "", confirmPassword: "" });
      } else {
        toast.error(response?.error || "Signup failed! Try again.");
      }

    } catch (err) {
      console.error("❌ Signup API Error:", err);
      toast.error("Signup failed! Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        
        {/* Role Selection */}
        <div className="flex justify-center space-x-6 mb-4">
          <div
            className={`flex flex-col items-center cursor-pointer ${selectedRole === "patient" ? "text-blue-500" : "text-gray-500"}`}
            onClick={() => navigate("/signup")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" />
            <p className="text-sm font-semibold">Patient</p>
          </div>

          <div
            className={`flex flex-col items-center cursor-pointer ${selectedRole === "doctor" ? "text-blue-500" : "text-gray-500"}`}
          >
            <FontAwesomeIcon icon={faStethoscope} size="2x" />
            <p className="text-sm font-semibold">Doctor</p>
          </div>

          <div 
            className="flex flex-col items-center cursor-pointer text-gray-500 hover:text-blue-500 transition"
            onClick={() => navigate("/admin-login")}
          >
            <FontAwesomeIcon icon={faUser} size="2x" />
            <p className="text-sm font-semibold">Admin</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Doctor Signup</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div className="relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField("")}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />
            {focusedField === "username" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField("")}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />
            {focusedField === "email" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-500" />
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />
            <FontAwesomeIcon
              icon={passwordVisible ? faEyeSlash : faEye}
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
              onClick={() => setPasswordVisible(!passwordVisible)}
            />
          </div>

          {formData.password && (
            <p className={`text-sm font-semibold mt-1 ${
              passwordStrength === "Weak" ? "text-red-500" :
              passwordStrength === "Medium" ? "text-yellow-500" : "text-green-500"
            }`}>
              Password Strength: {passwordStrength}
            </p>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-500" />
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField("")}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />
            {focusedField === "confirmPassword" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/doctor-login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default DoctorSignup;
