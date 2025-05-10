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
      if (matched) {
        setSelectedSpeciality(concernToSpecialityMap[matched]);
      }
    }
  }, [concernQuery]);

  useEffect(() => {
    if (selectedDoctor) {
      getBookedSlots(selectedDoctor._id).then(setBookedSlots);
    }
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

    const isTodayAvailable = doc.daysAvailable.includes(currentDay);
    const isNextDayAvailable = doc.daysAvailable.includes(getNextDay(currentDay));

    if (start < end) {
      return isTodayAvailable && nowTime >= start && nowTime <= end;
    } else {
      return (
        (nowTime >= start && isTodayAvailable) ||
        (nowTime <= end && isNextDayAvailable)
      );
    }
  };

  const filteredDoctors =
    selectedSpeciality === "All"
      ? profiles || []
      : profiles?.filter((doc) => doc.speciality === selectedSpeciality);

  const handleBook = async () => {
    if (!user || !user._id) {
      toast.error("Please login to book an appointment.");
      return;
    }

    if (!selectedDoctor || !activeDay || !activeTime) {
      toast.error("Please select day and time to book.");
      return;
    }

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
    <div className="max-w-7xl mx-auto p-6">
      {/* Speciality Sidebar */}
      <div className="flex gap-12">
        <aside className="w-48 shrink-0">
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

        {/* Doctors Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <div
                key={doc._id}
                onClick={() => {
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

      {/* Main Doctor Modal (includes booking UI) */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm overflow-y-auto px-4 py-10">
          <div className="bg-white rounded-xl p-6 max-w-4xl mx-auto shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-2xl font-bold"
            >
              &times;
            </button>

            <div className="flex gap-4 items-center border-b pb-4 mb-4">
  <img
    src={selectedDoctor.imageUrl}
    alt={selectedDoctor.name}
    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border shadow"
  />
  <div>
    <h2 className="text-xl font-semibold text-blue-700">
      Dr. {selectedDoctor.name}
    </h2>
    <p className="text-sm text-gray-500">{selectedDoctor.speciality}</p>
  </div>
</div>

{/* Doctor Info Section */}
<div>
  <p className="text-sm text-gray-600">
    <strong>Experience:</strong> {selectedDoctor.experience}
  </p>
  <p className="text-sm text-gray-600">
    <strong>Fees:</strong> ${selectedDoctor.fees}
  </p>
  <p className="text-sm text-gray-600">
    <strong>Timing:</strong> {selectedDoctor.timing}
  </p>
  <p className="text-sm text-gray-600">
    <strong>Available Days:</strong> {selectedDoctor.daysAvailable?.join(", ")}
  </p>
  <p className="text-sm text-gray-600 mt-2">
    <strong>About:</strong> {selectedDoctor.about || "No description provided."}
  </p>

  {/* Day Selection */}
  <div className="flex flex-wrap gap-2 mt-4">
    {selectedDoctor.daysAvailable?.map((day, i) => (
      <span
        key={i}
        className={`px-3 py-1 border rounded-full cursor-pointer text-sm ${
          activeDay === day ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
        }`}
        onClick={() => setActiveDay(day)}
      >
        {day}
      </span>
    ))}
  </div>

  {/* Time Slot Selection */}
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

        return slots.map((time, i) => (
          <button
            key={i}
            onClick={() => setActiveTime(time)}
            className={`px-4 py-1 rounded-full text-sm border transition ${
              activeTime === time
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
          >
            {time}
          </button>
        ));
      })()}
    </div>
  )}

  {/* Book Appointment Button */}
  <button
    className="mt-2 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
    onClick={handleBook}
  >
    Book Appointment
  </button>

  {/* Review Section (unchanged) */}
  <div className="mt-6 bg-white rounded-xl shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold text-gray-800">286 Reviews</h3>
      <div className="flex items-center space-x-1 text-yellow-400 text-lg">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
    </div>
    <div className="flex items-center space-x-4 mb-6">
      <div className="bg-blue-800 text-white px-4 py-2 rounded text-lg font-bold">5/5</div>
      <p className="text-sm text-gray-600">Average rating based on 286 reviews.</p>
    </div>
    <div className="flex items-center justify-start gap-12 mb-6 text-sm text-gray-800 border-b pb-4">
      <div>
        <p className="font-semibold">Wait Time</p>
        <p>10 mins</p>
      </div>
      <div>
        <p className="font-semibold">Avg. Time to Patient</p>
        <p>24 mins</p>
      </div>
    </div>
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm text-gray-800 font-medium mb-1">
          <span>Patient Satisfaction</span>
          <span>4.8/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-700 h-2 rounded-full" style={{ width: "96%" }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-800 font-medium mb-1">
          <span>Diagnosis</span>
          <span>4.8/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-700 h-2 rounded-full" style={{ width: "96%" }}></div>
        </div>
      </div>
    </div>
  </div>

  {/* Patient Comments */}
  <div className="mt-6">
    <h4 className="font-semibold text-gray-800 mb-2">Patient Reviews</h4>
    <ul className="space-y-2 text-sm text-gray-700 max-h-48 overflow-y-auto">
      <li className="bg-gray-50 p-3 rounded">"Dr. Smith was very attentive and helpful!"</li>
      <li className="bg-gray-50 p-3 rounded">"Quick diagnosis and very accurate."</li>
      <li className="bg-gray-50 p-3 rounded">"I loved the video consultation. Very easy process."</li>
    </ul>
  </div>
</div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AllDoctor;
