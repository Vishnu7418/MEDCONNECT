import React, { useState, useEffect, useMemo } from 'react';
import type { User, DoctorAvailability, Patient, Appointment, Prescription, LabTest } from '../../types';
import { MOCK_PATIENTS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


interface DoctorPortalProps {
  user: User;
  appointments: Appointment[];
  prescriptions: Prescription[];
  setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
  labTests: LabTest[];
}

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // 8 AM to 4:30 PM
    const minute = i % 2 === 0 ? '00' : '30';
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${String(displayHour).padStart(2, '0')}:${minute} ${period}`;
});

// Helper to format date as YYYY-MM-DD
const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// -- MODAL COMPONENTS --

interface PatientDetailModalProps {
    doctor: User;
    patient: Patient;
    appointments: Appointment[];
    prescriptions: Prescription[];
    labTests: LabTest[];
    onClose: () => void;
    onSavePrescription: (prescription: Prescription) => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ doctor, patient, appointments, prescriptions, labTests, onClose, onSavePrescription }) => {
    const [activeTab, setActiveTab] = useState<'Appointments' | 'Prescriptions' | 'Lab Results'>('Appointments');
    const [isCreatePrescriptionModalOpen, setCreatePrescriptionModalOpen] = useState(false);
    
    const getStatusClass = (status: LabTest['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b dark:border-dark-border">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Patient Chart: {patient.name}</h2>
                                <p className="text-gray-600 dark:text-gray-400">Age: {patient.age} | Condition: {patient.currentCondition}</p>
                             </div>
                             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <nav className="mt-4 -mb-px flex space-x-6 border-b dark:border-dark-border">
                            <button onClick={() => setActiveTab('Appointments')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Appointments</button>
                            <button onClick={() => setActiveTab('Prescriptions')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Prescriptions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Prescriptions ({prescriptions.length})</button>
                             <button onClick={() => setActiveTab('Lab Results')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Lab Results' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Lab Results ({labTests.length})</button>
                        </nav>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {activeTab === 'Appointments' && (
                            <div className="space-y-4">
                                {appointments.map(app => (
                                     <div key={app.id} className="p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 border-gray-400">
                                        <p className="font-semibold dark:text-dark-text">{app.type} ({app.status})</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(app.date).toLocaleDateString()} at {app.time}</p>
                                     </div>
                                ))}
                                {appointments.length === 0 && <p className="text-gray-500 dark:text-gray-400">No appointments found for this patient.</p>}
                            </div>
                        )}
                        {activeTab === 'Prescriptions' && (
                            <div>
                                <button onClick={() => setCreatePrescriptionModalOpen(true)} className="mb-4 bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Write New Prescription</button>
                                <div className="space-y-4">
                                    {prescriptions.map(p => (
                                        <div key={p.id} className={`p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 ${p.status === 'Active' ? 'border-blue-500' : 'border-gray-400'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-lg dark:text-dark-text">{p.medication} {p.dosage}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{p.frequency} for {p.duration}</p>
                                                    {p.notes && <p className="text-xs italic text-gray-500 dark:text-gray-300 mt-1">Notes: {p.notes}</p>}
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {prescriptions.length === 0 && <p className="text-gray-500 dark:text-gray-400">No prescriptions found for this patient.</p>}
                                </div>
                            </div>
                        )}
                        {activeTab === 'Lab Results' && (
                            <div className="space-y-4">
                                {labTests.map(test => (
                                    <div key={test.id} className="p-3 bg-light dark:bg-dark-bg rounded-md border dark:border-dark-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold dark:text-dark-text">{test.testType}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Requested on {test.date} by {test.requestedBy}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(test.status)}`}>{test.status}</span>
                                        </div>
                                        {test.status === 'Completed' && test.results && (
                                            <div className="mt-2 pt-2 border-t dark:border-gray-600">
                                                <p className="text-sm font-semibold dark:text-white">Results:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{test.results}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {labTests.length === 0 && <p className="text-gray-500 dark:text-gray-400">No lab tests found for this patient.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isCreatePrescriptionModalOpen && <CreatePrescriptionModal doctor={doctor} patient={patient} onSave={(p) => { onSavePrescription(p); setCreatePrescriptionModalOpen(false); }} onClose={() => setCreatePrescriptionModalOpen(false)} />}
        </>
    );
};

interface CreatePrescriptionModalProps {
    doctor: User;
    patient: Patient;
    onSave: (prescription: Prescription) => void;
    onClose: () => void;
}

const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({ doctor, patient, onSave, onClose }) => {
    const [medication, setMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!medication || !dosage || !frequency || !duration) {
            setError('Please fill out all required fields.');
            return;
        }
        setError('');
        onSave({
            id: `presc_${Date.now()}`,
            patientId: patient.id,
            patientName: patient.name,
            doctorId: doctor.id,
            doctorName: doctor.name,
            date: formatDate(new Date()),
            status: 'Active',
            medication, dosage, frequency, duration, notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">New Prescription for {patient.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={medication} onChange={e => setMedication(e.target.value)} placeholder="Medication (e.g., Amoxicillin)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Dosage (e.g., 500mg)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        <input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Frequency (e.g., Twice a day)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g., 10 days)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional Notes (optional)" rows={3} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Save Prescription</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className="bg-primary/10 dark:bg-primary/20 text-primary p-3 rounded-full">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);


const DoctorPortal: React.FC<DoctorPortalProps> = ({ user, appointments, prescriptions, setPrescriptions, labTests }) => {
  const [availability, setAvailability] = useState<DoctorAvailability>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const availabilityStorageKey = `doctorAvailability_${user.id}`;

  const doctorsAppointments = useMemo(() => appointments.filter(app => app.doctorId === user.id), [user.id, appointments]);
  const patientIds = useMemo(() => [...new Set(doctorsAppointments.map(app => app.patientId))], [doctorsAppointments]);
  const doctorPatients = useMemo(() => MOCK_PATIENTS.filter(p => patientIds.includes(p.id)), [patientIds]);

  const todaysAppointmentsCount = useMemo(() => doctorsAppointments.filter(
    app => app.date === formatDate(new Date()) && app.status === 'Upcoming'
  ).length, [doctorsAppointments]);
  
  const handleSavePrescription = (prescription: Prescription) => {
    // This function will either add a new prescription or update an existing one
    setPrescriptions(prev => {
        const existingIndex = prev.findIndex(p => p.id === prescription.id);
        if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = prescription;
            return updated;
        }
        return [...prev, prescription];
    });
  };

  useEffect(() => {
    try {
        const savedAvailability = localStorage.getItem(availabilityStorageKey);
        if (savedAvailability) {
            setAvailability(JSON.parse(savedAvailability));
        }
    } catch (error) { console.error("Failed to load availability", error); }
  }, [availabilityStorageKey]);

  useEffect(() => {
    try {
        localStorage.setItem(availabilityStorageKey, JSON.stringify(availability));
    } catch (error) { console.error("Failed to save availability", error); }
  }, [availability, availabilityStorageKey]);

  const handleDownloadPatientList = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Patient List - ${user.name}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${user.department || 'All Departments'}`, 14, 28);
    const head = [['Name', 'Age', 'Current Condition']];
    const body = doctorPatients.map(p => [p.name, p.age, p.currentCondition]);
    autoTable(doc, { head, body, startY: 35 });
    doc.save(`PatientList_${user.name.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor's Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user.name} ({user.department}).</p>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Patients Today" 
            value={todaysAppointmentsCount.toString()} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.958" /></svg>}
          />
          <StatCard 
            title="Total Patients" 
            value={doctorPatients.length.toString()} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
          />
          <StatCard 
            title="Patient Satisfaction" 
            value="98%" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* My Patients List */}
        <div className="mt-8 bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">My Patients</h2>
                <button onClick={handleDownloadPatientList} className="bg-secondary/10 text-secondary dark:hover:bg-secondary/30 text-xs font-bold py-1 px-2 rounded hover:bg-secondary/20 transition-colors">
                Download List
                </button>
            </div>
            <div className="overflow-x-auto max-h-[25rem] overflow-y-auto">
                <table className="min-w-full">
                <thead className="bg-light dark:bg-dark-bg sticky top-0">
                    <tr>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Age</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Condition</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-dark-text">
                    {doctorPatients.map(patient => (
                    <tr key={patient.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                        <td className="py-2 px-3">{patient.name}</td>
                        <td className="py-2 px-3">{patient.age}</td>
                        <td className="py-2 px-3">{patient.currentCondition}</td>
                        <td className="py-2 px-3">
                            <button 
                                onClick={() => setSelectedPatient(patient)} 
                                className="text-sm bg-primary/10 text-primary dark:bg-primary/30 dark:text-white font-semibold py-1 px-3 rounded-full hover:bg-primary/20 transition"
                            >
                                View Chart
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      </div>

      {selectedPatient && (
        <PatientDetailModal 
            doctor={user}
            patient={selectedPatient}
            appointments={appointments.filter(a => a.patientId === selectedPatient.id)}
            prescriptions={prescriptions.filter(p => p.patientId === selectedPatient.id)}
            labTests={labTests.filter(t => t.patientName === selectedPatient.name)}
            onClose={() => setSelectedPatient(null)}
            onSavePrescription={handleSavePrescription}
        />
      )}
    </>
  );
};

export default DoctorPortal;