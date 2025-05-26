import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import AppContext from "../Context/AppContext"; // ✅ import context

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AppContext); // ✅ grab setUser

  const storedEmail = localStorage.getItem("pendingEmail");
  const email = location.state?.email || storedEmail || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Session expired. Please sign up again.");
      navigate("/signup");
    }
  }, [email]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      if (res.data?.token) {
        // ✅ Set token and user
        localStorage.removeItem("pendingSignup");
        localStorage.removeItem("pendingEmail");
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user); // ✅ THIS FIXES THE NAVBAR ISSUE

        toast.success("OTP Verified! Account created.");
        navigate("/dashboard");
      } else {
        toast.error(res?.data?.msg || "OTP verification failed.");
      }
    } catch (err) {
      console.error("❌ OTP Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.msg || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email,
      });
      toast.success(res.data?.msg || "OTP resent.");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Verify OTP</h2>
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            maxLength={6}
            inputMode="numeric"
            pattern="\d{6}"
            className="w-full px-3 py-2 border border-gray-400 rounded-md outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md transition"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
