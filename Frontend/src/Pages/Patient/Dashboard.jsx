import React, { useState, useCallback, useContext,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../Context/AppContext";
import headerImage from "../../assets/Header.jpeg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import axios from "axios";

import {
  faUserPlus,
  faComments,
  faVideo,
  faArrowRight,
  faLock,
  faGlobe,
  faDollarSign,
  faUserMinus
} from "@fortawesome/free-solid-svg-icons";
import Feedback from "../../Components/Feedback";

const Dashboard = () => {
  const [medicalConcern, setMedicalConcern] = useState("");
  const [error, setError] = useState("");
  const { user, loading, loadingUser } = useContext(AppContext);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/announcement/latest");
        if (res.data?.message) {
          setAnnouncement(res.data.message);
  
          setTimeout(() => setAnnouncement(null), 2000);
        }
      } catch (err) {
        console.error("Failed to load announcement:", err);
      }
    };
  
    fetchAnnouncement();
  }, []);
  
  

  const navigate = useNavigate();

  const handleInputChange = useCallback(
    (event) => {
      setMedicalConcern(event.target.value);
      if (error) setError("");
    },
    [error]
  );

  const handleFindDoctor = () => {
    if (medicalConcern.trim() === "") {
      setError("Please enter your medical concern.");
      return;
    }
    navigate(`/doctors?concern=${encodeURIComponent(medicalConcern.trim().toLowerCase())}`);
  };
  

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      checkAccess(handleFindDoctor);
    }
  };

  const checkAccess = (callback) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    callback();
  };
  const handleSubscribe = async () => {
    if (!subscriberEmail.trim()) {
      toast.warning("Please enter a valid email.");
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
  
      const data = await res.json();
      toast.success(data.message || "Subscribed successfully!");
      setSubscriberEmail("");
      setIsSubscribed(true); // ✅ hide input & show success block
    } catch (err) {
      console.error("❌ Error subscribing:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };
  const handleUnsubscribe = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
  
      const data = await res.json();
      toast.success(data.message || "Unsubscribed successfully!");
      setIsSubscribed(false);
      setSubscriberEmail("");
    } catch (err) {
      console.error("❌ Error unsubscribing:", err);
      toast.error("Failed to unsubscribe.");
    }
  };
    
  if (loading) return <Spinner />;
  
  return (
    <>
    <Feedback/>
    {announcement && (
  <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] sm:w-[450px] bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-5 py-4 shadow-md rounded-lg animate-slide-down transition-all duration-300 ease-in-out">
    
    {/* Title */}
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">📢</span>
      <strong className="text-sm sm:text-base">Announcement</strong>
    </div>

    {/* Message */}
    <p className="text-sm sm:text-[15px] leading-snug">{announcement}</p>
  </div>
)}


   
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden max-w-6xl mx-auto my-16 shadow-lg"
        style={{ backgroundImage: `url(${headerImage})` }}
      >
         <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent z-10"></div>



        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 sm:px-10 md:px-16 lg:px-20 py-20 md:py-32 text-white">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">MediPredict</h1>
            <p className="text-sm sm:text-base max-w-md mb-6">
              Our team of experienced doctors and healthcare professionals are committed to providing quality care and personalized attention to our patients.
            </p>

            {/* Search Input */}
            <div className="mt-8">
              <label htmlFor="medicalConcern" className="sr-only">Enter your medical concern</label>
              <input
                id="medicalConcern"
                type="text"
                placeholder="Enter your medical concern"
                value={medicalConcern}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full md:w-2/3 px-4 py-3 rounded-md border border-gray-300 text-white focus:outline-none"
              />
              <button
                onClick={() => checkAccess(handleFindDoctor)}
                className="mt-4 md:mt-0 ml-0 md:ml-4  text-white px-6 py-3  border border-gray-300 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Find Doctor
              </button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </div>

          {/* Right Side */}
          <div className="absolute top-6 right-6 bg-white/60 backdrop-blur-md text-sm text-gray-800 px-4 py-2 rounded-full flex items-center shadow-lg space-x-3">
  {/* Avatars */}
  <div className="flex -space-x-2">
    <img src="https://media.istockphoto.com/id/481073846/photo/the-long-hard-road-to-recovery.jpg?s=612x612&w=0&k=20&c=8SK7QeWO9VZpy3ei3eBKLKLdcWpgLOOikyByYdrzkwU=" className="w-9 h-9 rounded-full border-2 border-white" />
    <img src="https://thumbs.dreamstime.com/b/asian-patient-boy-saline-intravenous-iv-hospital-bed-32632968.jpg" className="w-9 h-9 rounded-full border-2 border-white" />
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqLkiN_Qk7LiF8RpjDgfN2JoI1RXI8_obXKA&s" className="w-9 h-9 rounded-full border-2 border-white" />
  </div>

  {/* Text */}
  <div className="flex flex-col justify-center leading-tight">
    <span className="font-bold text-blue-700 text-base">150K+</span>
    <span className="text-gray-600 text-xs -mt-1">Patient Recover</span>
  </div>

  {/* Check Badge */}
  <div className="absolute top-0 right-1 w-6 h-6 bg-blue-800 text-white rounded-full flex items-center justify-center text-xs shadow">
    ✓
  </div>
          </div>

        </div>
        <div className="absolute  left-1/2 bottom-0 right-0 transform  backdrop-blur-md bg-white/60 rounded-tl-lg shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-6 text-center px-8 py-5 w-[90%] sm:w-auto">
        <div>
          <h3 className="text-2xl font-bold text-blue-700">20+</h3>
          <p className="text-gray-700 text-sm">years of experience</p>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-blue-700">95%</h3>
          <p className="text-gray-700 text-sm">patient satisfaction rating</p>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-blue-700">5,000+</h3>
          <p className="text-gray-700 text-sm">patients served annually</p>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-blue-700">10+</h3>
          <p className="text-gray-700 text-sm">healthcare providers on staff</p>
        </div>
      </div>
        
      </div>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto my-16 px-6 sm:px-10 md:px-14">
        <h2 className="text-center text-2xl font-bold text-gray-800">How It Works</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: faUserPlus, title: "Register", desc: "Register as a Patient or Doctor." },
            { icon: faComments, title: "Connect", desc: "Patients submit their medical concerns and get connected with volunteer doctors." },
            { icon: faVideo, title: "Consultation", desc: "Get medical advice through secure audio & video consultations." },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-white shadow-lg rounded-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
              <FontAwesomeIcon icon={step.icon} className="text-blue-500 text-4xl mb-4" />
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-gray-600 text-center mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Services */}
      <section className="max-w-5xl mx-auto my-16 px-6 sm:px-10 md:px-14">
        <h2 className="text-center text-2xl font-bold text-gray-800">Our Services</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Disease Prediction", desc: "Get AI-powered disease predictions based on your symptoms." },
            { title: "Specialist Referrals", desc: "Connect with specialist doctors for complex medical issues." },
          ].map((service, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-white shadow-lg rounded-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="text-gray-600 text-center mt-2">{service.desc}</p>
              <button
                onClick={() => checkAccess(() => navigate("/services"))}
                className="flex items-center mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Learn More <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-5xl mx-auto my-16 px-6 sm:px-10 md:px-14">
        <h2 className="text-center text-2xl font-bold text-gray-800">Why Choose Us</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: faLock, title: "Secure Platform", desc: "Our system ensures privacy and security for all users." },
            { icon: faGlobe, title: "Eliminate Language Barriers", desc: "Real-time message translation through NLP in live chat consultations." },
            { icon: faDollarSign, title: "Low-Cost Consultations", desc: "Affordable medical advice from trusted professionals." },
          ].map((why, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-white shadow-lg rounded-lg transition-transform transform hover:scale-105 hover:shadow-2xl">
              <FontAwesomeIcon icon={why.icon} className="text-blue-500 text-4xl mb-4" />
              <h3 className="text-xl font-semibold">{why.title}</h3>
              <p className="text-gray-600 text-center mt-2">{why.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-4xl mx-auto my-16 px-6 sm:px-10 md:px-14 text-center bg-gray-100 shadow-lg rounded-lg py-10">
        <h2 className="text-2xl font-bold text-gray-800">Stay Connected</h2>
        <p className="text-gray-700 mt-2">
          Stay informed with our latest updates and expert health tips — subscribe to our newsletter today!
        </p>
        {!isSubscribed ? (
  <>
    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
      <input
        type="email"
        placeholder="Enter your email"
        value={subscriberEmail}
        onChange={(e) => setSubscriberEmail(e.target.value)}
        className="w-full sm:w-96 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
      />
      <button
        onClick={handleSubscribe}
        className="bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-600 transition shadow-md"
      >
        Subscribe
      </button>
    </div>
  </>
) : (
  <div className="mt-6 bg-white p-6 rounded-md shadow-md max-w-lg mx-auto">
    <h3 className="text-lg font-bold text-green-600 mb-2">🎉 You're Subscribed!</h3>
    <p className="text-gray-600 mb-4">
      Thank you for subscribing to MediPredict updates. You’ll receive the latest news and tips in your inbox.
    </p>
    <button
  onClick={handleUnsubscribe}
  className="bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700 transition shadow-md inline-flex items-center gap-2"
>
  
  Unsubscribe
</button>
  </div>
)}


      </section>
    </>
  );
};

export default Dashboard;
