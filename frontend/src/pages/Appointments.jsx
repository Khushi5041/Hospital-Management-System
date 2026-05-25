import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const inputClass =
  'w-full px-3 py-2.5 border border-teal-200 dark:border-slate-600 rounded-lg text-teal-900 dark:text-teal-50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
const labelClass = 'block font-medium text-sm text-teal-900 dark:text-teal-100 mb-1.5';
const formGroup = 'mb-4';

function Badge({ status }) {
  const map = {
    pending: 'bg-amber-100 text-amber-900',
    scheduled: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function formatWhen(a) {
  if (a.status === 'pending') {
    return (
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-200">Request</p>
        {a.preferredDate && (
          <p className="text-xs text-slate-600 dark:text-slate-400">Pref: {new Date(a.preferredDate).toLocaleDateString()}</p>
        )}
      </div>
    );
  }
  return a.date ? new Date(a.date).toLocaleDateString() : '—';
}

export default function Appointments() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [freeSlots, setFreeSlots] = useState([]);
  const [form, setForm] = useState({
    patient: '',
    doctor: '',
    department: '',
    date: '',
    timeSlot: '',
    type: 'consultation',
    status: 'scheduled',
    notes: '',
  });

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  /** Prefer active doctors for scheduling; if none, include all statuses so the dropdown is usable. */
  const loadDoctors = useCallback(async () => {
    try {
      let list = [];
      const activeRes = await api.get('/doctors', { params: { status: 'active' } });
      list = Array.isArray(activeRes.data) ? activeRes.data : [];
      if (list.length === 0) {
        const allRes = await api.get('/doctors');
        list = Array.isArray(allRes.data) ? allRes.data : [];
      }
      const rank = { active: 0, on_leave: 1, inactive: 2 };
      list.sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
      setDoctors(list);
    } catch {
      setDoctors([]);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;

      const [aptSettled, pSettled, depSettled] = await Promise.allSettled([
        api.get('/appointments', { params }),
        api.get('/patients'),
        api.get('/departments'),
      ]);

      if (aptSettled.status === 'fulfilled') {
        setAppointments(Array.isArray(aptSettled.value.data) ? aptSettled.value.data : []);
      } else {
        setAppointments([]);
        toast.error('Failed to load appointments');
      }

      if (pSettled.status === 'fulfilled') {
        setPatients(Array.isArray(pSettled.value.data) ? pSettled.value.data : []);
      } else {
        setPatients([]);
      }

      if (depSettled.status === 'fulfilled') {
        setDepartments(Array.isArray(depSettled.value.data) ? depSettled.value.data : []);
      } else {
        setDepartments([]);
      }

      await loadDoctors();
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, loadDoctors]);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, [searchParams]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const loadSlots = async (doctorId, dateStr) => {
    if (!doctorId || !dateStr) {
      setFreeSlots([]);
      return;
    }
    setSlotLoading(true);
    try {
      const { data } = await api.get(`/doctors/${doctorId}/available-slots`, { params: { date: dateStr } });
      setFreeSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (_) {
      setFreeSlots([]);
      toast.error('Could not load available slots');
    } finally {
      setSlotLoading(false);
    }
  };

  useEffect(() => {
    if (!modal) setFreeSlots([]);
  }, [modal]);

  useEffect(() => {
    // `typeof null === 'object'` — must not read `modal.type` when modal is null.
    if (modal?.type !== 'edit' || !modal?.wasPending) return;
    if (form.doctor && form.date) loadSlots(form.doctor, form.date);
  }, [form.doctor, form.date, modal?.id, modal?.wasPending]);

  const openAdd = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      patient: '',
      doctor: '',
      department: '',
      date: today,
      timeSlot: '09:00',
      type: 'consultation',
      status: 'scheduled',
      notes: '',
    });
    setFreeSlots([]);
    setModal('add');
    void loadDoctors();
  };

  const openEdit = (a) => {
    const isPending = a.status === 'pending';
    const prefDoc = a.preferredDoctor?._id || a.preferredDoctor;
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      patient: a.patient?._id || a.patient,
      doctor: a.doctor?._id || a.doctor || prefDoc || '',
      department: a.department?._id || a.department || '',
      date: a.date ? new Date(a.date).toISOString().slice(0, 10) : a.preferredDate ? new Date(a.preferredDate).toISOString().slice(0, 10) : today,
      timeSlot: a.timeSlot || '09:00',
      type: a.type || 'consultation',
      status: isPending ? 'scheduled' : a.status || 'scheduled',
      notes: a.notes || '',
    });
    setFreeSlots([]);
    setModal({ type: 'edit', id: a._id, wasPending: isPending });
    void loadDoctors();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, department: form.department || undefined };
    if (modal?.type === 'edit' && modal.wasPending && payload.status === 'scheduled') {
      if (!payload.doctor || !payload.date || !payload.timeSlot) {
        toast.error('Choose doctor, date, and a free time slot to confirm the request');
        return;
      }
    }
    try {
      if (modal === 'add') {
        await api.post('/appointments', payload);
        toast.success('Appointment created');
      } else {
        await api.put(`/appointments/${modal.id}`, payload);
        toast.success('Appointment updated');
      }
      setModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel/delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment removed');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const isPendingSchedule = typeof modal === 'object' && modal?.type === 'edit' && modal.wasPending;
  const slotOptions = isPendingSchedule && freeSlots.length > 0 ? freeSlots : timeSlots;

  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-900 dark:text-teal-100">Appointments</h1>
          <p className="text-teal-700 dark:text-teal-300 text-sm mt-1">
            Confirm patient requests (pending) using each doctor&apos;s availability and free slots.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600"
          onClick={openAdd}
        >
          + New Appointment
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-teal-200 dark:border-slate-600 p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={inputClass} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-[180px] ${inputClass}`}>
            <option value="">All status</option>
            <option value="pending">Pending requests</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-teal-200 dark:border-slate-600">
          {loading ? (
            <p className="py-8 text-center text-teal-600 dark:text-teal-300">Loading...</p>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 px-8 text-teal-700 dark:text-teal-200">
              <p>No appointments found.</p>
              <button
                type="button"
                className="mt-4 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600"
                onClick={openAdd}
              >
                Create first appointment
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">When</th>
                  <th className="text-left px-4 py-3 font-semibold">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold">Doctor</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/80">
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 align-top">{formatWhen(a)}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 align-top">
                      {a.patient?.name} ({a.patient?.phone || '—'})
                    </td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 align-top">
                      {a.status === 'pending' ? (
                        <span className="text-amber-900 dark:text-amber-200 text-xs">
                          {a.preferredDoctor?.name ? `Pref: Dr. ${a.preferredDoctor.name}` : 'Unassigned'}
                        </span>
                      ) : (
                        <>
                          {a.doctor?.name} ({a.doctor?.specialization})
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 capitalize">{a.type}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700">
                      <button
                        type="button"
                        className="py-1.5 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mr-2"
                        onClick={() => openEdit(a)}
                      >
                        {a.status === 'pending' ? 'Schedule' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-3 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDelete(a._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-teal-900/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-teal-200/80 dark:border-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-teal-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-teal-900 dark:text-teal-100">
                {modal === 'add' ? 'New Appointment' : modal.wasPending ? 'Confirm patient request' : 'Edit Appointment'}
              </h2>
              <button type="button" className="text-2xl leading-none text-teal-900 dark:text-teal-100 hover:opacity-70" onClick={() => setModal(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                {modal !== 'add' && modal.wasPending && (
                  <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    Assign doctor, date, and an <strong>available</strong> time. Status should be <strong>scheduled</strong> when you save.
                  </p>
                )}
                <div className={formGroup}>
                  <label className={labelClass}>Patient *</label>
                  <select
                    className={inputClass}
                    value={form.patient}
                    onChange={(e) => setForm({ ...form, patient: e.target.value })}
                    required
                    disabled={modal !== 'add' && modal.wasPending}
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} - {p.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Doctor *</label>
                  <select
                    className={inputClass}
                    value={form.doctor}
                    onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                    required={form.status !== 'pending'}
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} — {d.specialization}
                        {d.status && d.status !== 'active' ? ` (${d.status.replace('_', ' ')})` : ''}
                      </option>
                    ))}
                  </select>
                  {doctors.length === 0 && (
                    <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-2">
                      No doctors found. Add physicians on the{' '}
                      <Link to="/doctors" className="font-semibold text-teal-800 dark:text-teal-300 underline hover:text-teal-950 dark:hover:text-teal-200">
                        Doctors
                      </Link>{' '}
                      page and set status to <strong>active</strong> so they appear here first.
                    </p>
                  )}
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Department</label>
                  <select className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">None</option>
                    {departments.map((dep) => (
                      <option key={dep._id} value={dep._id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Date *</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required={form.status !== 'pending'}
                    />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Time *</label>
                    <select
                      className={inputClass}
                      value={form.timeSlot}
                      onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                      required={form.status !== 'pending'}
                      disabled={isPendingSchedule && slotLoading}
                    >
                      {slotOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {isPendingSchedule && slotLoading && (
                      <p className="text-xs text-teal-600 mt-1">Loading available slots…</p>
                    )}
                    {isPendingSchedule && freeSlots.length === 0 && !slotLoading && form.doctor && form.date && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">No free slots this day — pick another date or doctor.</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Type</label>
                    <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="consultation">Consultation</option>
                      <option value="followup">Follow-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No show</option>
                    </select>
                  </div>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="p-4 border-t border-teal-200 dark:border-slate-600 flex gap-3 justify-end">
                <button
                  type="button"
                  className="py-2 px-4 rounded-lg font-semibold text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
