import React, { useState, useCallback, useContext, useEffect } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import SlideInOnScroll from "../../Components/SlideInOnScroll";

const Dashboard = () => {
  const [medicalConcern, setMedicalConcern] = useState("");
  const [error, setError] = useState("");
  const { user } = useContext(AppContext);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/testimonials");
        setTestimonials(res.data || []);
      } catch (err) {
        console.error("Failed to load testimonials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/announcement/latest");
        if (res.data?.message) {
          setAnnouncement(res.data.message);
          setTimeout(() => setAnnouncement(null), 3000);
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
      setIsSubscribed(true);
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

  return (
    <>
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden max-w-[95%] sm:max-w-6xl mx-auto my-8 sm:my-16 shadow-lg"
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-transparent z-10"></div>
        <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16 md:py-24 text-white">
          <SlideInOnScroll direction="left" className="w-full text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">MediPredict</h1>
            <p className="text-sm sm:text-base md:text-lg max-w-md mx-auto mb-6">
              Our team of experienced doctors and healthcare professionals are committed to providing quality care and personalized attention to our patients.
            </p>
            {/* Search Input */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <label htmlFor="medicalConcern" className="sr-only">
                Enter your medical concern
              </label>
              <input
                id="medicalConcern"
                type="text"
                placeholder="Enter your medical concern"
                value={medicalConcern}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full sm:w-80 px-4 py-3 rounded-md border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
              />
              <button
                onClick={() => checkAccess(handleFindDoctor)}
                className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-transform duration-300"
              >
                Find Doctor
              </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </SlideInOnScroll>

          <SlideInOnScroll
            direction="right"
            className="mt-6 sm:absolute sm:top-4 sm:right-4 bg-white/70 backdrop-blur-md text-sm text-gray-800 px-3 py-2 rounded-full flex items-center shadow-lg space-x-2 scale-90 sm:scale-100"
          >
            <div className="flex -space-x-1.5">
              <img
                src="https://media.istockphoto.com/id/481073846/photo/the-long-hard-road-to-recovery.jpg?s=612x612&w=0&k=20&c=8SK7QeWO9VZpy3ei3eBKLKLdcWpgLOOikyByYdrzkwU="
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white"
                alt="avatar1"
                loading="lazy"
              />
              <img
                src="https://thumbs.dreamstime.com/b/asian-patient-boy-saline-intravenous-iv-hospital-bed-32632968.jpg"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white"
                alt="avatar2"
                loading="lazy"
              />
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqLkiN_Qk7LiF8RpjDgfN2JoI1RXI8_obXKA&s"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white"
                alt="avatar3"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center leading-tight">
              <span className="font-bold text-blue-700 text-xs sm:text-sm">150K+</span>
              <span className="text-gray-600 text-[10px] sm:text-xs">Patient Recover</span>
            </div>
            <div className="absolute top-0 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-800 text-white rounded-full flex items-center justify-center text-xs shadow">
              ✓
            </div>
          </SlideInOnScroll>
        </div>

        {/* Stats Section */}
        <div className="relative bg-white/70 backdrop-blur-md rounded-t-lg shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-auto">
          <SlideInOnScroll direction="left">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-700">20+</h3>
              <p className="text-gray-700 text-xs sm:text-sm">years of experience</p>
            </div>
          </SlideInOnScroll>
          <SlideInOnScroll direction="right">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-700">95%</h3>
              <p className="text-gray-700 text-xs sm:text-sm">patient satisfaction rating</p>
            </div>
          </SlideInOnScroll>
          <SlideInOnScroll direction="left">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-700">5,000+</h3>
              <p className="text-gray-700 text-xs sm:text-sm">patients served annually</p>
            </div>
          </SlideInOnScroll>
          <SlideInOnScroll direction="right">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-blue-700">10+</h3>
              <p className="text-gray-700 text-xs sm:text-sm">healthcare providers on staff</p>
            </div>
          </SlideInOnScroll>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="max-w-[95%] sm:max-w-5xl mx-auto my-12 sm:my-16 px-4 sm:px-6 md:px-10">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-800 mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: faUserPlus, title: "Register", desc: "Register as a Patient or Doctor." },
            { icon: faComments, title: "Connect", desc: "Patients submit their medical concerns and get connected with volunteer doctors." },
            { icon: faVideo, title: "Consultation", desc: "Get medical advice through secure audio & video consultations." },
          ].map((step, i) => (
            <SlideInOnScroll
              key={i}
              direction={i % 2 === 0 ? "left" : "right"}
              className="flex flex-col items-center p-4 sm:p-6 bg-white shadow-lg rounded-lg"
            >
              <FontAwesomeIcon icon={step.icon} className="text-blue-500 text-3xl sm:text-4xl mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base mt-2">{step.desc}</p>
            </SlideInOnScroll>
          ))}
        </div>
      </section>

      {/* Our Services Section */}
      <section className="max-w-[95%] sm:max-w-5xl mx-auto my-12 sm:my-16 px-4 sm:px-6 md:px-10">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-800 mb-8">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[
            { title: "Disease Prediction", desc: "Get AI-powered disease predictions based on your symptoms." },
            { title: "Specialist Referrals", desc: "Connect with specialist doctors for complex medical issues." },
          ].map((service, i) => (
            <SlideInOnScroll
              key={i}
              direction={i % 2 === 0 ? "left" : "right"}
              className="flex flex-col items-center p-4 sm:p-6 bg-white shadow-lg rounded-lg"
            >
              <h3 className="text-lg sm:text-xl font-semibold">{service.title}</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base mt-2">{service.desc}</p>
              <button
                onClick={() => checkAccess(() => navigate("/services"))}
                className="flex items-center mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm sm:text-base"
              >
                Learn More <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </SlideInOnScroll>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-[95%] sm:max-w-6xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-10 sm:mb-16 tracking-tight">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              <p className="text-gray-600 text-center col-span-3 text-sm sm:text-base">Loading testimonials...</p>
            ) : testimonials.length === 0 ? (
              <p className="text-gray-600 text-center col-span-3 text-sm sm:text-base">No testimonials available yet.</p>
            ) : (
              testimonials.slice(0, 3).map(({ _id, name, status, comment, message }, i) => (
                <SlideInOnScroll
                  key={i}
                  direction={i % 2 === 0 ? "left" : "right"}
                  className="flex flex-col items-center p-4 sm:p-6 bg-white shadow-lg rounded-lg"
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-inner">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{name}</h3>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base italic relative pl-5 sm:pl-6 mb-4 sm:mb-6 leading-relaxed">
                    <span className="absolute left-0 top-0 text-blue-400 text-2xl sm:text-3xl leading-none">“</span>
                    {message || comment}
                  </p>
                  <span
                    className={`self-end px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full
                      ${status?.toLowerCase() === "doctor" ? "bg-blue-100 text-blue-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || "Patient"}
                  </span>
                </SlideInOnScroll>
              ))
            )}
          </div>
          <div className="text-center mt-10 sm:mt-12">
            <button
              onClick={() => navigate("/testimonial")}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              aria-label="View all testimonials"
            >
              View All Testimonials
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-[95%] sm:max-w-5xl mx-auto my-12 sm:my-16 px-4 sm:px-6 md:px-10">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-800 mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: faLock, title: "Secure Platform", desc: "Our system ensures privacy and security for all users." },
            { icon: faGlobe, title: "Eliminate Language Barriers", desc: "Real-time message translation through NLP in live chat consultations." },
            { icon: faDollarSign, title: "Low-Cost Consultations", desc: "Affordable medical advice from trusted professionals." },
          ].map((why, i) => (
            <SlideInOnScroll
              key={i}
              direction={i % 2 === 0 ? "left" : "right"}
              className="flex flex-col items-center p-4 sm:p-6 bg-white shadow-lg rounded-lg"
            >
              <FontAwesomeIcon icon={why.icon} className="text-blue-500 text-3xl sm:text-4xl mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold">{why.title}</h3>
              <p className="text-gray-600 text-center text-sm sm:text-base mt-2">{why.desc}</p>
            </SlideInOnScroll>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-[95%] sm:max-w-4xl mx-auto my-12 sm:my-16 px-4 sm:px-6 md:px-10 text-center bg-gray-100 shadow-lg rounded-lg py-8 sm:py-10">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Stay Connected</h2>
        <p className="text-gray-700 text-sm sm:text-base mt-2">
          Stay informed with our latest updates and expert health tips — subscribe to our newsletter today!
        </p>
        {!isSubscribed ? (
          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="w-full sm:w-80 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
            <button
              onClick={handleSubscribe}
              className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-3 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition shadow-md"
            >
              Subscribe
            </button>
          </div>
        ) : (
          <div className="mt-6 bg-white p-4 sm:p-6 rounded-md shadow-md max-w-lg mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-green-600 mb-2">🎉 You're Subscribed!</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
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