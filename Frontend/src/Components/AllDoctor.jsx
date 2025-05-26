import React, { useContext, useEffect, useState } from "react";
import ProfileContext from "../Context/ProfileContext";
import AppointmentContext from "../Context/AppointmentContext";
import AppContext from "../Context/AppContext";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

const AllDoctor = () => {
  const { profiles, fetchProfiles } = useContext(ProfileContext);
  const { bookAppointment, getBookedSlots } = useContext(AppointmentContext);
  const { user } = useContext(AppContext);

  const [selectedSpeciality, setSelectedSpeciality] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [activeTime, setActiveTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const concernQuery = queryParams.get("concern");

  const navigate = useNavigate();

  useEffect(() => {
    if (concernQuery) {
      const concernToSpecialityMap = {
        heart: "Cardiologist",
        fever: "General physician",
        skin: "Dermatologist",
        brain: "Neurologist",
        child: "Pediatrician",
        stomach: "Gastroenterologist",
        pregnancy: "Gynecologist",
        cough: "General physician",
      };
      const matched = Object.keys(concernToSpecialityMap).find((keyword) =>
        concernQuery.includes(keyword)
      );
      if (matched) setSelectedSpeciality(concernToSpecialityMap[matched]);
    }
  }, [concernQuery]);

  useEffect(() => {
    if (selectedDoctor) getBookedSlots(selectedDoctor._id).then(setBookedSlots);
  }, [selectedDoctor]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const specialties = [
    "All",
    "General physician",
    "Gynecologist",
    "Dermatologist",
    "Pediatrician",
    "Neurologist",
    "Gastroenterologist",
  ];

  const isProfileComplete = (profile) => {
    const requiredFields = [
      "name", "email", "speciality", "education", "experience", "fees",
      "address1", "timing", "daysAvailable", "about", "imageUrl",
    ];
    return requiredFields.every((field) => {
      const value = profile[field];
      return Array.isArray(value) ? value.length > 0 : value?.toString().trim();
    });
  };

  const filteredDoctors = profiles
    ?.filter(isProfileComplete)
    ?.filter((doc) =>
      selectedSpeciality === "All" ? true : doc.speciality === selectedSpeciality
    ) || [];

  const getNextDay = (day) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const index = days.indexOf(day);
    return days[(index + 1) % 7];
  };

  const isDoctorAvailableNow = (doc) => {
    if (!doc.timing || !doc.daysAvailable?.length) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const nowTime = now.getHours() + now.getMinutes() / 60;

    const parseTime = (str) => {
      const [time, modifier] = str.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours + minutes / 60;
    };

    const [startStr, endStr] = doc.timing.split(" - ");
    const start = parseTime(startStr);
    const end = parseTime(endStr);

    const isToday = doc.daysAvailable.includes(currentDay);
    const isNext = doc.daysAvailable.includes(getNextDay(currentDay));

    if (start < end) {
      return isToday && nowTime >= start && nowTime <= end;
    } else {
      return (nowTime >= start && isToday) || (nowTime <= end && isNext);
    }
  };

  const handleBook = async () => {
    if (!user || !user._id) return toast.error("Please login to book an appointment.");
    if (!selectedDoctor || !activeDay || !activeTime) return toast.error("Please select day and time to book.");

    const result = await bookAppointment({
      doctorId: selectedDoctor._id,
      patientId: user._id,
      appointmentDate: activeDay,
      appointmentTime: activeTime,
    });

    if (result.success) {
      toast.success("Appointment booked successfully!");
      setShowModal(false);
      setActiveDay(null);
      setActiveTime(null);
    } else {
      toast.error(result.message || "Booking failed.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-48 shrink-0 mb-4 lg:mb-0">
          <ul className="space-y-3">
            {specialties.map((spec) => (
              <li key={spec}>
                <button
                  onClick={() => setSelectedSpeciality(spec)}
                  className={`w-full px-3 py-2 rounded-full border transition text-left text-sm ${
                    selectedSpeciality === spec
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {spec}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Doctor Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <div
                key={doc._id}
                onClick={() => {
                  if (!user || !user._id) {
                    toast.error("Please sign up to book a doctor.");
                    navigate("/signup");
                    return;
                  }
                  setSelectedDoctor(doc);
                  setShowModal(true);
                }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 ease-in-out cursor-pointer overflow-hidden h-[260px]"
              >
                <div className="w-full h-40 overflow-hidden">
                  <img
                    src={doc.imageUrl}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className={`text-xs font-medium mb-1 ${isDoctorAvailableNow(doc) ? "text-green-600" : "text-red-500"}`}>
                    ● {isDoctorAvailableNow(doc) ? "Available" : "Not Available"}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">Dr. {doc.name}</h3>
                  <p className="text-xs text-gray-500">{doc.speciality}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-gray-500 text-center">No doctors found.</p>
          )}
        </section>
      </div>

      {/* Main Doctor Modal */}
      {showModal && selectedDoctor && (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md overflow-y-auto scrollbar-hide px-4 py-10">

    <div className="bg-white rounded-2xl max-w-4xl mx-auto shadow-xl relative">

      {/* Close Button */}
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold"
      >
        &times;
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border-b p-6 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
        <img
          src={selectedDoctor.imageUrl}
          alt={selectedDoctor.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-blue-700">Dr. {selectedDoctor.name}</h2>
          <p className="text-sm text-gray-500">{selectedDoctor.speciality}</p>
          <span className={`text-xs font-medium mt-1 inline-block rounded px-2 py-1 ${isDoctorAvailableNow(selectedDoctor) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            ● {isDoctorAvailableNow(selectedDoctor) ? "Available Now" : "Not Available"}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 text-sm text-gray-700">
        <p><strong>Experience:</strong> {selectedDoctor.experience}</p>
        <p><strong>Fees:</strong> ${selectedDoctor.fees}</p>
        <p><strong>Timing:</strong> {selectedDoctor.timing}</p>
        <p><strong>Available Days:</strong> {selectedDoctor.daysAvailable?.join(", ")}</p>
        <p className="mt-2"><strong>About:</strong> {selectedDoctor.about || "No description provided."}</p>

        {/* Day Selection */}
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedDoctor.daysAvailable?.map((day, i) => {
            const available = isDoctorAvailableNow(selectedDoctor);
            return (
              <button
                key={i}
                onClick={() => {
                  if (!available) {
                    toast.error("Doctor is not available now");
                    return;
                  }
                  setActiveDay(day);
                }}
                disabled={!available}
                className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                  activeDay === day
                    ? "bg-blue-600 text-white"
                    : !available
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        {selectedDoctor.timing && activeDay && (
          <div className="flex flex-wrap gap-2 my-4">
            {(() => {
              const [start, end] = selectedDoctor.timing.split(" - ");
              const parseTime = (str) => {
                const [time, ampm] = str.split(" ");
                let [h, m] = time.split(":").map(Number);
                if (ampm === "PM" && h !== 12) h += 12;
                if (ampm === "AM" && h === 12) h = 0;
                return h * 60 + m;
              };
              const formatTime = (min) => {
                let h = Math.floor(min / 60);
                const m = min % 60;
                const ampm = h >= 12 ? "PM" : "AM";
                h = h % 12 || 12;
                return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
              };
              const startM = parseTime(start);
              const endM = parseTime(end);
              const slots = [];

              if (startM < endM) {
                for (let m = startM; m <= endM; m += 30) slots.push(formatTime(m));
              } else {
                for (let m = startM; m < 1440; m += 30) slots.push(formatTime(m));
                for (let m = 0; m <= endM; m += 30) slots.push(formatTime(m));
              }

              return slots.map((time, i) => {
                const available = isDoctorAvailableNow(selectedDoctor);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!available) {
                        toast.error("Doctor is not available now");
                        return;
                      }
                      setActiveTime(time);
                    }}
                    disabled={!available}
                    className={`px-4 py-1 rounded-full text-sm border font-medium ${
                      activeTime === time
                        ? "bg-blue-600 text-white"
                        : !available
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    {time}
                  </button>
                );
              });
            })()}
          </div>
        )}

        {/* Book Button */}
        <button
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          onClick={handleBook}
        >
          Book Appointment
        </button>

        {/* Review Section */}
        <div className="mt-8 p-6 rounded-xl bg-gray-50 shadow-inner">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⭐ Patient Reviews</h3>

          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-700 text-white px-4 py-2 rounded text-lg font-bold">5/5</div>
            <p className="text-sm text-gray-600">Based on 286 reviews</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Patient Satisfaction</span>
                <span>4.8</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Diagnosis</span>
                <span>4.7</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>
          </div>

          {/* Patient Comments */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-gray-700">Patient Feedback</h4>
            <ul className="space-y-2 text-sm text-gray-600 max-h-48 overflow-y-auto">
              <li className="bg-white p-3 rounded shadow-sm">"Dr. Smith was very attentive and helpful!"</li>
              <li className="bg-white p-3 rounded shadow-sm">"Quick diagnosis and very accurate."</li>
              <li className="bg-white p-3 rounded shadow-sm">"I loved the video consultation. Smooth experience."</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default AllDoctor;
