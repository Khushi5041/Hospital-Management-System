import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HOSPITAL_NAME } from '../config/constants';
import PageHeader from '../components/PageHeader';
import PatientCareBanner from '../components/PatientCareBanner';

function StaffDashboard() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'staff';
  const [deskStats, setDeskStats] = useState(null);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingRequests: 0,
    departments: 0,
    records: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, d, a, pend, dep, r] = await Promise.all([
          api.get('/patients').then((res) => res.data.length),
          api.get('/doctors').then((res) => res.data.length),
          api.get('/appointments').then((res) => res.data.length),
          api.get('/appointments', { params: { status: 'pending' } }).then((res) => res.data.length),
          api.get('/departments').then((res) => res.data.length),
          api.get('/medical-records').then((res) => res.data.length),
        ]);
        setStats({ patients: p, doctors: d, appointments: a, pendingRequests: pend, departments: dep, records: r });
      } catch (_) {
        setStats({
          patients: 0,
          doctors: 0,
          appointments: 0,
          pendingRequests: 0,
          departments: 0,
          records: 0,
        });
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    api
      .get('/staff-desk/stats')
      .then(({ data }) => setDeskStats(data))
      .catch(() => setDeskStats(null));
  }, [isStaff]);

  const cards = [
    { label: 'Patients', value: stats.patients, to: '/patients', icon: '👥', accent: 'teal' },
    { label: 'Doctors', value: stats.doctors, to: '/doctors', icon: '🩺', accent: 'cyan' },
    { label: 'Patient requests', value: stats.pendingRequests, to: '/appointments?status=pending', icon: '📝', accent: 'amber' },
    { label: 'Appointments', value: stats.appointments, to: '/appointments', icon: '📅', accent: 'sky' },
    { label: 'Departments', value: stats.departments, to: '/departments', icon: '🏥', accent: 'teal' },
    { label: 'Medical Records', value: stats.records, to: '/medical-records', icon: '📋', accent: 'slate' },
  ];

  const accentClass = {
    teal: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    cyan: 'border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300',
    sky: 'border-l-sky-500 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-800 dark:text-sky-300',
    slate: 'border-l-slate-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    amber: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200',
  };

  const valueClass = {
    teal: 'text-teal-600 dark:text-teal-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    sky: 'text-sky-600 dark:text-sky-400',
    slate: 'text-slate-700 dark:text-slate-300',
    amber: 'text-amber-700 dark:text-amber-400',
  };

  return (
    <>
      <PageHeader
        title={isDoctor ? 'Doctor workspace' : isStaff ? 'Staff dashboard' : 'Dashboard'}
        subtitle={
          isDoctor
            ? `Schedule, departments, and records for ${HOSPITAL_NAME}`
            : isStaff
              ? `Today’s front-desk workload and quick access at ${HOSPITAL_NAME}`
              : `Overview of ${HOSPITAL_NAME} management`
        }
      />
      {isStaff && deskStats && (
        <div className="mb-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-900 p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">Today · Reception metrics</h3>
              <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-700 dark:text-slate-300">
                <span>
                  <strong className="text-slate-900 dark:text-white text-lg">{deskStats.patientsRegisteredToday}</strong> walk-ins / registrations
                </span>
                <span>
                  <strong className="text-slate-900 dark:text-white text-lg">{deskStats.appointmentsToday}</strong> appointments
                </span>
                <span>
                  <strong className="text-slate-900 dark:text-white text-lg">{deskStats.queueWaiting}</strong> waiting in queue
                </span>
                <span>
                  <strong className="text-slate-900 dark:text-white text-lg">{deskStats.visitsHandledToday}</strong> visits handled
                </span>
                {deskStats.avgWaitMinutesToday != null && (
                  <span>
                    Avg wait ~<strong className="text-slate-900 dark:text-white">{deskStats.avgWaitMinutesToday} min</strong>
                  </span>
                )}
              </div>
            </div>
            <Link
              to="/staff-desk"
              className="shrink-0 py-2.5 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 no-underline"
            >
              Open staff desk →
            </Link>
          </div>
        </div>
      )}
      {isDoctor && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50/80 dark:from-slate-900 dark:to-slate-900/90 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">Clinical shortcuts</h3>
            <ul className="mt-3 space-y-2 text-sm text-teal-900 dark:text-slate-200">
              <li>
                <Link className="font-semibold text-teal-800 dark:text-teal-300 hover:underline" to="/appointments?status=pending">
                  Pending patient requests
                </Link>
                <span className="text-teal-700/80 dark:text-slate-400"> — confirm slots and assign doctors</span>
              </li>
              <li>
                <Link className="font-semibold text-teal-800 dark:text-teal-300 hover:underline" to="/appointments">
                  All appointments
                </Link>
                <span className="text-teal-700/80 dark:text-slate-400"> — full calendar and edits</span>
              </li>
              <li>
                <Link className="font-semibold text-teal-800 dark:text-teal-300 hover:underline" to="/patients">
                  Patients
                </Link>
                <span className="text-teal-700/80 dark:text-slate-400"> — search charts and contact details</span>
              </li>
              <li>
                <Link className="font-semibold text-teal-800 dark:text-teal-300 hover:underline" to="/medical-records">
                  Medical records
                </Link>
                <span className="text-teal-700/80 dark:text-slate-400"> — visit notes and prescriptions</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Hospital structure</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Under <strong>Departments</strong>, use the <strong>department type</strong> dropdown when adding or editing a unit (e.g. Cardiology, Emergency).
              Heads of department are chosen from <strong>active</strong> doctors — add staff on the Doctors page first if the head list is empty.
            </p>
            <Link
              to="/departments"
              className="inline-flex mt-4 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 hover:underline"
            >
              Open Departments →
            </Link>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {cards.map(({ label, value, to, icon, accent }) => (
          <Link key={to} to={to} className="no-underline group">
            <div className={`rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-600 border-l-4 p-6 card-hover ${accentClass[accent]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${valueClass[accent]}`}>{value}</p>
                </div>
                <span className="text-4xl opacity-90 group-hover:scale-110 transition-transform">{icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [recordsCount, setRecordsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const { data: patients } = await api.get('/patients', { params: { search: user.email } });
        const me = Array.isArray(patients) ? patients.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase()) : null;
        setPatient(me || null);
        if (me?._id) {
          const [aptRes, recRes] = await Promise.all([
            api.get('/appointments', { params: { patient: me._id } }),
            api.get('/medical-records', { params: { patient: me._id } }),
          ]);
          const list = aptRes.data || [];
          setAppointments(list);
          setPendingCount(list.filter((x) => x.status === 'pending').length);
          setRecordsCount((recRes.data || []).length);
        } else {
          setAppointments([]);
          setPendingCount(0);
          setRecordsCount(0);
        }
      } catch (_) {
        setPatient(null);
        setAppointments([]);
        setPendingCount(0);
        setRecordsCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.email]);

  const nextAppointment = appointments
    .filter((a) => a.status === 'scheduled' && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome, ${user?.name}`} subtitle={HOSPITAL_NAME} />
        <p className="py-12 text-center text-slate-500">Loading your dashboard...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`Your care at ${HOSPITAL_NAME}`}
      />
      <PatientCareBanner variant="dashboard" />
      {!patient && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-amber-800 font-semibold">No patient profile linked</p>
          <p className="text-amber-700 text-sm mt-1">Your account email is not linked to a patient record. Contact the hospital to register as a patient.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link to="/my-appointments" className="no-underline group">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 card-hover hover:border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Requests & visits</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{appointments.length}</p>
                {pendingCount > 0 && (
                  <p className="text-xs font-semibold text-amber-700 mt-2">{pendingCount} awaiting schedule</p>
                )}
              </div>
              <span className="text-4xl group-hover:scale-110 transition-transform">📅</span>
            </div>
          </div>
        </Link>
        <Link to="/my-records" className="no-underline group">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 card-hover hover:border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">My Medical Records</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{recordsCount}</p>
              </div>
              <span className="text-4xl group-hover:scale-110 transition-transform">📋</span>
            </div>
          </div>
        </Link>
      </div>
      {nextAppointment && (
        <div className="mt-8 bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
          <h2 className="font-semibold text-slate-800 mb-3">Next appointment</h2>
          <p className="text-slate-600">
            <span className="font-medium text-slate-800">{new Date(nextAppointment.date).toLocaleDateString()}</span> at {nextAppointment.timeSlot} with Dr. {nextAppointment.doctor?.name} ({nextAppointment.doctor?.specialization})
          </p>
          <Link to="/my-appointments" className="inline-block mt-3 text-teal-600 font-semibold text-sm hover:text-teal-700 hover:underline">View all appointments →</Link>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'patient' ? <PatientDashboard /> : <StaffDashboard />;
}
