import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useUiPreferences } from '../context/UiPreferencesContext';
import api from '../services/api';
import { HOSPITAL_NAME } from '../config/constants';
import PageHeader from '../components/PageHeader';
import PatientCareBanner from '../components/PatientCareBanner';
import { profilePicUrl } from '../utils/profilePicUrl';

const roleLabel = { admin: 'Admin', staff: 'Staff', doctor: 'Doctor', patient: 'Patient' };

const card =
  'rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-card';
const input =
  'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500';
const label = 'block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-1.5';

export default function Settings() {
  const { user, refreshUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, reducedMotion, setReducedMotion, showPatientTips, setShowPatientTips } = useUiPreferences();
  const isPatient = user?.role === 'patient';
  const [displayName, setDisplayName] = useState(user?.name || '');
  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, [user?.name]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const fileRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pic = user?.profilePic;
  const hasPassword = user?.hasPassword !== false;

  const copyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success('Email copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      toast.error('Name cannot be empty');
      return;
    }
    if (name === user?.name) {
      toast.success('No changes to save');
      return;
    }
    setNameSaving(true);
    try {
      await api.patch('/auth/profile', { name });
      toast.success('Name updated');
      await refreshUser();
      setDisplayName(name);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update name');
    } finally {
      setNameSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      toast.error('Use JPEG, PNG, GIF, or WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2MB or smaller');
      return;
    }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePic', file);
      await api.put('/auth/profile-photo', fd);
      toast.success('Profile photo updated');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setPhotoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (hasPassword && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (
      !window.confirm(
        'Delete your account permanently? This cannot be undone. You will be signed out immediately.'
      )
    ) {
      return;
    }
    if (!window.confirm('This will remove your login from the system. Continue?')) return;

    setDeleteLoading(true);
    try {
      if (hasPassword) {
        if (!deletePassword) {
          toast.error('Enter your password to confirm');
          setDeleteLoading(false);
          return;
        }
        await deleteAccount({ password: deletePassword });
      } else {
        await deleteAccount({ confirmEmail: deleteConfirmEmail.trim() });
      }
      toast.success('Your account has been deleted');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle={`Manage your ${HOSPITAL_NAME} account`} />
      {isPatient && <PatientCareBanner variant="settings" />}

      <div className="max-w-2xl space-y-8">
        <section className={card}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Update how you appear across the app. Your email is used to match your patient record.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
            <div className="flex flex-col items-center sm:items-start gap-3">
              {pic ? (
                <img
                  src={profilePicUrl(pic)}
                  alt=""
                  className="w-28 h-28 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-600 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 text-3xl font-bold flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-600">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handlePhoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200 bg-teal-50/80 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/40 disabled:opacity-60"
              >
                {photoUploading ? 'Uploading…' : 'Change photo'}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left max-w-[200px]">Max 2MB · JPEG, PNG, GIF, WebP</p>
            </div>

            <div className="flex-1 space-y-5 w-full">
              <form onSubmit={handleSaveName} className="space-y-3">
                <div>
                  <label className={label} htmlFor="settings-name">
                    Display name
                  </label>
                  <input
                    id="settings-name"
                    className={input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <button
                  type="submit"
                  disabled={nameSaving}
                  className="py-2.5 px-5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {nameSaving ? 'Saving…' : 'Save name'}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className={label}>Email</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-800 dark:text-slate-200 font-medium break-all text-sm">{user?.email}</span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Role</span>
                <span className="inline-block px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold text-xs uppercase tracking-wide">
                  {roleLabel[user?.role] || user?.role}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Sign-in: {user?.authProvider === 'google' ? 'Google (optional password in section below)' : 'Email & password'}
              </p>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Appearance & accessibility</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Theme follows this device until you choose otherwise.</p>

          <div className="space-y-6">
            <div>
              <p className={label}>Theme</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'system', label: 'System' },
                ].map(({ id, label: lbl }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      theme === id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-teal-400'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Reduce motion</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Shorten animations for a calmer interface.</p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
            </label>

            {isPatient && (
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Portal tips banners</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Show helpful hints on Home, Dashboard, and visits.</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  checked={showPatientTips}
                  onChange={(e) => setShowPatientTips(e.target.checked)}
                />
              </label>
            )}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            {hasPassword ? 'Change password' : 'Set a password'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {hasPassword
              ? 'Use a strong password you do not reuse on other sites.'
              : 'Add a password so you can sign in with email as well as Google.'}
          </p>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {hasPassword && (
              <div>
                <label className={label}>Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={input}
                  autoComplete="current-password"
                />
              </div>
            )}
            <div>
              <label className={label}>{hasPassword ? 'New password' : 'Password'} (min 6 characters)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={input}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={label}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={input}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 disabled:opacity-60 shadow-md"
            >
              {pwLoading ? 'Saving…' : hasPassword ? 'Update password' : 'Save password'}
            </button>
          </form>
        </section>

        <section className={`${card} border-rose-200/90 dark:border-rose-900/50`}>
          <h2 className="text-lg font-bold text-rose-800 dark:text-rose-300 mb-2">Delete account</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            Permanently remove your login from {HOSPITAL_NAME}. Your user record is deleted from the database and you are
            signed out. Clinical records created under your patient email may remain for the hospital; this action only
            removes your <strong>account</strong> used to sign in.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
            {hasPassword ? (
              <div>
                <label className={label} htmlFor="delete-password">
                  Password (required to confirm)
                </label>
                <input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={input}
                  autoComplete="current-password"
                  placeholder="Your current password"
                />
              </div>
            ) : (
              <div>
                <label className={label} htmlFor="delete-email-confirm">
                  Type your email to confirm
                </label>
                <input
                  id="delete-email-confirm"
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  className={input}
                  autoComplete="off"
                  placeholder={user?.email || 'you@example.com'}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={deleteLoading}
              className="py-3 px-6 rounded-xl font-semibold text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 border border-rose-700"
            >
              {deleteLoading ? 'Deleting…' : 'Delete my account permanently'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
