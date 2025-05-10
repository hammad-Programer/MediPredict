import React, { useState, useEffect,useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import AppContext from "../../Context/AppContext"; 

const BASE_URL = "http://localhost:5000/api/doctors";

const DocVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Get email from location state
  const email = location.state?.email || "";

  // ✅ Redirect if no email found
  useEffect(() => {
    if (!email) {
      toast.error("Invalid session. Please sign up again.");
      navigate("/doctor-signup");
    }
  }, [email, navigate]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setUser } = useContext(AppContext);

  // ✅ Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/verify-otp`, { email, otp });

      if (response?.data?.token) {
        // 🟢 Save user and token
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user); // ✅ make sure this contains username
      
        toast.success("OTP Verified! Registration Complete");
        setTimeout(() => window.open("/docDashboard", "_blank"), 1000); // new tab
      }  if (response?.data?.msg === "OTP verified. Registration complete. You can now log in.") {
        toast.success("OTP Verified! Registration Complete");

        setTimeout(() => navigate("/docDashboard"), 2000);
        window.open("/docDashboard", "_blank");
      } else {
        toast.error("Invalid OTP! Please try again.");
      }
    } catch (err) {
      console.error("❌ OTP Verification Error:", err.response?.data || err.message);
      toast.error("Invalid OTP or OTP expired. Please request a new one.");
    }

    setLoading(false);
  };

  // ✅ Handle Resend OTP
  const handleResendOTP = async () => {
    setResending(true);

    try {
      const response = await axios.post(`${BASE_URL}/resend-otp`, { email });


      if (response?.data?.msg?.toLowerCase().includes("otp")) {
        toast.success("New OTP sent to your email.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("❌ Resend OTP Error:", err.response?.data || err.message);
      toast.error("Error sending OTP. Try again later.");
    }

    setResending(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Doctor OTP Verification</h2>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-500 rounded-md outline-none"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
            onClick={handleResendOTP}
            disabled={resending}
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocVerify;
