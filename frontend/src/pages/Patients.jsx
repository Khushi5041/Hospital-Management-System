import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { profilePicUrl } from '../utils/profilePicUrl';

const inputClass =
  'w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
const labelClass = 'block font-medium text-sm text-slate-700 dark:text-slate-300 mb-1.5';
const formGroup = 'mb-4';

function Badge({ status }) {
  const map = { active: 'bg-green-100 text-green-800', inactive: 'bg-amber-100 text-amber-800', discharged: 'bg-red-100 text-red-800' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const docFileRef = useRef(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('report');
  const [docUploading, setDocUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    status: 'active',
    walkIn: false,
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/patients', { params });
      setPatients(data);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const openAdd = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
      status: 'active',
      walkIn: false,
    });
    setModal('add');
  };

  const openView = async (p) => {
    setViewPatient(p);
    setViewLoading(true);
    setPatientAppointments([]);
    setPatientRecords([]);
    try {
      const [{ data: fresh }, aptRes, recRes] = await Promise.all([
        api.get(`/patients/${p._id}`),
        api.get('/appointments', { params: { patient: p._id } }),
        api.get('/medical-records', { params: { patient: p._id } }),
      ]);
      setViewPatient(fresh);
      setPatientAppointments(Array.isArray(aptRes.data) ? aptRes.data : []);
      setPatientRecords(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (err) {
      toast.error('Failed to load patient details');
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (p) => {
    setForm({
      name: p.name,
      email: p.email,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      gender: p.gender || '',
      address: p.address || '',
      bloodGroup: p.bloodGroup || '',
      emergencyContact: p.emergencyContact || '',
      status: p.status || 'active',
      walkIn: Boolean(p.walkIn),
    });
    setModal({ type: 'edit', id: p._id });
  };

  const refreshViewPatient = async (id) => {
    const { data } = await api.get(`/patients/${id}`);
    setViewPatient(data);
  };

  const handlePatientDocUpload = async (e) => {
    e.preventDefault();
    if (!viewPatient?._id) return;
    const file = docFileRef.current?.files?.[0];
    if (!file) {
      toast.error('Choose a PDF or image file');
      return;
    }
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', docTitle.trim() || file.name);
      fd.append('category', docCategory);
      await api.post(`/patients/${viewPatient._id}/documents`, fd);
      toast.success('Document attached');
      setDocTitle('');
      if (docFileRef.current) docFileRef.current.value = '';
      await refreshViewPatient(viewPatient._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setDocUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modal === 'add' && !form.walkIn && !form.email?.trim()) {
      toast.error('Email is required unless this is a walk-in');
      return;
    }
    const payload = {
      ...form,
      walkIn: Boolean(form.walkIn),
    };
    if (modal === 'add' && payload.walkIn && !payload.email?.trim()) {
      payload.email = `walkin-${Date.now()}@desk.local`;
    }
    try {
      if (modal === 'add') {
        await api.post('/patients', payload);
        toast.success('Patient added — ID/token is generated automatically for queue & billing');
      } else {
        await api.put(`/patients/${modal.id}`, payload);
        toast.success('Patient updated');
      }
      setModal(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient?')) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient removed');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Register walk-ins, search by patient ID, edit charts, attach lab reports & scans"
        action={
          <button type="button" className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 shadow-sm" onClick={openAdd}>+ Add Patient</button>
        }
      />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-600 p-6">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search name, email, phone, or patient ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputClass}`}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-[140px] ${inputClass}`}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
          {loading ? (
            <p className="py-8 text-center text-teal-600 dark:text-teal-300">Loading...</p>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 px-8 text-teal-700 dark:text-teal-200">
              <p>No patients found.</p>
              <button type="button" className="mt-4 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>Add first patient</button>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Patient ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold">Blood</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80">
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      {p.name}
                      {p.walkIn && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300">{p.patientCode || '—'}</td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{p.email}</td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{p.phone}</td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{p.gender || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{p.bloodGroup || '-'}</td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mr-2" onClick={() => openView(p)}>View</button>
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mr-2" onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-teal-900 dark:text-teal-100">{modal === 'add' ? 'Add Patient' : 'Edit Patient'}</h2>
              <button type="button" className="text-2xl leading-none text-teal-900 dark:text-teal-100 hover:opacity-70" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                <div className={formGroup}>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                {modal === 'add' && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 mb-3">
                    <input
                      type="checkbox"
                      checked={form.walkIn}
                      onChange={(e) => setForm({ ...form, walkIn: e.target.checked })}
                      className="rounded border-slate-300 text-teal-600"
                    />
                    Walk-in registration (desk will auto-fill email if left blank)
                  </label>
                )}
                <div className={formGroup}>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required={modal !== 'add' || !form.walkIn}
                  />
                  {modal === 'add' && form.walkIn && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave blank to use an auto-generated desk email, or enter a real address.</p>
                  )}
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Phone *</label>
                  <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Date of birth</label>
                    <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Gender</label>
                    <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Address</label>
                  <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Blood group</label>
                    <input className={inputClass} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} placeholder="e.g. O+" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Emergency contact</label>
                    <input className={inputClass} value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
                  </div>
                </div>
                {modal !== 'add' && (
                  <div className={formGroup}>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discharged">Discharged</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-600 flex gap-3 justify-end">
                <button type="button" className="py-2 px-4 rounded-lg font-semibold text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewPatient && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setViewPatient(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Patient details</h2>
              <button type="button" className="text-2xl leading-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => setViewPatient(null)}>&times;</button>
            </div>
            <div className="p-5">
              {viewLoading ? (
                <p className="text-center py-8 text-teal-600 dark:text-teal-300">Loading...</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-6 text-slate-800 dark:text-slate-200">
                    <div className="col-span-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 px-3 py-2">
                      <span className="text-teal-700 dark:text-teal-300 font-medium text-xs uppercase">Patient ID / token</span>
                      <p className="font-mono text-lg font-bold text-teal-900 dark:text-teal-100">{viewPatient.patientCode || 'Pending…'}</p>
                      {viewPatient.walkIn && (
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Walk-in visit</span>
                      )}
                    </div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Name</span><br />{viewPatient.name}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Email</span><br />{viewPatient.email}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Phone</span><br />{viewPatient.phone}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Gender</span><br />{viewPatient.gender || '-'}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Blood group</span><br />{viewPatient.bloodGroup || '-'}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Status</span><br /><Badge status={viewPatient.status} /></div>
                    <div className="col-span-2"><span className="text-teal-600 dark:text-teal-400 font-medium">Address</span><br />{viewPatient.address || '-'}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Emergency contact</span><br />{viewPatient.emergencyContact || '-'}</div>
                    <div><span className="text-teal-600 dark:text-teal-400 font-medium">Date of birth</span><br />{viewPatient.dateOfBirth ? new Date(viewPatient.dateOfBirth).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Attached files (labs, imaging, Rx scans)</h3>
                    <ul className="text-sm space-y-1 mb-3 text-slate-700 dark:text-slate-300">
                      {(viewPatient.documents || []).length === 0 ? (
                        <li className="text-slate-500">No documents yet.</li>
                      ) : (
                        (viewPatient.documents || []).map((d) => (
                          <li key={d._id}>
                            <a
                              href={profilePicUrl(d.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-700 dark:text-teal-400 font-medium hover:underline"
                            >
                              {d.title}
                            </a>
                            <span className="text-slate-500 text-xs ml-2">({d.category})</span>
                          </li>
                        ))
                      )}
                    </ul>
                    <form onSubmit={handlePatientDocUpload} className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-end">
                      <input
                        type="text"
                        placeholder="Title"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className={`flex-1 min-w-[120px] ${inputClass}`}
                      />
                      <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className={`w-full sm:w-40 ${inputClass}`}>
                        <option value="lab">Lab</option>
                        <option value="imaging">Imaging</option>
                        <option value="prescription_scan">Prescription scan</option>
                        <option value="report">Report</option>
                        <option value="other">Other</option>
                      </select>
                      <input ref={docFileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm text-slate-600 dark:text-slate-400" />
                      <button
                        type="submit"
                        disabled={docUploading}
                        className="py-2 px-4 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
                      >
                        {docUploading ? 'Uploading…' : 'Upload'}
                      </button>
                    </form>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Appointments ({patientAppointments.length})</h3>
                    <div className="rounded-lg border border-teal-200 dark:border-slate-600 overflow-hidden text-sm">
                      {patientAppointments.length === 0 ? (
                        <p className="px-4 py-3 text-teal-600 dark:text-teal-300">No appointments</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-teal-50 dark:bg-slate-800">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Date</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Time</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Doctor</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientAppointments.map((a) => (
                              <tr key={a._id} className="border-t border-teal-100 dark:border-slate-700">
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{a.date ? new Date(a.date).toLocaleDateString() : '—'}</td>
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{a.timeSlot || '—'}</td>
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{a.doctor?.name || '—'}</td>
                                <td className="px-3 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${a.status === 'scheduled' ? 'bg-cyan-100 text-cyan-800' : a.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Medical records ({patientRecords.length})</h3>
                    <div className="rounded-lg border border-teal-200 dark:border-slate-600 overflow-hidden text-sm">
                      {patientRecords.length === 0 ? (
                        <p className="px-4 py-3 text-teal-600 dark:text-teal-300">No medical records</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-teal-50 dark:bg-slate-800">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Date</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Doctor</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-800 dark:text-slate-200">Diagnosis</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientRecords.map((r) => (
                              <tr key={r._id} className="border-t border-teal-100 dark:border-slate-700">
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{new Date(r.createdAt).toLocaleDateString()}</td>
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{r.doctor?.name}</td>
                                <td className="px-3 py-2 max-w-[200px] truncate text-slate-800 dark:text-slate-200" title={r.diagnosis}>{r.diagnosis}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
