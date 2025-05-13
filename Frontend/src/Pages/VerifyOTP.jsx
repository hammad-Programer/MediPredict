import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppContext from "../Context/AppContext";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP } = useContext(AppContext); // ✅ use AppContext method

  const storedEmail = localStorage.getItem("pendingEmail");
  const email = location.state?.email || storedEmail || "";

  useEffect(() => {
    if (!email) {
      toast.error("Invalid session. Please sign up again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await verifyOTP({ email, otp }); // ✅ use context function

    if (response?.token) {
      toast.success("OTP Verified! Registration Complete");
      setTimeout(() => navigate("/dashboard"), 1500);
    } else {
      toast.error(response?.error || "Invalid OTP");
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/resend-otp`, { email });
      toast.success(res?.data?.msg || "OTP resent successfully.");
    } catch (err) {
      toast.error("Error sending OTP. Try again later.");
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
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
