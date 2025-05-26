import React, { useContext, useEffect, useState } from "react";
import AppointmentContext from "../../Context/AppointmentContext";
import AppContext from "../../Context/AppContext";
import { toast } from "sonner";
import { MdCancel, MdPayment } from "react-icons/md";

const PatientAppointments = () => {
  const {
    appointments,
    setAppointments,
    getPatientAppointments,
    cancelAppointment,
    loading,
  } = useContext(AppointmentContext);
  const { user } = useContext(AppContext);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);

  useEffect(() => {
    if (user?._id) {
      getPatientAppointments(user._id);
    }
  }, [user]);

  const handlePay = (appointmentId) => {
    toast("Payment functionality coming soon!");
  };

  const confirmCancel = (appointmentId) => {
    setSelectedApptId(appointmentId);
    setShowConfirm(true);
  };

  const handleCancelConfirmed = async () => {
    setShowConfirm(false);
    try {
      const result = await cancelAppointment(selectedApptId);
      if (result.success) {
        setAppointments((prev) =>
          prev.filter((appt) => appt._id !== selectedApptId)
        );
        toast.success("Appointment cancelled successfully.");
      } else {
        toast.error("Failed to cancel the appointment.");
      }
    } catch (err) {
      toast.error("Unexpected error occurred while cancelling.");
    }
  };

  const visibleAppointments = appointments.filter(
    (appt) => appt?.doctor && appt.status !== "cancelled"
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">
        My Appointments
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 text-lg animate-pulse">
          Loading appointments...
        </p>
      ) : visibleAppointments.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">
          No appointments booked yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAppointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col space-y-5 hover:shadow-2xl transition-shadow duration-300"
            >
              {/* Doctor Info */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-cyan-400">
                  <img
                    src={appt.doctor.imageUrl || "https://via.placeholder.com/80"}
                    alt="Doctor"
                    className="rounded-full w-full h-full object-cover border-4 border-white"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr. {appt.doctor.name}
                  </h3>
                  <p className="text-sm text-cyan-600 font-medium">
                    {appt.doctor.speciality}
                  </p>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-gray-700 text-sm font-medium">
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(appt.appointmentDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Time:</span> {appt.appointmentTime}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`${
                      appt.status === "confirmed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {(appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)) ||
                      "Unknown"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Payment:</span>{" "}
                  <span
                    className={`${
                      appt.paymentStatus === "paid"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(appt.paymentStatus?.charAt(0).toUpperCase() +
                      appt.paymentStatus?.slice(1)) ||
                      "Unknown"}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                {appt.paymentStatus !== "paid" && (
                  <button
                    onClick={() => handlePay(appt._id)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-5 py-2 rounded-full font-semibold shadow-lg hover:from-blue-600 hover:to-cyan-500 transition w-full sm:w-auto"
                    aria-label="Pay now"
                  >
                    <MdPayment size={20} />
                    Pay now
                  </button>
                )}
                <button
                  onClick={() => confirmCancel(appt._id)}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full font-semibold shadow-lg hover:bg-red-700 transition w-full sm:w-auto"
                  aria-label="Cancel appointment"
                >
                  <MdCancel size={20} />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center animate-fadeIn">
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              Cancel Appointment?
            </h3>
            <p className="text-gray-600 mb-8">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              <button
                onClick={handleCancelConfirmed}
                className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold shadow hover:bg-red-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
              >
                No, Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
