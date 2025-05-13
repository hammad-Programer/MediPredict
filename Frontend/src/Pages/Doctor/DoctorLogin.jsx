import React, { useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faStethoscope,faPen } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; 
import AppContext from "../../Context/AppContext";

const DoctorLogin = () => {
  const { doctorLogin, loading, error } = useContext(AppContext);
  const [focusedField, setFocusedField] = useState(null);


  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const response = await doctorLogin({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
  });

  console.log("🧪 Doctor login response:", response);

  if (response?.success) {
    toast.success("Doctor logged in successfully!");
    setTimeout(() => navigate("/docDashboard"), 2000);
  } else {
    toast.error(response?.error || "Invalid email or password!");
  }
};

  
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mt-2"> 
          <FontAwesomeIcon icon={faStethoscope} className= " mr-2 text-blue-500" />
            Doctor Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />

            {focusedField === "email" && (
              <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
            )}
          </div>

          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="pl-10 w-full px-3 py-2 border rounded-md outline-none"
              required
            />

             {focusedField === "Password" && (
                <FontAwesomeIcon icon={faPen} className="absolute right-3 top-3 text-blue-500" />
              )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Not a doctor?{" "}
          <button
            onClick={() => navigate("/doctor-signup")}
            className="text-blue-500 hover:underline"
          >
            SignUp as Doctor
          </button>
        </p>
      </div>
    </div>
  );
};

export default DoctorLogin;
