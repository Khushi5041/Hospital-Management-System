import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HOSPITAL_NAME, HOSPITAL_TAGLINE } from '../config/constants';
export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFile = (f) => {
    if (!f) return;
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(f.type)) {
      toast.error('Please choose a JPEG, PNG, GIF, or WebP image');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2MB or smaller');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role, profilePicFile: file || undefined });
      toast.success('Account created!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      <div className="relative lg:w-[42%] min-h-[200px] lg:min-h-screen overflow-hidden flex flex-col justify-end lg:justify-center p-8 lg:p-12 text-white">
        <div className="absolute inset-0 auth-mesh-alt" aria-hidden />
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg mb-6">
            <span className="text-3xl" aria-hidden>
              ✨
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Join {HOSPITAL_NAME}</h1>
          <p className="text-teal-100/90 mt-3 text-sm lg:text-base leading-relaxed">{HOSPITAL_TAGLINE}</p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> JWT-secured sessions after signup
            </li>
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> Optional profile photo for a personalized experience
            </li>
            <li className="flex gap-2">
              <span className="text-teal-300">✓</span> Role-based access for staff or patients
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-[480px] py-4">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-teal-600 text-white items-center justify-center text-2xl shadow-lg mb-2">
              🏥
            </div>
            <p className="text-slate-600 text-sm font-medium">{HOSPITAL_NAME}</p>
          </div>

          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-soft p-8 sm:p-9">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Create your account</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Name, email, and password are required. You can add a profile photo anytime (including later in Settings).
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="relative flex-shrink-0 w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-all overflow-hidden group mx-auto sm:mx-0"
                >
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs font-medium px-2 text-center group-hover:text-teal-700">
                      <span className="text-2xl mb-1">+</span>
                      Add photo (optional)
                    </span>
                  )}
                  <span className="absolute bottom-0 inset-x-0 py-1 bg-slate-900/70 text-white text-[10px] font-semibold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                    Change
                  </span>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-slate-800 text-sm">Profile picture (optional)</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Skip this to sign up now; you can add one later in Settings. Square photos look best. Max 2MB.
                  </p>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        if (inputRef.current) inputRef.current.value = '';
                      }}
                      className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="su-name" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Full name
                  </label>
                  <input
                    id="su-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="su-email" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Work email
                  </label>
                  <input
                    id="su-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hospital.org"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="su-pass" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    id="su-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="su-role" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                    I am registering as
                  </label>
                  <select
                    id="su-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 transition-all shadow-md"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-teal-700 font-semibold hover:text-teal-800 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
