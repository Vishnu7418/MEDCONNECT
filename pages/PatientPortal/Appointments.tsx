import React, { useState, useMemo } from 'react';
import type { Appointment, User } from '../../types';
import TelemedicineModal from './TelemedicineModal';
import BookingModal from './BookingModal';
import ConfirmationModal from '../../components/ConfirmationModal';

interface AppointmentsProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const Appointments: React.FC<AppointmentsProps> = ({ user, appointments, setAppointments }) => {
  const patientAppointments = useMemo(() => {
    return appointments
      .filter(app => app.patientId === user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, user.id]);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);

  const handleStartCall = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setTimeout(() => setNotificationMessage(''), 4000);
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

    setAppointments(prevAppointments => {
        let updatedAppointments = prevAppointments;
        if (reschedulingAppointmentId) {
            updatedAppointments = updatedAppointments.map(app => 
                app.id === reschedulingAppointmentId 
                    ? { ...app, status: 'Cancelled' }
                    : app
            );
        }
        return [...updatedAppointments, newAppointment];
    });
    
    setBookingModalOpen(false);
    showNotification(reschedulingAppointmentId ? 'Your appointment has been successfully rescheduled.' : 'Your appointment has been booked successfully.');
    setReschedulingAppointmentId(null);
  };

  const handleReschedule = (appointmentId: string) => {
    setReschedulingAppointmentId(appointmentId);
    setBookingModalOpen(true);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    setConfirmModalOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (!appointmentToCancelId) return;

    setAppointments(prevAppointments => 
        prevAppointments.map(app => 
            app.id === appointmentToCancelId 
                ? { ...app, status: 'Cancelled' } 
                : app
        )
    );
    showNotification('Your appointment has been cancelled.');
    setConfirmModalOpen(false);
    setAppointmentToCancelId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text">Your Appointments</h2>
        <button 
          onClick={() => {
            setReschedulingAppointmentId(null);
            setBookingModalOpen(true);
          }}
          className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition"
        >
          Book New Appointment
        </button>
      </div>

      {notificationMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md animate-fadeIn dark:bg-green-900/50 dark:text-green-300" role="alert">
          <p className="font-bold">Success</p>
          <p>{notificationMessage}</p>
        </div>
      )}

      <div className="space-y-6">
        {patientAppointments.length > 0 ? (
          patientAppointments.map(app => (
            <div key={app.id} className="bg-light dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className={`text-sm font-semibold ${
                    app.status === 'Upcoming' ? 'text-green-600 dark:text-green-400' : 
                    app.status === 'Cancelled' ? 'text-red-500 dark:text-red-400' : 
                    'text-gray-500 dark:text-gray-400'
                }`}>{app.status}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-text">{app.doctorSpecialization} with {app.doctorName}</p>
                <p className="text-gray-600 dark:text-gray-300">{new Date(app.date  + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {app.time}</p>
              </div>
              <div className="flex-shrink-0 flex gap-2 flex-wrap justify-end">
                {app.status === 'Upcoming' && (
                  <>
                    <button onClick={() => handleStartCall(app)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-md text-sm hover:bg-green-600 transition-colors">Start Video Call</button>
                    <button onClick={() => handleReschedule(app.id)} className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-md text-sm hover:bg-primary/20 dark:hover:bg-primary/30">Reschedule</button>
                    <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">Cancel</button>
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
          onClose={() => {
            setBookingModalOpen(false);
            setReschedulingAppointmentId(null);
          }}
          onAppointmentBooked={handleAppointmentBooked}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={confirmCancelAppointment}
          title="Cancel Appointment"
          message="Are you sure you want to cancel this appointment? This action cannot be undone."
          confirmText="Yes, Cancel"
          cancelText="No, Keep It"
        />
      )}
    </div>
  );
};

export default Appointments;
