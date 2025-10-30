import React, { useState } from 'react';
import type { User, Appointment, Prescription, LabTest } from '../../types';
import Appointments from './Appointments';
import MedicalRecords from './MedicalRecords';
import BillingHistory from './BillingHistory';
import WellnessTracker from './WellnessTracker';
import SymptomChecker from './SymptomChecker';
import Prescriptions from './Prescriptions';
import { MOCK_BILLS, MOCK_RECORDS, MOCK_WELLNESS_DATA, MOCK_DOCTORS } from '../../constants';

interface PatientPortalProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  prescriptions: Prescription[];
  labTests: LabTest[];
}

type PatientTab = 'Dashboard' | 'Appointments' | 'Medical Records' | 'Prescriptions' | 'Billing' | 'Wellness' | 'Symptom Checker';

const PatientDashboardSummary: React.FC<{ user: User, setActiveTab: (tab: PatientTab) => void, appointments: Appointment[], prescriptions: Prescription[] }> = ({ user, setActiveTab, appointments, prescriptions }) => {
    const nextAppointment = appointments
        .filter(app => app.patientId === user.id && app.status === 'Upcoming')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const recentRecord = MOCK_RECORDS
        .filter(rec => rec.patientId === user.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const outstandingBill = MOCK_BILLS
        .filter(bill => bill.patientId === user.id && bill.status === 'Due')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
    const wellnessEntryCount = MOCK_WELLNESS_DATA.filter(w => w.patientId === user.id).length;

    const latestPrescription = prescriptions
        .filter(p => p.status === 'Active')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Your Health Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">Upcoming Appointment</h3>
                     {nextAppointment ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{nextAppointment.doctorSpecialization} with {nextAppointment.doctorName}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                {new Date(nextAppointment.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {nextAppointment.time}
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">You have no upcoming appointments.</p>
                    )}
                    <button onClick={() => setActiveTab('Appointments')} className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline">View All Appointments</button>
                </div>
                 <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-teal-800 dark:text-teal-300">Latest Prescription</h3>
                     {latestPrescription ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{latestPrescription.medication}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                Prescribed by {latestPrescription.doctorName}
                            </p>
                        </>
                     ) : (
                         <p className="text-gray-600 dark:text-gray-400 mt-2">No active prescriptions.</p>
                     )}
                    <button onClick={() => setActiveTab('Prescriptions')} className="mt-4 text-teal-600 dark:text-teal-400 font-semibold hover:underline">View All Prescriptions</button>
                </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Outstanding Bill</h3>
                     {outstandingBill ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{outstandingBill.service}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">${outstandingBill.amount.toFixed(2)} Due</p>
                        </>
                     ) : (
                        <p className="text-gray-600 dark:text-gray-400 mt-2">No outstanding bills.</p>
                     )}
                    <button onClick={() => setActiveTab('Billing')} className="mt-4 text-yellow-600 dark:text-yellow-400 font-semibold hover:underline">View Billing Details</button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Recent Medical Record</h3>
                     {recentRecord ? (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">{recentRecord.title}</p>
                            <p className="font-bold text-lg mt-1 dark:text-white">
                                {new Date(recentRecord.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </>
                     ) : (
                         <p className="text-gray-600 dark:text-gray-400 mt-2">No records found.</p>
                     )}
                    <button onClick={() => setActiveTab('Medical Records')} className="mt-4 text-green-600 dark:text-green-400 font-semibold hover:underline">View All Records</button>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300">Wellness Tracker</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Log your vitals and track your progress.</p>
                     <p className="font-bold text-lg mt-1 dark:text-white">{wellnessEntryCount} entries logged</p>
                    <button onClick={() => setActiveTab('Wellness')} className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Open Tracker</button>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold text-rose-800 dark:text-rose-300">Symptom Checker</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Get AI-powered insights on your symptoms.</p>
                     <p className="font-bold text-lg mt-1 dark:text-white">Powered by Gemini</p>
                    <button onClick={() => setActiveTab('Symptom Checker')} className="mt-4 text-rose-600 dark:text-rose-400 font-semibold hover:underline">Check Symptoms</button>
                </div>
            </div>
        </div>
    );
}

const PatientPortal: React.FC<PatientPortalProps> = ({ user, appointments, setAppointments, prescriptions, labTests }) => {
  const [activeTab, setActiveTab] = useState<PatientTab>('Dashboard');
  const patientPrescriptions = prescriptions.filter(p => p.patientId === user.id);

  const renderContent = () => {
    switch (activeTab) {
      case 'Appointments':
        return <Appointments user={user} appointments={appointments} setAppointments={setAppointments} />;
      case 'Medical Records':
        return <MedicalRecords patientId={user.id} user={user} labTests={labTests} />;
      case 'Prescriptions':
        return <Prescriptions user={user} prescriptions={patientPrescriptions} doctors={MOCK_DOCTORS} />;
      case 'Billing':
        return <BillingHistory patientId={user.id} user={user} />;
      case 'Wellness':
        return <WellnessTracker patientId={user.id} />;
      case 'Symptom Checker':
        return <SymptomChecker />;
      case 'Dashboard':
      default:
        return <PatientDashboardSummary user={user} setActiveTab={setActiveTab} appointments={appointments} prescriptions={patientPrescriptions}/>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patient Portal</h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user.name}!</p>

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-1/4">
          <nav className="space-y-2">
            {(['Dashboard', 'Appointments', 'Medical Records', 'Prescriptions', 'Billing', 'Wellness', 'Symptom Checker'] as PatientTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 dark:text-dark-text hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="md:w-3/4">
          <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[400px]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientPortal;
