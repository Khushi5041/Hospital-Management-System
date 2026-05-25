import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { HOSPITAL_NAME } from '../config/constants';

const tabs = [
  { id: 'overview', label: 'Daily dashboard', icon: '📊' },
  { id: 'patients', label: 'Patient desk', icon: '🧾' },
  { id: 'queue', label: 'Visit queue', icon: '⏳' },
  { id: 'beds', label: 'Beds & rooms', icon: '🛏️' },
  { id: 'billing', label: 'Billing', icon: '💰' },
  { id: 'emergency', label: 'Emergency', icon: '🚑' },
  { id: 'comms', label: 'Notify team', icon: '🔔' },
];

export default function StaffDesk() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [bills, setBills] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [messages, setMessages] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qForm, setQForm] = useState({ patient: '', doctor: '', chiefComplaint: '', priority: 'normal' });
  const [bedForm, setBedForm] = useState({ room: '', bedLabel: '', notes: '' });
  const [billForm, setBillForm] = useState({ patient: '', insuranceNote: '', lines: [{ description: '', amount: '' }] });
  const [emForm, setEmForm] = useState({
    callerName: '',
    phone: '',
    location: '',
    chiefComplaint: '',
    triageLevel: '3',
    assignedDoctor: '',
  });
  const [msgForm, setMsgForm] = useState({ toDoctor: '', patient: '', body: '', channel: 'in_app' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [st, q, b, bl, em, msg, p, d] = await Promise.all([
        api.get('/staff-desk/stats'),
        api.get('/staff-desk/queue'),
        api.get('/staff-desk/beds'),
        api.get('/staff-desk/bills'),
        api.get('/staff-desk/emergencies'),
        api.get('/staff-desk/messages'),
        api.get('/patients'),
        api.get('/doctors', { params: { status: 'active' } }),
      ]);
      setStats(st.data);
      setQueue(Array.isArray(q.data) ? q.data : []);
      setBeds(Array.isArray(b.data) ? b.data : []);
      setBills(Array.isArray(bl.data) ? bl.data : []);
      setEmergencies(Array.isArray(em.data) ? em.data : []);
      setMessages(Array.isArray(msg.data) ? msg.data : []);
      setPatients(Array.isArray(p.data) ? p.data : []);
      setDoctors(Array.isArray(d.data) ? d.data : []);
    } catch {
      toast.error('Could not load staff desk data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshQueue = async () => {
    const { data } = await api.get('/staff-desk/queue');
    setQueue(Array.isArray(data) ? data : []);
  };

  const addQueue = async (e) => {
    e.preventDefault();
    if (!qForm.patient) return toast.error('Select a patient');
    try {
      await api.post('/staff-desk/queue', {
        patient: qForm.patient,
        doctor: qForm.doctor || undefined,
        chiefComplaint: qForm.chiefComplaint,
        priority: qForm.priority,
      });
      toast.success('Added to queue');
      setQForm({ patient: '', doctor: '', chiefComplaint: '', priority: 'normal' });
      await refreshQueue();
      const { data } = await api.get('/staff-desk/stats');
      setStats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const patchQueue = async (id, status) => {
    try {
      await api.patch(`/staff-desk/queue/${id}`, { status });
      toast.success('Queue updated');
      await refreshQueue();
      const { data } = await api.get('/staff-desk/stats');
      setStats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const addBed = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff-desk/beds', bedForm);
      toast.success('Bed added');
      setBedForm({ room: '', bedLabel: '', notes: '' });
      const { data } = await api.get('/staff-desk/beds');
      setBeds(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const patchBed = async (id, payload) => {
    try {
      await api.patch(`/staff-desk/beds/${id}`, payload);
      toast.success('Bed updated');
      const { data } = await api.get('/staff-desk/beds');
      setBeds(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const submitBill = async (e) => {
    e.preventDefault();
    const lines = billForm.lines
      .filter((l) => l.description?.trim())
      .map((l) => ({ description: l.description.trim(), amount: Number(l.amount) || 0 }));
    if (!billForm.patient || !lines.length) return toast.error('Patient and line items required');
    try {
      await api.post('/staff-desk/bills', {
        patient: billForm.patient,
        lines,
        insuranceNote: billForm.insuranceNote,
      });
      toast.success('Bill generated — use list to print / mark paid');
      setBillForm({ patient: '', insuranceNote: '', lines: [{ description: '', amount: '' }] });
      const { data } = await api.get('/staff-desk/bills');
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const payBill = async (id) => {
    try {
      await api.patch(`/staff-desk/bills/${id}/mark-paid`);
      toast.success('Marked paid');
      const { data } = await api.get('/staff-desk/bills');
      setBills(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed');
    }
  };

  const printReceipt = (bill) => {
    const w = window.open('', '_blank');
    if (!w) return toast.error('Allow pop-ups to print');
    const total = bill.total ?? (bill.lines || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
    w.document.write(
      `<html><head><title>Receipt ${bill.receiptNo}</title></head><body style="font-family:sans-serif;padding:24px;">
      <h1>${HOSPITAL_NAME}</h1>
      <p><strong>Receipt</strong> ${bill.receiptNo}</p>
      <p>Patient: ${bill.patient?.name || ''} · ${bill.patient?.patientCode || ''}</p>
      <ul>${(bill.lines || []).map((l) => `<li>${l.description} — ₹${l.amount}</li>`).join('')}</ul>
      <p><strong>Total: ₹${total}</strong></p>
      ${bill.insuranceNote ? `<p>Insurance note: ${bill.insuranceNote}</p>` : ''}
      <p style="color:#666;font-size:12px;">Thank you for your visit.</p>
      </body></html>`
    );
    w.document.close();
    w.print();
  };

  const submitEmergency = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff-desk/emergencies', {
        ...emForm,
        assignedDoctor: emForm.assignedDoctor || undefined,
      });
      toast.success('Emergency case logged');
      setEmForm({ callerName: '', phone: '', location: '', chiefComplaint: '', triageLevel: '3', assignedDoctor: '' });
      const { data } = await api.get('/staff-desk/emergencies');
      setEmergencies(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const closeEm = async (id) => {
    try {
      await api.patch(`/staff-desk/emergencies/${id}/close`);
      const { data } = await api.get('/staff-desk/emergencies');
      setEmergencies(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed');
    }
  };

  const sendNotify = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff-desk/notify', {
        toDoctor: msgForm.toDoctor,
        patient: msgForm.patient || undefined,
        body: msgForm.body,
        channel: msgForm.channel,
      });
      toast.success(
        msgForm.channel === 'sms'
          ? 'SMS queued (demo: logged only — connect Twilio for real sends)'
          : msgForm.channel === 'email'
            ? 'Email logged (demo — connect SendGrid for production)'
            : 'Message logged for clinical team'
      );
      setMsgForm({ toDoctor: '', patient: '', body: '', channel: 'in_app' });
      const { data } = await api.get('/staff-desk/messages');
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const nextInQueue = queue.filter((x) => x.status === 'waiting')[0];

  const card = 'rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 shadow-sm';

  return (
    <>
      <PageHeader
        title="Staff desk"
        subtitle={`Reception, queue, beds, billing & coordination — ${HOSPITAL_NAME}`}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tab === t.id
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-teal-400'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 dark:text-slate-400 py-12 text-center">Loading staff desk…</p>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Patients registered today', value: stats?.patientsRegisteredToday ?? 0, icon: '👥' },
                  { label: 'Appointments today', value: stats?.appointmentsToday ?? 0, icon: '📅' },
                  { label: 'Waiting in queue', value: stats?.queueWaiting ?? 0, icon: '⏳' },
                  { label: 'Visits handled today', value: stats?.visitsHandledToday ?? 0, icon: '✅' },
                ].map((x) => (
                  <div key={x.label} className={card}>
                    <p className="text-2xl mb-1">{x.icon}</p>
                    <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{x.value}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{x.label}</p>
                  </div>
                ))}
              </div>
              <div className={`${card} grid md:grid-cols-2 gap-4`}>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Average wait (called today)</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {stats?.avgWaitMinutesToday != null ? `${stats.avgWaitMinutesToday} min` : '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Based on check-in → first call for completed visits today.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Open emergency cases</p>
                  <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{stats?.emergenciesOpen ?? 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Triage entries not yet closed.</p>
                </div>
              </div>
              <div className={card}>
                <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Quick links</p>
                <div className="flex flex-wrap gap-3">
                  <Link className="text-teal-700 dark:text-teal-400 font-semibold hover:underline" to="/patients">
                    Patients — register & edit
                  </Link>
                  <Link className="text-teal-700 dark:text-teal-400 font-semibold hover:underline" to="/appointments">
                    Appointments — book & reschedule
                  </Link>
                  <Link className="text-teal-700 dark:text-teal-400 font-semibold hover:underline" to="/medical-records">
                    Medical records
                  </Link>
                </div>
              </div>
            </div>
          )}

          {tab === 'patients' && (
            <div className={`${card} space-y-4`}>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Front desk — patients</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li>
                  <strong>Register walk-ins</strong> on the Patients page — enable <em>Walk-in registration</em> to flag the visit; a{' '}
                  <strong>Patient ID / token</strong> (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">patientCode</code>) is
                  generated automatically for queue & billing.
                </li>
                <li>
                  <strong>Search</strong> by name, phone, email, or patient code from the Patients list.
                </li>
                <li>
                  <strong>Upload reports</strong> from patient profile view — lab PDFs, imaging, prescription scans attach to the chart.
                </li>
              </ul>
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700"
              >
                Open Patients →
              </Link>
            </div>
          )}

          {tab === 'queue' && (
            <div className="space-y-6">
              <div className={card}>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Who&apos;s next?</h3>
                {nextInQueue ? (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 mb-4">
                    <p className="text-sm text-amber-900 dark:text-amber-200 font-semibold">Next up</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {nextInQueue.patient?.name} · Token {nextInQueue.visitToken}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{nextInQueue.chiefComplaint || '—'}</p>
                    <button
                      type="button"
                      className="mt-3 py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
                      onClick={() => patchQueue(nextInQueue._id, 'called')}
                    >
                      Call patient in
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">No one waiting — add a check-in below.</p>
                )}
                <form onSubmit={addQueue} className="grid md:grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-600 pt-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      value={qForm.patient}
                      onChange={(e) => setQForm({ ...qForm, patient: e.target.value })}
                    >
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.patientCode ? `(${p.patientCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign doctor (optional)</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      value={qForm.doctor}
                      onChange={(e) => setQForm({ ...qForm, doctor: e.target.value })}
                    >
                      <option value="">— Triage first —</option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} — {d.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      value={qForm.priority}
                      onChange={(e) => setQForm({ ...qForm, priority: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / notes</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      value={qForm.chiefComplaint}
                      onChange={(e) => setQForm({ ...qForm, chiefComplaint: e.target.value })}
                      placeholder="e.g. Follow-up dressing, new fever…"
                    />
                  </div>
                  <button type="submit" className="md:col-span-2 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700">
                    Check in to queue
                  </button>
                </form>
              </div>
              <div className={card}>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Active queue</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                        <th className="py-2 pr-2">Token</th>
                        <th className="py-2 pr-2">Patient</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((q) => (
                        <tr key={q._id} className="border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          <td className="py-2 font-mono text-xs">{q.visitToken}</td>
                          <td className="py-2">{q.patient?.name}</td>
                          <td className="py-2 capitalize">{q.status.replace('_', ' ')}</td>
                          <td className="py-2 flex flex-wrap gap-1">
                            {q.status === 'waiting' && (
                              <button type="button" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline" onClick={() => patchQueue(q._id, 'called')}>
                                Call
                              </button>
                            )}
                            {(q.status === 'waiting' || q.status === 'called') && (
                              <button type="button" className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline" onClick={() => patchQueue(q._id, 'with_doctor')}>
                                With doctor
                              </button>
                            )}
                            {q.status !== 'completed' && q.status !== 'cancelled' && (
                              <button type="button" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline" onClick={() => patchQueue(q._id, 'completed')}>
                                Done
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Book or reschedule appointments from the{' '}
                <Link to="/appointments" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                  Appointments
                </Link>{' '}
                module — assign doctor and slot based on availability there.
              </p>
            </div>
          )}

          {tab === 'beds' && (
            <div className="space-y-6">
              <form onSubmit={addBed} className={`${card} flex flex-wrap gap-3 items-end`}>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Room</label>
                  <input
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                    value={bedForm.room}
                    onChange={(e) => setBedForm({ ...bedForm, room: e.target.value })}
                    placeholder="301"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Bed</label>
                  <input
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                    value={bedForm.bedLabel}
                    onChange={(e) => setBedForm({ ...bedForm, bedLabel: e.target.value })}
                    placeholder="A"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                    value={bedForm.notes}
                    onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                  />
                </div>
                <button type="submit" className="py-2 px-4 rounded-lg bg-teal-600 text-white font-semibold text-sm">
                  Add bed
                </button>
              </form>
              <div className={card}>
                <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Bed map</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                        <th className="py-2">Room / bed</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Patient</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beds.map((b) => (
                        <tr key={b._id} className="border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          <td className="py-2">
                            {b.room} — {b.bedLabel}
                          </td>
                          <td className="py-2 capitalize">{b.status}</td>
                          <td className="py-2">{b.patient?.name || '—'}</td>
                          <td className="py-2 flex flex-wrap gap-2">
                            {b.status === 'available' && (
                              <select
                                className="text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                defaultValue=""
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v) patchBed(b._id, { status: 'occupied', patient: v });
                                  e.target.value = '';
                                }}
                              >
                                <option value="">Assign patient…</option>
                                {patients.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            )}
                            {b.status === 'occupied' && (
                              <button type="button" className="text-xs text-rose-600 font-semibold hover:underline" onClick={() => patchBed(b._id, { status: 'cleaning', patient: null })}>
                                Discharge → cleaning
                              </button>
                            )}
                            {b.status === 'cleaning' && (
                              <button type="button" className="text-xs text-teal-700 font-semibold hover:underline" onClick={() => patchBed(b._id, { status: 'available', patient: null })}>
                                Mark ready
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {beds.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No beds yet — add rooms above.</p>}
                </div>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-6">
              <form onSubmit={submitBill} className={`${card} space-y-3`}>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Generate bill</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
                  <select
                    className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                    value={billForm.patient}
                    onChange={(e) => setBillForm({ ...billForm, patient: e.target.value })}
                  >
                    <option value="">Select</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.patientCode ? `· ${p.patientCode}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Insurance / authorization (optional)</label>
                  <input
                    className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                    value={billForm.insuranceNote}
                    onChange={(e) => setBillForm({ ...billForm, insuranceNote: e.target.value })}
                    placeholder="Policy #, copay note, pre-auth…"
                  />
                </div>
                {billForm.lines.map((line, i) => (
                  <div key={i} className="flex flex-wrap gap-2 items-center">
                    <input
                      className="flex-1 min-w-[140px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => {
                        const lines = [...billForm.lines];
                        lines[i] = { ...lines[i], description: e.target.value };
                        setBillForm({ ...billForm, lines });
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      className="w-28 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                      placeholder="₹"
                      value={line.amount}
                      onChange={(e) => {
                        const lines = [...billForm.lines];
                        lines[i] = { ...lines[i], amount: e.target.value };
                        setBillForm({ ...billForm, lines });
                      }}
                    />
                    {billForm.lines.length > 1 && (
                      <button
                        type="button"
                        className="text-rose-600 text-sm font-semibold"
                        onClick={() => setBillForm({ ...billForm, lines: billForm.lines.filter((_, j) => j !== i) })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  onClick={() => setBillForm({ ...billForm, lines: [...billForm.lines, { description: '', amount: '' }] })}
                >
                  + Line item
                </button>
                <button type="submit" className="py-2.5 px-5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700">
                  Generate bill
                </button>
              </form>
              <div className={card}>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Recent bills</h4>
                <ul className="space-y-3 text-sm">
                  {bills.map((bill) => (
                    <li key={bill._id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-800 dark:text-slate-200">
                      <span>
                        <strong>{bill.receiptNo}</strong> · {bill.patient?.name} · ₹{bill.total ?? 0}{' '}
                        <span className="text-slate-500 capitalize">({bill.status})</span>
                      </span>
                      <span className="flex gap-2">
                        <button type="button" className="text-teal-700 dark:text-teal-400 font-semibold hover:underline" onClick={() => printReceipt(bill)}>
                          Print receipt
                        </button>
                        {bill.status !== 'paid' && (
                          <button type="button" className="text-slate-600 dark:text-slate-400 font-semibold hover:underline" onClick={() => payBill(bill._id)}>
                            Mark paid
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {bills.length === 0 && <p className="text-slate-500 dark:text-slate-400">No bills yet.</p>}
              </div>
            </div>
          )}

          {tab === 'emergency' && (
            <div className="space-y-6">
              <form onSubmit={submitEmergency} className={`${card} grid md:grid-cols-2 gap-3`}>
                <h3 className="md:col-span-2 font-bold text-slate-900 dark:text-slate-100">Emergency case entry</h3>
                <input
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Caller / patient name *"
                  value={emForm.callerName}
                  onChange={(e) => setEmForm({ ...emForm, callerName: e.target.value })}
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Phone"
                  value={emForm.phone}
                  onChange={(e) => setEmForm({ ...emForm, phone: e.target.value })}
                />
                <input
                  className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Location / ETA"
                  value={emForm.location}
                  onChange={(e) => setEmForm({ ...emForm, location: e.target.value })}
                />
                <textarea
                  className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 min-h-[80px]"
                  placeholder="Chief complaint *"
                  value={emForm.chiefComplaint}
                  onChange={(e) => setEmForm({ ...emForm, chiefComplaint: e.target.value })}
                  required
                />
                <select
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  value={emForm.triageLevel}
                  onChange={(e) => setEmForm({ ...emForm, triageLevel: e.target.value })}
                >
                  {['1', '2', '3', '4', '5'].map((n) => (
                    <option key={n} value={n}>
                      Triage level {n}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  value={emForm.assignedDoctor}
                  onChange={(e) => setEmForm({ ...emForm, assignedDoctor: e.target.value })}
                >
                  <option value="">Assign doctor (optional)</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="md:col-span-2 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700">
                  Log emergency
                </button>
              </form>
              <div className={card}>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Recent cases</h4>
                <ul className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
                  {emergencies.map((e) => (
                    <li key={e._id} className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span>
                        <strong className="text-slate-900 dark:text-white">{e.callerName}</strong> — {e.chiefComplaint.slice(0, 60)}
                        {e.chiefComplaint.length > 60 ? '…' : ''}{' '}
                        <span className="text-rose-600">L{e.triageLevel}</span> · {e.status}
                      </span>
                      {e.status === 'open' && (
                        <button type="button" className="text-xs font-semibold text-slate-500 hover:underline shrink-0" onClick={() => closeEm(e._id)}>
                          Close
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'comms' && (
            <div className="space-y-6">
              <form onSubmit={sendNotify} className={`${card} space-y-3`}>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Notify doctor (arrival / coordination)</h3>
                <select
                  className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  value={msgForm.toDoctor}
                  onChange={(e) => setMsgForm({ ...msgForm, toDoctor: e.target.value })}
                  required
                >
                  <option value="">Select doctor *</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  value={msgForm.patient}
                  onChange={(e) => setMsgForm({ ...msgForm, patient: e.target.value })}
                >
                  <option value="">Related patient (optional)</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  value={msgForm.channel}
                  onChange={(e) => setMsgForm({ ...msgForm, channel: e.target.value })}
                >
                  <option value="in_app">In-app log</option>
                  <option value="sms">SMS (demo — logged only)</option>
                  <option value="email">Email (demo — logged only)</option>
                </select>
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 min-h-[100px]"
                  placeholder="Message * e.g. Patient arrived at desk 2, labs uploaded…"
                  value={msgForm.body}
                  onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
                  required
                />
                <button type="submit" className="py-2.5 px-5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700">
                  Send / log
                </button>
              </form>
              <div className={card}>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Recent messages</h4>
                <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
                  {messages.map((m) => (
                    <li key={m._id} className="border-b border-slate-100 dark:border-slate-700 pb-2">
                      <span className="text-slate-900 dark:text-white font-medium">To Dr. {m.toDoctor?.name}</span> · {m.channel} ·{' '}
                      {new Date(m.createdAt).toLocaleString()}
                      <p className="mt-1">{m.body}</p>
                    </li>
                  ))}
                </ul>
                {messages.length === 0 && <p className="text-slate-500">No messages yet.</p>}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
