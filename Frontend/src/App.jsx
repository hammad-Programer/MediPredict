import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppContext from "./Context/AppContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Spinner from "./Components/spinner";

// Pages & Components
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
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import AdminLogin from "./Pages/Admin/AdminLogin";
import Patients from "./Pages/Admin/Patients";
import Doctors from "./Pages/Admin/Doctors";
import AdminPanel from "./Pages/Admin/AdminPanal";
import Feedbacks from "./Pages/Admin/Feedbacks";
import Announcements from "./Pages/Admin/Announcements";
import DoctorChatList from "./Pages/Doctor/DoctorChatList";
import DoctorChatWindow from "./Pages/Doctor/doctorChatWindow";
import Messages from "./Pages/Patient/Messages";
import Blogs from "./Pages/Doctor/Blogs";
import AllBlogs from "./Components/AllBlogs";
import BlogDetail from "./Components/BlogDetail";
import VideoCall from "./Components/VideoCall";
import AudioCall from "./Components/AudioCall";
import TermsAndServices from "./Components/TermsAndServices";
import PrivacyPolicy from "./Components/PrivacyPolicy";
import PatientChatList from "./Pages/Patient/PateintChatList";

const App = () => {
  const location = useLocation();
  const { loadingUser } = useContext(AppContext);
  const [routeLoading, setRouteLoading] = useState(false);

  // Only these routes show the spinner
  const spinnerRoutes = [
    "/docDashboard",
    "/docDashboard/appointments",
    "/docDashboard/profile",
    "/docDashboard/messages",
    "/Admin",
    "/admin/doctors",
    "/admin/patients",
    "/admin/feedbacks",
    "/admin/announcements",
    "/",
    "/dashboard",
    "/verify-otp",
    "/docverify-otp",
    "/contact",
    "/faqs",
    "/about",
    "/testimonial",
    "/doctors",
    "/appointments",
    "/messages",
    "/messages/:docid", // Add dynamic route to spinnerRoutes
    "/all-blogs",
    "/blogs",
    "/terms-of-service",
    "/privacy-policy",
    'Footer',
    
  ];

  const hideNavbarPaths = [
    "/docDashboard",
    "/docDashboard/appointments",
    "/docDashboard/profile",
    "/docDashboard/messages",
    "/docDashboard/upload-blog",
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
    "/patient-chat",
    "/docverify-otp",
    "/verify-otp",
    "/video-call",
    "/audio-call",
  ];

  const shouldHideNavbar = hideNavbarPaths.some(path =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const match = spinnerRoutes.some(path =>
      location.pathname.startsWith(path)
    );

    if (match) {
      setRouteLoading(true);
      const timeout = setTimeout(() => setRouteLoading(false), 500);
      return () => clearTimeout(timeout);
    } else {
      setRouteLoading(false);
    }
  }, [location.pathname]);

  if (loadingUser || routeLoading) return <Spinner />;

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* Public and Patient Routes */}
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
        <Route path="/messages/:docid" element={<Messages />} /> {/* Add dynamic route */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/all-blogs" element={<AllBlogs />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
        <Route path="/terms-of-service" element={<TermsAndServices />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Video/Audio Call Routes */}
        <Route path="/video-call" element={<VideoCall />} />
        <Route path="/audio-call" element={<AudioCall />} />

        {/* Doctor Routes */}
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/docDashboard" element={<DocDashboard />}>
          <Route index element={<DoctorPanel />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="messages" element={<DoctorChatList />} />
          <Route path="messages/:patientId" element={<DoctorChatWindow />} />
          <Route path="upload-blog" element={<Blogs />} />
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

      <Footer />
    </>
  );
};

export default App;