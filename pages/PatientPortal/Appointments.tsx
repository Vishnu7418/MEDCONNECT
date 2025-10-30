import React, { useState, useMemo } from 'react';
import type { Appointment, User } from '../../types';
import TelemedicineModal from './TelemedicineModal';
import BookingModal from './BookingModal';

interface AppointmentsProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const Appointments: React.FC<AppointmentsProps> = ({ user, appointments, setAppointments }) => {
  const patientAppointments = useMemo(() => {
    return appointments
      .filter(app => app.patientId === user.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, user.id]);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleStartCall = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };
  
  const handleAppointmentBooked = (details: { doctorId: string; doctorName: string, doctorSpecialization: string; date: string; time: string; }) => {
    const newAppointment: Appointment = {
      id: `app_${new Date().getTime()}`,
      patientId: user.id,
      patientName: user.name,
      ...details,
      status: 'Upcoming',
      type: 'New Consultation',
    };

    setAppointments(prev => [...prev, newAppointment]);
    setBookingModalOpen(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 4000); // Hide success message after 4 seconds
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text">Your Appointments</h2>
        <button 
          onClick={() => setBookingModalOpen(true)}
          className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition"
        >
          Book New Appointment
        </button>
      </div>

      {bookingSuccess && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md animate-fadeIn dark:bg-green-900/50 dark:text-green-300" role="alert">
          <p className="font-bold">Success</p>
          <p>Your appointment has been booked successfully.</p>
        </div>
      )}

      <div className="space-y-6">
        {patientAppointments.length > 0 ? (
          patientAppointments.map(app => (
            <div key={app.id} className="bg-light dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className={`text-sm font-semibold ${app.status === 'Upcoming' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{app.status}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-text">{app.doctorSpecialization} with {app.doctorName}</p>
                <p className="text-gray-600 dark:text-gray-300">{new Date(app.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {app.time}</p>
              </div>
              <div className="flex-shrink-0 flex gap-2 flex-wrap justify-end">
                {app.status === 'Upcoming' && (
                  <>
                    <button onClick={() => handleStartCall(app)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-md text-sm hover:bg-green-600 transition-colors">Start Video Call</button>
                    <button className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-md text-sm hover:bg-primary/20 dark:hover:bg-primary/30">Reschedule</button>
                    <button className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">Cancel</button>
                  </>
                )}
                {app.status === 'Completed' && (
                  <button className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md text-sm cursor-not-allowed dark:bg-gray-600 dark:text-gray-300">View Summary</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">You have no appointments scheduled.</p>
        )}
      </div>
      
      {selectedAppointment && (
        <TelemedicineModal
          appointment={selectedAppointment}
          onClose={handleCloseModal}
        />
      )}
      
      {isBookingModalOpen && (
        <BookingModal
          onClose={() => setBookingModalOpen(false)}
          onAppointmentBooked={handleAppointmentBooked}
        />
      )}
    </div>
  );
};

export default Appointments;
