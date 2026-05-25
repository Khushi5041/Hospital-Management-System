import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Departments from './pages/Departments';
import MedicalRecords from './pages/MedicalRecords';
import MyAppointments from './pages/MyAppointments';
import MyRecords from './pages/MyRecords';
import Settings from './pages/Settings';
import StaffDesk from './pages/StaffDesk';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-12 h-12 rounded-2xl border-2 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 animate-spin" aria-hidden />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your workspace…</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-12 h-12 rounded-2xl border-2 border-teal-200 dark:border-teal-800 border-t-teal-600 dark:border-t-teal-400 animate-spin" aria-hidden />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your workspace…</p>
      </div>
    );
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function StaffOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'patient') return <Navigate to="/home" replace />;
  return children;
}

function PatientOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'patient') return <Navigate to="/home" replace />;
  return children;
}

function StaffDeskRoute({ children }) {
  const { user } = useAuth();
  if (!user || !['staff', 'admin'].includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Homepage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<StaffOnlyRoute><Patients /></StaffOnlyRoute>} />
        <Route path="doctors" element={<StaffOnlyRoute><Doctors /></StaffOnlyRoute>} />
        <Route path="appointments" element={<StaffOnlyRoute><Appointments /></StaffOnlyRoute>} />
        <Route path="departments" element={<StaffOnlyRoute><Departments /></StaffOnlyRoute>} />
        <Route path="medical-records" element={<StaffOnlyRoute><MedicalRecords /></StaffOnlyRoute>} />
        <Route path="staff-desk" element={<StaffDeskRoute><StaffDesk /></StaffDeskRoute>} />
        <Route path="my-appointments" element={<PatientOnlyRoute><MyAppointments /></PatientOnlyRoute>} />
        <Route path="my-records" element={<PatientOnlyRoute><MyRecords /></PatientOnlyRoute>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
