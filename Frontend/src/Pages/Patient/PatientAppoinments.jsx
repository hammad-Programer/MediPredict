import React, { useContext, useEffect } from "react";
import AppointmentContext from "../../Context/AppointmentContext";
import AppContext from "../../Context/AppContext";
import { toast } from "sonner";

const PatientAppointments = () => {
  const {
    appointments,
    setAppointments,
    getPatientAppointments,
    cancelAppointment,
    loading,
  } = useContext(AppointmentContext);
  const { user } = useContext(AppContext);

  useEffect(() => {
    if (user?._id) {
      getPatientAppointments(user._id);
    }
  }, [user]);

  const handlePay = (appointmentId) => {
    toast("Payment functionality coming soon!");
  };

  const handleCancel = async (appointmentId) => {
    const confirm = window.confirm("Are you sure you want to cancel this appointment?");
    if (!confirm) return;

    try {
      const result = await cancelAppointment(appointmentId);
      if (result.success) {
        setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentId));
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
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-8">My Appointments</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading appointments...</p>
      ) : visibleAppointments.length === 0 ? (
        <p className="text-center text-gray-400">No appointments booked yet.</p>
      ) : (
        <div className="space-y-6">
          {visibleAppointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-xl shadow-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Doctor Info */}
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <img
                  src={appt.doctor.imageUrl || "https://via.placeholder.com/60"}
                  alt="Doctor"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Dr. {appt.doctor.name}
                  </h3>
                  <p className="text-sm text-blue-500">{appt.doctor.speciality}</p>
                  <div className="mt-2 text-sm text-blue-600 space-y-1">
                    <p>
                      <strong>Date & Time:</strong> {appt.appointmentDate} at{" "}
                      {appt.appointmentTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto sm:justify-end">
                {appt.paymentStatus !== "paid" && (
                  <button
                    onClick={() => handlePay(appt._id)}
                    className="bg-blue-500 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-blue-600"
                  >
                    Pay now
                  </button>
                )}
                <button
                  onClick={() => handleCancel(appt._id)}
                  className="text-red-600 border border-red-500 px-5 py-2 rounded-md text-sm hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
