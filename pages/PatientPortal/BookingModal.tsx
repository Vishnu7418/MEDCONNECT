import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DOCTORS } from '../../constants';

interface BookingModalProps {
  onClose: () => void;
  onAppointmentBooked: (details: { doctorId: string; doctorName: string; doctorSpecialization: string; date: string; time: string; }) => void;
}

// Generate some sample time slots
const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

const BookingModal: React.FC<BookingModalProps> = ({ onClose, onAppointmentBooked }) => {
  const specializations = useMemo(() => [...new Set(MOCK_DOCTORS.map(d => d.specialization))], []);

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(specializations[0] || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string>('');

  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter(d => d.specialization === selectedSpecialization);
  }, [selectedSpecialization]);

  // Reset selected doctor when specialization changes
  useEffect(() => {
    setSelectedDoctorId('');
  }, [selectedSpecialization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !date || !time) {
      setError('Please select a doctor, date, and a time slot.');
      return;
    }
    setError('');
    
    const selectedDoctor = MOCK_DOCTORS.find(d => d.id === selectedDoctorId);
    if (!selectedDoctor) {
        setError('Selected doctor not found.');
        return;
    }

    onAppointmentBooked({
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialization: selectedDoctor.specialization,
      date,
      time,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Book a New Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          {/* Step 1: Specialization */}
          <div>
            <label htmlFor="specialization" className="block text-lg font-medium text-gray-700 dark:text-gray-300">1. Select Specialization</label>
            <select
              id="specialization"
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Doctor Selection */}
          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">2. Select a Doctor</label>
            <div className="mt-2 space-y-4 max-h-64 overflow-y-auto p-2 border rounded-md dark:border-gray-600 bg-light/50 dark:bg-dark-bg/50">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`p-4 rounded-lg flex items-start gap-4 cursor-pointer transition-all duration-200 ${
                      selectedDoctorId === doctor.id
                        ? 'bg-primary/10 border-2 border-primary shadow-md'
                        : 'bg-white dark:bg-dark-card border border-transparent dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    <img src={doctor.imageUrl} alt={doctor.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900 dark:text-dark-text">{doctor.name}</h4>
                      <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{doctor.bio}</p>
                      <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 inline-block px-2 py-1 rounded">
                        Availability: {doctor.availability}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 p-4">No doctors available for this specialization.</p>
              )}
            </div>
          </div>

          {/* Step 3: Date & Time */}
          {selectedDoctorId && (
             <div className="animate-fadeIn">
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">3. Select Date & Time</label>
              <div className="mt-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Today's date
                  className="block w-full sm:w-1/2 shadow-sm sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              {date && (
                <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Available Slots</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map(slot => (
                            <button
                                type="button"
                                key={slot}
                                onClick={() => setTime(slot)}
                                className={`py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                                    time === slot
                                    ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary ring-offset-white dark:ring-offset-dark-card'
                                    : 'bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30'
                                }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="pt-4 flex justify-end gap-3 flex-shrink-0 border-t dark:border-dark-border">
             <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDoctorId || !date || !time}
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
