import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AppointmentContext = createContext();

const BASE_URL = "http://localhost:5000/api/appointments"; 

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Book Appointment
  const bookAppointment = async (formData) => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/book`, formData);
  
      // ✅ Debug log to confirm booking success
      console.log("✅ Appointment booking response:", res.data);
  
      setAppointments((prev) => [...prev, res.data.appointment]);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("❌ Booking failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Booking failed");
      return { success: false, message: err.response?.data?.message || "Booking failed" };
    } finally {
      setLoading(false);
    }
  };
  
  

  // ✅ Get Appointments for a Doctor
  const getDoctorAppointments = async (doctorId) => {
    try {
      setLoading(true);
      console.log("Fetching for doctor:", doctorId);
      const res = await axios.get(`${BASE_URL}/doctor/${doctorId}`);
      console.log("Appointments response:", res.data);
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError(err.response?.data?.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };
  
  

  const getBookedSlots = async (doctorId) => {
    try {
      const res = await axios.get(`${BASE_URL}/booked/${doctorId}`);
      return res.data; // return the array of booked slots
    } catch (err) {
      console.error("❌ Error fetching booked slots:", err);
      return []; 
    }
  };

  // Rename function for clarity
const getPatientAppointments = async (patientId) => {
  try {
    setLoading(true);
    const res = await axios.get(`${BASE_URL}/patient/${patientId}`);
    setAppointments(res.data);
  } catch (err) {
    setError(err.response?.data?.message || "Failed to fetch appointments");
  } finally {
    setLoading(false);
  }
};

const cancelAppointment = async (appointmentId) => {
  try {
    const res = await axios.put(`${BASE_URL}/cancel/${appointmentId}`);

    // ✅ Remove the deleted appointment from the local state
    setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentId));

    return { success: true };
  } catch (err) {
    console.error("❌ Cancel error:", err);
    return { success: false };
  }
};



  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        error,
        bookAppointment,
        getDoctorAppointments,
        getBookedSlots,
        getPatientAppointments,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export default AppointmentContext;
