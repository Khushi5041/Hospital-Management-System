import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HOSPITAL_NAME } from '../config/constants';
import PageHeader from '../components/PageHeader';
import PatientCareBanner from '../components/PatientCareBanner';

export default function MyAppointments() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    department: '',
    preferredDoctor: '',
    preferredDate: '',
    patientNotes: '',
    type: 'consultation',
  });

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [{ data: patients }, depsRes, docRes] = await Promise.all([
        api.get('/patients'),
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/doctors').catch(() => ({ data: [] })),
      ]);
      const me = Array.isArray(patients) ? patients.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase()) : null;
      setPatient(me || null);
      setDepartments(Array.isArray(depsRes.data) ? depsRes.data : []);
      setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
      if (me?._id) {
        const { data } = await api.get('/appointments', { params: { patient: me._id } });
        setAppointments(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
      } else {
        setAppointments([]);
      }
    } catch (_) {
      setPatient(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const statusClass = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-900',
      scheduled: 'bg-cyan-100 text-cyan-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-slate-200 text-slate-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!patient) return;
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        department: form.department || undefined,
        preferredDoctor: form.preferredDoctor || undefined,
        preferredDate: form.preferredDate || undefined,
        patientNotes: form.patientNotes?.trim() || undefined,
        type: form.type,
      });
      setForm({
        department: '',
        preferredDoctor: '',
        preferredDate: '',
        patientNotes: '',
        type: 'consultation',
      });
      await load();
      toast.success('Request submitted. The clinic will assign a time.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment request or visit?')) return;
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' });
      await load();
      toast.success('Appointment cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="My Appointments" subtitle={HOSPITAL_NAME} />
        <PatientCareBanner variant="appointments" />
        <p className="py-12 text-center text-slate-500">Loading…</p>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <PageHeader title="My Appointments" subtitle={HOSPITAL_NAME} />
        <PatientCareBanner variant="appointments" />
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-semibold">No patient profile linked</p>
          <p className="text-amber-700 text-sm mt-1">
            Your account is not linked to a patient record. Contact {HOSPITAL_NAME} so we can match your email to your chart.
          </p>
        </div>
      </>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  return (
    <>
      <PageHeader
        title="My Appointments"
        subtitle={`Request visits and track confirmations at ${HOSPITAL_NAME}`}
      />
      <PatientCareBanner variant="appointments" />

      {pendingCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have <strong>{pendingCount}</strong> request{pendingCount !== 1 ? 's' : ''} waiting for the clinic to assign a doctor and time.
        </div>
      )}

      <section className="mb-10 rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-card">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Request a new appointment</h2>
        <p className="text-slate-600 text-sm mb-6 max-w-2xl">
          Tell us what you need. A doctor or coordinator will confirm your slot based on availability. You&apos;ll see status change from{' '}
          <span className="font-semibold text-amber-800">pending</span> to <span className="font-semibold text-cyan-800">scheduled</span> when it&apos;s booked.
        </p>
        <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Reason / symptoms (optional)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 min-h-[88px]"
              placeholder="e.g. Follow-up blood pressure, mild fever for 2 days…"
              value={form.patientNotes}
              onChange={(e) => setForm({ ...form, patientNotes: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred doctor (optional)</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={form.preferredDoctor}
              onChange={(e) => setForm({ ...form, preferredDoctor: e.target.value })}
            >
              <option value="">No preference — clinic will assign</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} — {d.specialization}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred date (optional)</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Department (optional)</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Any</option>
              {departments.map((dep) => (
                <option key={dep._id} value={dep._id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Visit type</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="consultation">Consultation</option>
              <option value="followup">Follow-up</option>
              <option value="emergency">Urgent / same-day concern</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 shadow-md"
            >
              {submitting ? 'Submitting…' : 'Submit appointment request'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Your visits</h2>
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No appointments yet. Use the form above to request your first visit.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">When</th>
                    <th className="text-left px-4 py-3 font-semibold">Doctor</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-teal-50/40">
                      <td className="px-4 py-3 align-top">
                        {a.status === 'pending' ? (
                          <div>
                            <p className="font-medium text-amber-800">Awaiting schedule</p>
                            {a.preferredDate && (
                              <p className="text-slate-600 text-xs mt-0.5">
                                You asked for: {new Date(a.preferredDate).toLocaleDateString()}
                              </p>
                            )}
                            {a.patientNotes && (
                              <p className="text-slate-500 text-xs mt-1 max-w-xs line-clamp-2">{a.patientNotes}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-slate-800">{a.date ? new Date(a.date).toLocaleDateString() : '—'}</p>
                            <p className="text-slate-600">{a.timeSlot || '—'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {a.status === 'pending' ? (
                          <span className="text-slate-700">
                            {a.preferredDoctor?.name ? (
                              <>
                                Preferred: Dr. {a.preferredDoctor.name}
                                <span className="text-slate-500 text-xs block">{a.preferredDoctor.specialization}</span>
                              </>
                            ) : (
                              <span className="text-slate-500">To be assigned</span>
                            )}
                          </span>
                        ) : (
                          <span>
                            Dr. {a.doctor?.name}
                            <span className="text-slate-500 text-xs block">{a.doctor?.specialization}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize align-top">{a.type}</td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {(a.status === 'pending' || a.status === 'scheduled') && (
                          <button
                            type="button"
                            onClick={() => cancelAppointment(a._id)}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
