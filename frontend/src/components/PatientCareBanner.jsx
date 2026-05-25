import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUiPreferences } from '../context/UiPreferencesContext';

const variants = {
  home: {
    title: 'Your patient portal',
    body: 'Request visits, track requests waiting for a doctor, and see confirmed appointments—all in one place.',
  },
  dashboard: {
    title: 'Stay on top of your care',
    body: 'Open My Appointments to submit a new request or check status. Staff will assign a doctor and time based on availability.',
  },
  appointments: {
    title: 'How booking works',
    body: 'Submit a request with your symptoms and preferred doctor or date. When the clinic confirms, your visit moves to scheduled with a time slot.',
  },
  records: {
    title: 'Your medical history',
    body: 'Records appear here after your visits. Need a follow-up? Request an appointment anytime.',
  },
  settings: {
    title: 'Account & security',
    body: 'Keep your sign-in method up to date. For visit changes, use My Appointments.',
  },
};

export default function PatientCareBanner({ variant = 'home' }) {
  const { user } = useAuth();
  const { showPatientTips } = useUiPreferences();
  if (user?.role !== 'patient') return null;
  if (!showPatientTips) return null;
  const v = variants[variant] || variants.home;

  return (
    <div className="mb-8 rounded-2xl border border-teal-200/80 dark:border-teal-800/80 bg-gradient-to-r from-teal-50 via-white to-cyan-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/50 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1">For you</p>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{v.title}</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-relaxed max-w-2xl">{v.body}</p>
        </div>
        <Link
          to="/my-appointments"
          className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 dark:hover:bg-teal-500 shadow-md no-underline"
        >
          My appointments
        </Link>
      </div>
    </div>
  );
}
