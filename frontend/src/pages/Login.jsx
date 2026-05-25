import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HOSPITAL_NAME, HOSPITAL_TAGLINE } from '../config/constants';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google sign-in did not return a credential');
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Signed in with Google');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">
      <div className="relative lg:w-[46%] min-h-[220px] lg:min-h-screen overflow-hidden flex flex-col justify-end lg:justify-center p-8 lg:p-14 text-white">
        <div className="absolute inset-0 auth-mesh" aria-hidden />
        <div className="absolute inset-0 opacity-[0.12] bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" aria-hidden />
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg mb-8">
            <span className="text-3xl" aria-hidden>
              🏥
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{HOSPITAL_NAME}</h1>
          <p className="text-teal-100/95 text-lg mt-4 leading-relaxed max-w-md">{HOSPITAL_TAGLINE}</p>
          <p className="text-white/70 text-sm mt-8 leading-relaxed max-w-sm border-l-2 border-teal-300/50 pl-4">
            Secure access with JWT sessions and optional Google sign-in. Your data stays encrypted in transit.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex w-12 h-12 rounded-xl bg-teal-600 text-white items-center justify-center text-2xl shadow-lg mb-3">
              🏥
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{HOSPITAL_NAME}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{HOSPITAL_TAGLINE}</p>
          </div>

          <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-soft p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                Sign in to continue to your dashboard or patient portal.
              </p>
            </div>

            {googleClientId ? (
              <div className="mb-8">
                <div className="flex justify-center [&>div]:w-full [&_iframe]:!w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google sign-in was interrupted')}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="pill"
                    width={400}
                  />
                </div>
                {googleLoading && (
                  <p className="text-center text-xs text-slate-500 mt-3">Completing Google sign-in…</p>
                )}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
                    <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Or with email</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-amber-900 text-sm">
                Add <code className="text-xs bg-amber-100/80 px-1.5 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> to enable
                Google sign-in (same Web client ID as on the server).
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 transition-all shadow-md shadow-teal-900/10"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-teal-700 dark:text-teal-400 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
