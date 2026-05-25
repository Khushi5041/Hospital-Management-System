import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const inputClass =
  'w-full px-3 py-2.5 border border-teal-200 dark:border-slate-600 rounded-lg text-teal-900 dark:text-teal-50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
const labelClass = 'block font-medium text-sm text-teal-900 dark:text-teal-100 mb-1.5';
const formGroup = 'mb-4';

function Badge({ status }) {
  const map = { active: 'bg-green-100 text-green-800', on_leave: 'bg-amber-100 text-amber-800', inactive: 'bg-red-100 text-red-800' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', specialization: '', department: '', qualification: '', consultationFee: '', availableDays: [], availableTimeStart: '', availableTimeEnd: '', status: 'active',
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [docRes, depRes] = await Promise.all([api.get('/doctors', { params }), api.get('/departments')]);
      setDoctors(docRes.data);
      setDepartments(depRes.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, statusFilter]);

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', specialization: '', department: '', qualification: '', consultationFee: '', availableDays: [], availableTimeStart: '', availableTimeEnd: '', status: 'active' });
    setModal('add');
  };

  const openEdit = (d) => {
    setForm({
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialization: d.specialization || '',
      department: d.department?._id || d.department || '',
      qualification: d.qualification || '',
      consultationFee: d.consultationFee ?? '',
      availableDays: Array.isArray(d.availableDays) ? d.availableDays : [],
      availableTimeStart: d.availableTimeStart || '',
      availableTimeEnd: d.availableTimeEnd || '',
      status: d.status || 'active',
    });
    setModal({ type: 'edit', id: d._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, department: form.department || undefined, consultationFee: Number(form.consultationFee) || 0 };
    try {
      if (modal === 'add') {
        await api.post('/doctors', payload);
        toast.success('Doctor added');
      } else {
        await api.put(`/doctors/${modal.id}`, payload);
        toast.success('Doctor updated');
      }
      setModal(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doctor?')) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast.success('Doctor removed');
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const toggleDay = (day) => {
    const next = form.availableDays.includes(day) ? form.availableDays.filter((x) => x !== day) : [...form.availableDays, day];
    setForm({ ...form, availableDays: next });
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-900 dark:text-teal-100">Doctors</h1>
          <p className="text-teal-700 dark:text-teal-300 text-sm mt-1">Manage doctors and specializations</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>+ Add Doctor</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-teal-200 dark:border-slate-600 p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className={`flex-1 min-w-[200px] ${inputClass}`} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-[140px] ${inputClass}`}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-teal-200 dark:border-slate-600">
          {loading ? (
            <p className="py-8 text-center text-teal-600 dark:text-teal-300">Loading...</p>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12 px-8 text-teal-700 dark:text-teal-200">
              <p>No doctors found.</p>
              <button type="button" className="mt-4 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>Add first doctor</button>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Specialization</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">Fee</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d._id} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/80">
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.name}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.email}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.specialization}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.department?.name || '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.consultationFee ? `₹${d.consultationFee}` : '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700"><Badge status={d.status} /></td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700">
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mr-2" onClick={() => openEdit(d)}>Edit</button>
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(d._id)}>Delete</button>
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto border border-teal-200/80 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-teal-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-teal-900 dark:text-teal-100">{modal === 'add' ? 'Add Doctor' : 'Edit Doctor'}</h2>
              <button type="button" className="text-2xl leading-none text-teal-900 dark:text-teal-100 hover:opacity-70" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                <div className={formGroup}>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Email *</label>
                    <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Phone *</label>
                    <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Specialization *</label>
                    <input className={inputClass} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiology" required />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Department</label>
                    <select className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      <option value="">None</option>
                      {departments.map((dep) => (
                        <option key={dep._id} value={dep._id}>{dep.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Qualification</label>
                    <input className={inputClass} value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MD, MBBS" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Consultation fee (₹)</label>
                    <input type="number" min="0" className={inputClass} value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
                  </div>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Available days</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button key={day} type="button" className={`py-1.5 px-2.5 rounded-lg text-sm font-semibold ${form.availableDays.includes(day) ? 'bg-teal-500 text-white' : 'border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700'}`} onClick={() => toggleDay(day)}>{day}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Time from</label>
                    <input type="time" className={inputClass} value={form.availableTimeStart} onChange={(e) => setForm({ ...form, availableTimeStart: e.target.value })} />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Time to</label>
                    <input type="time" className={inputClass} value={form.availableTimeEnd} onChange={(e) => setForm({ ...form, availableTimeEnd: e.target.value })} />
                  </div>
                </div>
                {modal !== 'add' && (
                  <div className={formGroup}>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="on_leave">On leave</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-teal-200 dark:border-slate-600 flex gap-3 justify-end">
                <button type="button" className="py-2 px-4 rounded-lg font-semibold text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
