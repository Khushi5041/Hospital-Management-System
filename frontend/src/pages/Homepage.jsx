import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOSPITAL_NAME, HOSPITAL_TAGLINE } from '../config/constants';
import { profilePicUrl } from '../utils/profilePicUrl';
import PatientCareBanner from '../components/PatientCareBanner';

const roleLabel = { admin: 'Admin', staff: 'Staff', doctor: 'Doctor', patient: 'Patient' };

export default function Homepage() {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const pic = user?.profilePic;

  const staffQuickLinks = [
    { to: '/dashboard', label: 'Dashboard', desc: 'Overview & stats', icon: '📊', primary: true },
    { to: '/patients', label: 'Patients', desc: 'Manage patient records', icon: '👥' },
    { to: '/doctors', label: 'Doctors', desc: 'Manage doctors', icon: '🩺' },
    { to: '/appointments', label: 'Appointments', desc: 'Schedule & view', icon: '📅' },
    { to: '/departments', label: 'Departments', desc: 'Hospital departments', icon: '🏥' },
    { to: '/medical-records', label: 'Medical Records', desc: 'Diagnosis & prescriptions', icon: '📋' },
    { to: '/settings', label: 'Settings', desc: 'Profile & security', icon: '⚙️' },
  ];

  const patientQuickLinks = [
    { to: '/dashboard', label: 'My Dashboard', desc: 'Your overview', icon: '📊', primary: true },
    {
      to: '/my-appointments',
      label: 'Visits & requests',
      desc: 'Request a visit and track confirmation',
      icon: '📅',
    },
    { to: '/my-records', label: 'My Medical Records', desc: 'Diagnosis & prescriptions', icon: '📋' },
    { to: '/settings', label: 'Settings', desc: 'Profile & security', icon: '⚙️' },
  ];

  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'staff';
  const links = isPatient
    ? patientQuickLinks
    : isDoctor
      ? [
          staffQuickLinks[0],
          {
            to: '/appointments?status=pending',
            label: 'Pending requests',
            desc: 'Patient-submitted visits to confirm',
            icon: '📝',
          },
          ...staffQuickLinks.slice(1),
        ]
      : isStaff
        ? [
            staffQuickLinks[0],
            {
              to: '/staff-desk',
              label: 'Staff desk',
              desc: 'Queue, beds, billing, emergency & notifications',
              icon: '🧑‍🔧',
              primary: false,
            },
            ...staffQuickLinks.slice(1),
          ]
        : staffQuickLinks;

  return (
    <div className="max-w-5xl mx-auto">
      {isPatient && <PatientCareBanner variant="home" />}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-teal-50/40 to-slate-50 shadow-soft mb-12">
        <div className="absolute top-0 right-0 w-[min(420px,55%)] h-full bg-gradient-to-l from-teal-100/50 to-transparent pointer-events-none" aria-hidden />
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
          <div className="shrink-0 flex justify-center md:justify-start">
            {pic ? (
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-teal-400 to-teal-700 opacity-60 blur-sm" aria-hidden />
                <img
                  src={profilePicUrl(pic)}
                  alt=""
                  className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              </div>
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-teal-600 text-white text-4xl font-bold flex items-center justify-center ring-4 ring-white shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-[0.2em] mb-2">{HOSPITAL_NAME}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto md:mx-0 leading-relaxed">{HOSPITAL_TAGLINE}</p>
            <span className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-sm font-semibold bg-white/90 dark:bg-slate-800/90 border border-teal-200/80 dark:border-slate-600 text-teal-900 dark:text-teal-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" aria-hidden />
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick access</h2>
            <p className="text-slate-500 text-sm mt-0.5">Jump to the tools you use most</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map(({ to, label, desc, icon, primary }) => (
            <Link
              key={to}
              to={to}
              className={`group block no-underline rounded-2xl border p-5 text-left transition-all duration-200 ${
                primary
                  ? 'bg-gradient-to-br from-teal-600 to-teal-800 border-teal-700 text-white shadow-lg shadow-teal-900/15 hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-white border-slate-200/90 text-slate-800 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <span className="text-3xl block mb-3 group-hover:scale-105 transition-transform inline-block">
                {icon}
              </span>
              <h3 className={`font-bold ${primary ? 'text-white' : 'text-slate-900'}`}>{label}</h3>
              <p className={`text-sm mt-1 leading-snug ${primary ? 'text-teal-100' : 'text-slate-500'}`}>{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-card">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Getting started</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
          {isPatient
            ? 'Submit an appointment request anytime; our team assigns a doctor and slot based on availability. Track pending vs scheduled visits under Visits & requests. Your records appear after visits under My Medical Records.'
            : isDoctor
              ? 'Use Pending requests to schedule patient-submitted visits. Under Departments, pick a department type from the dropdown and assign a head once active doctors exist in the directory. Dashboard shows live counts; the sidebar links to every clinical module.'
              : isStaff
                ? 'Use Staff desk for today’s queue, bed status, billing receipts, emergency triage logs, and doctor notifications. Register walk-ins under Patients (patient ID is generated automatically). Book appointments from the Appointments page.'
                : 'Your workspace is organized by module—patients, doctors, appointments, and records. Use the sidebar for full navigation. JWT tokens keep your session secure; configure Google sign-in for faster access if your administrator enables it.'}
        </p>
      </section>
    </div>
  );
}
