
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { User, Page, Role, Medicine, Appointment, Invoice, Prescription, LabTest } from './types';
import { MOCK_USERS, MOCK_MEDICINES, MOCK_APPOINTMENTS, MOCK_INVOICES, MOCK_PRESCRIPTIONS, MOCK_LAB_TESTS } from './constants';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/PatientPortal/ServicesPage';
import ContactPage from './pages/ContactPage';
import PatientPortal from './pages/PatientPortal/PatientPortal';
import DoctorPortal from './pages/DoctorPortal/DoctorPortal';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import LoginModal from './components/LoginModal';
import HealthAssistant from './components/HealthAssistant';
import NursePortal from './pages/NursePortal/NursePortal';
import PharmacyPortal from './pages/PharmacyPortal/PharmacyPortal';
import LabPortal from './pages/LabPortal/LabPortal';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('hms_users');
      return savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      return MOCK_USERS;
    }
  });
  
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const savedMedicines = localStorage.getItem('hms_medicines');
      return savedMedicines ? JSON.parse(savedMedicines) : MOCK_MEDICINES;
    } catch (error) {
      console.error("Failed to load medicines from localStorage", error);
      return MOCK_MEDICINES;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const savedAppointments = localStorage.getItem('hms_appointments');
      return savedAppointments ? JSON.parse(savedAppointments) : MOCK_APPOINTMENTS;
    } catch (error) {
      console.error("Failed to load appointments from localStorage", error);
      return MOCK_APPOINTMENTS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const savedInvoices = localStorage.getItem('hms_invoices');
      return savedInvoices ? JSON.parse(savedInvoices) : MOCK_INVOICES;
    } catch (error) {
      console.error("Failed to load invoices from localStorage", error);
      return MOCK_INVOICES;
    }
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    try {
      const savedPrescriptions = localStorage.getItem('hms_prescriptions');
      return savedPrescriptions ? JSON.parse(savedPrescriptions) : MOCK_PRESCRIPTIONS;
    } catch (error) {
      console.error("Failed to load prescriptions from localStorage", error);
      return MOCK_PRESCRIPTIONS;
    }
  });

  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    try {
      const savedLabTests = localStorage.getItem('hms_lab_tests');
      return savedLabTests ? JSON.parse(savedLabTests) : MOCK_LAB_TESTS;
    } catch (error) {
      console.error("Failed to load lab tests from localStorage", error);
      return MOCK_LAB_TESTS;
    }
  });


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);
  
  useEffect(() => {
    try {
      localStorage.setItem('hms_users', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  }, [users]);

  useEffect(() => {
    try {
        localStorage.setItem('hms_medicines', JSON.stringify(medicines));
    } catch (error) {
        console.error("Failed to save medicines to localStorage", error);
    }
  }, [medicines]);

  useEffect(() => {
    try {
        localStorage.setItem('hms_appointments', JSON.stringify(appointments));
    } catch (error) {
        console.error("Failed to save appointments to localStorage", error);
    }
  }, [appointments]);

  useEffect(() => {
    try {
        localStorage.setItem('hms_invoices', JSON.stringify(invoices));
    } catch (error) {
        console.error("Failed to save invoices to localStorage", error);
    }
  }, [invoices]);

  useEffect(() => {
    try {
        localStorage.setItem('hms_prescriptions', JSON.stringify(prescriptions));
    } catch (error) {
        console.error("Failed to save prescriptions to localStorage", error);
    }
  }, [prescriptions]);

  useEffect(() => {
    try {
        localStorage.setItem('hms_lab_tests', JSON.stringify(labTests));
    } catch (error) {
        console.error("Failed to save lab tests to localStorage", error);
    }
  }, [labTests]);


  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (email: string, password: string, role: Role) => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role
    );
    if (user) {
      setCurrentUser(user);
      // Redirect to role-specific page after login
      switch (user.role) {
        case 'PATIENT':
          setCurrentPage('Patient Portal');
          break;
        case 'DOCTOR':
          setCurrentPage('Doctor Portal');
          break;
        case 'NURSE':
          setCurrentPage('Nurse Portal');
          break;
        case 'PHARMACY':
          setCurrentPage('Pharmacy Portal');
          break;
        case 'LAB_TECHNICIAN':
          setCurrentPage('Lab Portal');
          break;
        case 'ADMIN':
          setCurrentPage('Admin Dashboard');
          break;
      }
      setLoginModalOpen(false);
      setLoginError('');
    } else {
      setLoginError('Invalid email, password, or role. Please try again.');
    }
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentPage('Home');
  }, []);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const renderPage = useMemo(() => {
    switch (currentPage) {
      case 'Home':
        return <HomePage navigate={navigate} />;
      case 'About Us':
        return <AboutPage />;
      case 'Services':
        return <ServicesPage navigate={navigate} />;
      case 'Contact':
        return <ContactPage />;
      case 'Patient Portal':
        return currentUser?.role === 'PATIENT' ? <PatientPortal user={currentUser} appointments={appointments} setAppointments={setAppointments} prescriptions={prescriptions} labTests={labTests} /> : <HomePage navigate={navigate} />;
      case 'Doctor Portal':
        return currentUser?.role === 'DOCTOR' ? <DoctorPortal user={currentUser} appointments={appointments} prescriptions={prescriptions} setPrescriptions={setPrescriptions} labTests={labTests} /> : <HomePage navigate={navigate} />;
      case 'Admin Dashboard':
        return currentUser?.role === 'ADMIN' ? <AdminDashboard user={currentUser} allUsers={users} setUsers={setUsers} medicines={medicines} setMedicines={setMedicines} invoices={invoices} setInvoices={setInvoices} /> : <HomePage navigate={navigate} />;
      case 'Nurse Portal':
        return currentUser?.role === 'NURSE' ? <NursePortal user={currentUser} /> : <HomePage navigate={navigate} />;
      case 'Pharmacy Portal':
        return currentUser?.role === 'PHARMACY' ? <PharmacyPortal user={currentUser} medicines={medicines} setMedicines={setMedicines} prescriptions={prescriptions} setPrescriptions={setPrescriptions} /> : <HomePage navigate={navigate} />;
      case 'Lab Portal':
        return currentUser?.role === 'LAB_TECHNICIAN' ? <LabPortal user={currentUser} labTests={labTests} setLabTests={setLabTests} /> : <HomePage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  }, [currentPage, currentUser, navigate, users, medicines, appointments, invoices, prescriptions, labTests]);

  return (
    <div className="bg-light dark:bg-dark-bg min-h-screen flex flex-col font-sans">
      <Navbar 
        user={currentUser} 
        onNavigate={navigate} 
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="flex-grow">
        {renderPage}
      </main>
      <Footer onNavigate={navigate} user={currentUser} onLoginClick={() => setLoginModalOpen(true)} />
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => {
            setLoginModalOpen(false);
            setLoginError('');
          }} 
          onLogin={handleLogin}
          loginError={loginError}
          allUsers={users}
          setUsers={setUsers}
          setCurrentUser={setCurrentUser}
          setCurrentPage={setCurrentPage}
        />
      )}
      {currentUser && currentUser.role === 'PATIENT' && <HealthAssistant />}
    </div>
  );
};

export default App;
