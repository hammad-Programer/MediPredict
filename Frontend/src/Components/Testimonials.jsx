import React, { useContext, useState } from "react";
import AppContext from "../Context/AppContext";
import { toast } from "sonner"; // ✅ Import sonner toast

const Testimonials = () => {
  const { testimonials, loading, addTestimonial, setTestimonials } = useContext(AppContext);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    status: "patient",
    comment: "",
  });

  const getRole = (status) => {
    if (!status) return "Patient";
    return status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await addTestimonial(formData);
  
    if (!result.error) {
      // ✅ Add the new testimonial directly into frontend
      setTestimonials((prev) => [{ 
        _id: result._id, 
        name: formData.name, 
        status: formData.status, 
        comment: formData.comment 
      }, ...prev].slice(0, 6));
  
      toast.success("✅ Testimonial submitted successfully!");
  
      // ✅ Now reset and close the popup
      setFormData({ name: "", status: "patient", comment: "" });
      setShowForm(false); // ✅ This will close the popup immediately
    } else {
      toast.error("❌ Failed to submit testimonial. Please try again.");
    }
  };
  

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto relative overflow-hidden">

      {/* Header */}
      <div className="text-center mb-20">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">Hear From Our Customers</h1>
        <p className="text-gray-600 text-lg">
          Real stories from doctors and patients who trust our platform every day.
        </p>
      </div>

      {/* Testimonials */}
      <div className="flex flex-wrap justify-center gap-8 mt-16">
        {loading ? (
          <p className="text-gray-600 text-lg">Loading testimonials...</p>
        ) : testimonials.length > 0 ? (
          testimonials.slice(0, 6).map((testimonial) => (
            <div
              key={testimonial._id}
              className="w-80 p-6 border border-gray-200 rounded-lg shadow-md bg-white hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{testimonial.name}</h3>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 
                  ${testimonial.status?.toLowerCase() === 'doctor'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                  }`}
              >
                {getRole(testimonial.status)}
              </span>
              {testimonial.message && (
                <p className="text-gray-600 italic mb-2">"{testimonial.message}"</p>
              )}
              {testimonial.comment && (
                <div className="mt-2">
                  <p className="text-gray-600 text-sm">{testimonial.comment}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-lg">No testimonials available yet.</p>
        )}
      </div>

      {/* Share Experience Section */}
      <div className="bg-gray-100 text-center py-12 px-6 rounded-lg mt-24 mb-12 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-500 mb-4">Share Your Experience</h2>
        <p className="text-gray-700 text-lg mb-6">
          We would love to hear your thoughts and experiences. Your feedback helps us improve!
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
        >
          Submit Your Thoughts
        </button>
      </div>

      {/* Slide-in Form from Right */}
      <div className={`fixed top-20 right-0 w-96 bg-white shadow-lg p-8 transition-transform duration-300 z-50 ${showForm ? "translate-x-0" : "translate-x-full"}`}>
  
  {/* Close Button */}
  <button
    onClick={() => setShowForm(false)}
    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold focus:outline-none"
    aria-label="Close"
  >
    &times;
  </button>

  <h2 className="text-2xl font-bold text-blue-500 mb-6">Submit Testimonial</h2>

  <form onSubmit={handleSubmit} className="space-y-4">
    <input
      type="text"
      placeholder="Your Name"
      className="w-full border border-gray-300 p-3 rounded"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      required
    />

    <select
      className="w-full border border-gray-300 p-3 rounded"
      value={formData.status}
      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
    >
      <option value="doctor">Doctor</option>
      <option value="patient">Patient</option>
    </select>

    <textarea
      placeholder="Your Comment"
      className="w-full border border-gray-300 p-3 rounded"
      value={formData.comment}
      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
      rows={4}
      required
    />

    <div className="flex justify-center">
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded"
      >
        Submit
      </button>
    </div>
  </form>
</div>


    </div>
  );
};

export default Testimonials;
