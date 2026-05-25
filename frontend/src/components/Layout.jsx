import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOSPITAL_NAME } from '../config/constants';
import { profilePicUrl } from '../utils/profilePicUrl';

const staffNavBase = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/staff-desk', label: 'Staff desk', icon: '🧑‍🔧' },
  { to: '/patients', label: 'Patients', icon: '👥' },
  { to: '/doctors', label: 'Doctors', icon: '🩺' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/departments', label: 'Departments', icon: '🏥' },
  { to: '/medical-records', label: 'Medical Records', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const staffNavNoDesk = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/patients', label: 'Patients', icon: '👥' },
  { to: '/doctors', label: 'Doctors', icon: '🩺' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/departments', label: 'Departments', icon: '🏥' },
  { to: '/medical-records', label: 'Medical Records', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const patientNavItems = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/my-appointments', label: 'Visits & requests', icon: '📅' },
  { to: '/my-records', label: 'My Medical Records', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const roleLabel = { admin: 'Admin', staff: 'Staff', doctor: 'Doctor', patient: 'Patient' };

function Avatar({ name, src, sizeClass = 'w-11 h-11', ringClass = 'ring-white/30', light }) {
  const [err, setErr] = useState(false);
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';
  const show = src && !err;
  const shell = light
    ? 'bg-teal-50 text-teal-800 font-bold dark:bg-slate-700 dark:text-teal-100'
    : 'bg-white/20 text-white font-bold';
  return (
    <div className={`${sizeClass} rounded-full shrink-0 overflow-hidden flex items-center justify-center ring-2 ${ringClass} ${shell}`}>
      {show ? (
        <img
          src={profilePicUrl(src)}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-sm">{initial}</span>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPatient = user?.role === 'patient';
  const showStaffDesk = user?.role === 'staff' || user?.role === 'admin';
  const navItems = isPatient ? patientNavItems : showStaffDesk ? staffNavBase : staffNavNoDesk;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100/80 dark:bg-slate-950">
      <aside className="w-[280px] flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-white flex flex-col shadow-2xl shadow-slate-900/20 border-r border-white/5">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-2xl shadow-lg ring-1 ring-white/20">
              🏥
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight tracking-tight truncate">{HOSPITAL_NAME}</h1>
              <p className="text-xs text-teal-200/90 mt-0.5">
                {isPatient
                  ? 'Patient Portal'
                  : user?.role === 'doctor'
                    ? 'Doctor & clinical workspace'
                    : user?.role === 'staff'
                      ? 'Reception & staff workspace'
                      : 'Management System'}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/home'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-white no-underline transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 shadow-inner font-semibold ring-1 ring-white/10'
                    : 'font-medium text-slate-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl w-8 text-center shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} src={user?.profilePic} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-slate-300 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide bg-teal-500/30 text-teal-100">
                  {roleLabel[user?.role] || user?.role}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full py-2.5 px-4 rounded-xl font-semibold text-sm border border-white/20 bg-white/5 text-white hover:bg-white/12 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 min-h-16 px-6 py-3 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center gap-3 shadow-sm">
          <Avatar
            name={user?.name}
            src={user?.profilePic}
            sizeClass="w-10 h-10"
            ringClass="ring-slate-200 dark:ring-slate-600"
            light
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{HOSPITAL_NAME}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate">
              {isPatient
                ? 'Patient Portal'
                : user?.role === 'doctor'
                  ? 'Doctor workspace · Clinical operations'
                  : user?.role === 'staff'
                    ? 'Reception · Staff desk & operations'
                    : 'Clinical operations'}
            </p>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
