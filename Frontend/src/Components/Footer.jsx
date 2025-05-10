import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLaptopMedical } from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faXTwitter, faInstagram } from "@fortawesome/free-brands-svg-icons";
import logoW from "../assets/Logo-White.svg";
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-5 mt-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* ✅ 1. Company Info */}
        <div>
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-white">
            <img
                src={logoW}
                alt="MediPredict Logo"
                className="h-6 w-auto  sm:h-6 object-contain"
              />
          </Link>
          <p className="text-gray-400 mt-4">
            MediPredict is an AI-powered health platform providing online consultations, expert doctors, and health education for everyone.
          </p>

          {/* ✅ Social Media Icons */}
          <div className="flex space-x-4 mt-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition">
              <FontAwesomeIcon icon={faFacebook} className="text-2xl" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition">
              <FontAwesomeIcon icon={faXTwitter} className="text-2xl" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition">
              <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
            </a>
          </div>
        </div>

        {/* ✅ 2. Services */}
        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Services</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/services/online-consultation" className="hover:text-white transition">Online Consultation</Link></li>
            <li><Link to="/services/specialist-doctors" className="hover:text-white transition">Specialist Doctors</Link></li>
            <li><Link to="/services/health-education" className="hover:text-white transition">Health Education</Link></li>
            <li><Link to="/services/community" className="hover:text-white transition">Community</Link></li>
          </ul>
        </div>

        {/* ✅ 3. Support */}
        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Support</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-white transition">Privacy & Policy</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-white transition">Terms of Service</Link></li>
          </ul>
        </div>

        {/* ✅ 4. Company */}
        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Company</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link to="/about" className="hover:text-white transition">About</Link></li>
            <li><Link to="/doctors" className="hover:text-white transition">Doctors</Link></li>
            <li><Link to="/testimonial" className="hover:text-white transition">Testimonial</Link></li>
            <li><Link to="/careers" className="hover:text-white transition">Careers</Link></li>
          </ul>
        </div>
      </div>

      {/* ✅ Copyright Section */}
      <div className="text-center text-gray-500 mt-8 border-t border-gray-700 pt-6">
        &copy; 2026 MediPredict. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
