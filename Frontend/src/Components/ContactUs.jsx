import React, { useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faMapMarkerAlt, faComments } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner"; // ✅ Import Sonner toast
import AppContext from "../Context/AppContext"; 

const ContactUs = () => {
  const { sendContactMessage, loading } = useContext(AppContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await sendContactMessage(formData);

    if (response.error) {
      toast.error(response.error); // ❌ Show error toast
    } else {
      toast.success("Message sent successfully!"); // ✅ Show success toast
      setFormData({ name: "", email: "", message: "" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-16 px-6 sm:px-10 md:px-14">
      <section className="text-center mb-16">  
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-500">Contact Us</h2>
        <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
          Have questions or need assistance? Reach out to us through the information below or send us a message directly.
        </p>
      </section>

      <section className="flex flex-col md:flex-row justify-center items-start gap-12"> 
        <div className="w-full md:w-2/5 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h3>

          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faPhone} className="text-blue-500 text-xl" />
            <p className="text-gray-700">+1 234 567 890</p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 text-xl" />
            <p className="text-gray-700">support@example.com</p>
          </div>

          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500 text-xl" />
            <p className="text-gray-700">123 Street Name, City, Country</p>
          </div>
        </div>

        {/* ✅ Send a Message Section */}
        <div className="w-full md:w-3/5 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Send a Message</h3>
          <form onSubmit={handleSubmit}>
            {/* Name Input */}
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name" 
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              required
            />

            {/* Email Input */}
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email" 
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              required
            />

            {/* Message Input */}
            <label className="block text-gray-700 font-medium mb-1">Your Message</label>
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter your message" 
              rows="4"
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              required
            ></textarea>

            {/* Submit Button */}
            <button 
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-600 transition w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Submit"}
            </button>
          </form>
        </div>
      </section>

      {/* ✅ "We Are Here to Help" Section */}
      <section className="mt-16 bg-gray-100 py-12 px-6 text-center rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800">We Are Here for Help</h2>
        <p className="text-gray-600 mt-4 max-w-3xl mx-auto">
          Our support team is available 24/7 to assist you with any inquiries or issues. Whether you need guidance, 
          technical assistance, or general support, we are just a click away.
        </p>
        <button 
          className="mt-6 bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-600 transition flex items-center mx-auto"
        >
          <FontAwesomeIcon icon={faComments} className="mr-2 text-lg" />
          Chat with Support
        </button>
      </section>
    </div>
  );
};

export default ContactUs;
