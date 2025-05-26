import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// ✅ Create Context
const AppContext = createContext();

// ✅ Backend URLs
const BASE_URL = "http://localhost:5000/api/auth";
const BASE_URL1 = "http://localhost:5000/api";

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch((err) => {
          console.error("❌ Profile Fetch Error:", err.response?.data || err.message);
          logout(); // clear token if invalid
        })
        .finally(() => {
          setLoadingUser(false); // ✅ only after check finishes
        });
    } else {
      setLoadingUser(false);
    }
  }, []);
    

  // ✅ Patient Signup
const signup = async (userData) => {
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(`${BASE_URL}/register`, userData);

    // Do NOT try to store token or user yet — only after OTP is verified
    return res.data;
  } catch (err) {
    const errorMsg = err.response?.data?.msg || "Signup failed! Try again.";
    setError(errorMsg);
    return { error: errorMsg };
  } finally {
    setLoading(false); // ✅ ensures loading ends
  }
};


  // ✅ Patient Login
  const login = async (credentials) => {
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(`${BASE_URL}/login`, credentials);
    const token = res.data.token;

    if (token) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return true;
    } else {
      throw new Error("Token not found in response");
    }
  } catch (err) {
    setError(err.response?.data?.msg || "Invalid login credentials");
    return false;
  } finally {
    setLoading(false); // ✅ ensures loading ends
  }
};

  
  // ✅ Patient OTP Verification
  const verifyOTP = async (otpData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/verify-otp`, otpData);
  
      // ✅ Save token and user after OTP verification
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
  
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid OTP. Try again.";
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };
  

  // ✅ Resend OTP
  const resendOTP = async (email, phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/resend-otp`, { email, phoneNumber });
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to resend OTP.";
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // ✅ Doctor Signup
  const doctorSignup = async (doctorData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL1}/doctors/register`, doctorData);
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Doctor signup failed.";
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // ✅ Doctor Login
 const doctorLogin = async (credentials) => {
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(`${BASE_URL1}/doctors/login`, credentials);

    // Ensure both token and doctor are present
    const { token, doctor } = res.data;

    if (token && doctor) {
      localStorage.setItem("token", token);
      localStorage.setItem("doctorId", doctor.id);
      setUser({
        id: doctor.id,
        username: doctor.username,
        email: doctor.email,
        role: "doctor",
      });
      setLoading(false);
      return {
        success: true,
        doctor,
        token,
      };
    } else {
      setLoading(false);
      return {
        success: false,
        error: "Invalid server response",
      };
    }
  } catch (err) {
    const errorMsg = err.response?.data?.msg || "Invalid doctor login credentials.";
    setLoading(false);
    setError(errorMsg);
    return { success: false, error: errorMsg };
  }
};

  
  // ✅ Contact Message
  const sendContactMessage = async (contactData) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${BASE_URL}/contact`, contactData);
      setLoading(false);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send message.";
      setLoading(false);
      setError(errorMsg);
      return { error: errorMsg };
    }
  };

  // ✅ Add Testimonial
  const addTestimonial = async (testimonialData) => {
    try {
      const res = await axios.post(`${BASE_URL1}/testimonials`, testimonialData);
      setTestimonials((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      return { error: "Failed to submit testimonial." };
    }
  };

  // ✅ Fetch Testimonials
  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${BASE_URL1}/testimonials`);
      setTestimonials(res.data);
    } catch (err) {
      console.error("❌ Fetch Testimonials Error:", err);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        loadingUser,
        user,
        setUser,
        signup,
        login,
        logout,
        verifyOTP,
        resendOTP,
        doctorSignup,
        doctorLogin,
        sendContactMessage,
        testimonials,
        addTestimonial,
        fetchTestimonials,
        loading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
