
export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'NURSE' | 'PHARMACY' | 'LAB_TECHNICIAN';

export type Page = 'Home' | 'About Us' | 'Services' | 'Contact' | 'Patient Portal' | 'Doctor Portal' | 'Admin Dashboard' | 'Nurse Portal' | 'Pharmacy Portal' | 'Lab Portal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  password: string;
  department?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  currentCondition: string;
}

export interface Doctor {
  id:string;
  name: string;
  specialization: string;
  experience: number;
  bio: string;
  imageUrl: string;
  availability: string;
}

export type DoctorAvailability = Record<string, string[]>;

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  type: 'New Consultation' | 'Follow-up' | 'Check-up';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'Lab Result' | 'Prescription' | 'Doctor\'s Note' | 'Radiology Report';
  title: string;
  summary: string;
  doctorName: string;
  fileUrl: string; // In a real app, this would be a secure link
}

export interface Bill {
  id: string;
  patientId: string;
  date: string;
  service: string;
  amount: number;
  status: 'Paid' | 'Due';
}

// New Types for Admin Billing System
export interface BillingRecord {
  id: string;
  description: string;
  amount: number;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: BillingRecord[];
  totalAmount: number;
  status: InvoiceStatus;
}


export interface Service {
  name: string;
  description: string;
  icon: string;
  detailedDescription: string;
}

export interface WellnessEntry {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: number; // mg/dL
  weight?: number; // in kg
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  medication: string;
  dosage: string; // e.g., '500mg'
  frequency: string; // e.g., 'Twice a day'
  duration: string; // e.g., '10 days'
  notes?: string;
  status: 'Active' | 'Ready for Pickup' | 'Dispensed' | 'Completed' | 'Cancelled';
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiry: string; // YYYY-MM-DD
}

export interface MedicationStock {
  id: string;
  name: string;
  stockLevel: number;
  reorderPoint: number;
}

export interface AssignedPatient {
  id: string;
  name: string;
  room: string;
  status: string;
  vitals: { bp: string; temp: string; hr: string };
}

export interface VitalSignEntry {
  date: string; // e.g., '2024-08-10 08:00'
  temp: number; // in °F
  bp: { systolic: number; diastolic: number; };
  hr: number; // heart rate
}

export interface PatientChart {
  patientId: string;
  notes: Array<{ date: string; note: string; author: string; }>;
  medicationSchedule: Array<{ time: string; medication: string; dosage: string; }>;
  vitalsHistory: VitalSignEntry[];
}

export interface LabTest {
  id: string;
  patientName: string;
  testType: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  requestedBy: string; // Doctor's name
  date: string;
  results?: string;
}
