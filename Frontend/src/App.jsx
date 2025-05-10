import React, { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Dashboard from "./Pages/Patient/Dashboard";
import Signup from "./Pages/Patient/Signup";
import Login from "./Pages/Patient/Login";
import VerifyOTP from "./Pages/VerifyOTP";
import DocVerify from "./Pages/Doctor/DocVerify";
import ContactUs from "./Components/ContactUs";
import FAQs from "./Components/FQAs";
import About from "./Components/About";
import Testimonials from "./Components/Testimonials";
import DoctorSignup from "./Pages/Doctor/DoctorSignup";
import DoctorLogin from "./Pages/Doctor/DoctorLogin";
import DocDashboard from "./Pages/Doctor/DocDashboard";
import DoctorPanel from "./Pages/Doctor/DoctorPanel";
import Appointments from "./Pages/Doctor/Appointments";
import Profile from "./Pages/Doctor/Profile";
import AllDoctor from "./Components/AllDoctor";
import PatientAppointments from "./Pages/Patient/PatientAppoinments";
import AppContext from "./Context/AppContext";
import Spinner from "./Components/spinner";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminLogin from "./Pages/Admin/AdminLogin";
import Patients from "./Pages/Admin/Patients";
import Doctors from "./Pages/Admin/Doctors";
import AdminPanel from "./Pages/Admin/AdminPanal";
import Feedbacks from "./Pages/Admin/Feedbacks";
import Announcements from "./Pages/Admin/Announcements";
import DoctorChat from "./Pages/Doctor/DoctorChat";
import Messages from "./Pages/Patient/Messages";

const App = () => {
  const location = useLocation();
  const { loadingUser } = useContext(AppContext);

  const hideNavbarPaths = [
    "/docDashboard",
    "/docDashboard/appointments",
    "/docDashboard/profile",
    "/docDashboard/messages",
    "/Admin",
    "/admin/doctors",
    "/admin/patients",
    "/signup",
    "/login",
    "/doctor-signup",
    "/doctor-login",
    "/admin-login",
    "/admin/feedbacks",
    "/admin/announcements",
    "/patient-chat"
  ];

  const hideFooterPaths = ["/messages"];

  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  if (loadingUser) {
    return <Spinner />;
  }

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/docverify-otp" element={<DocVerify />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonial" element={<Testimonials />} />
        <Route path="/doctors" element={<AllDoctor />} />
        <Route path="/appointments" element={<PatientAppointments />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />


        {/* Doctor Routes */}
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/docDashboard" element={<DocDashboard />}>
          <Route index element={<DoctorPanel />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="messages" element={<DoctorChat />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/Admin" element={<AdminDashboard />}>
          <Route index element={<AdminPanel />} />
          <Route path="patients" element={<Patients />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="feedbacks" element={<Feedbacks />} />
          <Route path="announcements" element={<Announcements />} />
        </Route>
      </Routes>
      {!shouldHideFooter && <Footer />}
    </>
  );
};

export default App;
