import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { DEPARTMENT_TYPES, departmentTypeLabel } from '../config/departmentTypes';

const inputClass =
  'w-full px-3 py-2.5 border border-teal-200 dark:border-slate-600 rounded-lg text-teal-900 dark:text-teal-50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
const labelClass = 'block font-medium text-sm text-teal-900 dark:text-teal-100 mb-1.5';
const formGroup = 'mb-4';

function Badge({ status }) {
  const map = { active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    departmentType: 'outpatient_primary',
    headOfDepartment: '',
    floor: '',
    contactExtension: '',
    status: 'active',
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.departmentType = typeFilter;
      const [depRes, docRes] = await Promise.all([
        api.get('/departments', { params }),
        api.get('/doctors', { params: { status: 'active' } }),
      ]);
      setDepartments(Array.isArray(depRes.data) ? depRes.data : []);
      setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search, statusFilter, typeFilter]);

  const openAdd = () => {
    setForm({
      name: '',
      description: '',
      departmentType: 'outpatient_primary',
      headOfDepartment: '',
      floor: '',
      contactExtension: '',
      status: 'active',
    });
    setModal('add');
  };

  const openEdit = (d) => {
    setForm({
      name: d.name,
      description: d.description || '',
      departmentType: d.departmentType || 'outpatient_primary',
      headOfDepartment: d.headOfDepartment?._id || d.headOfDepartment || '',
      floor: d.floor || '',
      contactExtension: d.contactExtension || '',
      status: d.status || 'active',
    });
    setModal({ type: 'edit', id: d._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      headOfDepartment: form.headOfDepartment || undefined,
      departmentType: form.departmentType || 'outpatient_primary',
    };
    try {
      if (modal === 'add') {
        await api.post('/departments', payload);
        toast.success('Department added');
      } else {
        await api.put(`/departments/${modal.id}`, payload);
        toast.success('Department updated');
      }
      setModal(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department removed');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-900 dark:text-teal-100">Departments</h1>
          <p className="text-teal-700 dark:text-teal-300 text-sm mt-1">
            Organize clinical and support units. Classify each department by <strong>type</strong>, then optionally assign a{' '}
            <strong>head of department</strong> from active doctors.
          </p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>+ Add Department</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-teal-200 dark:border-slate-600 p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="text" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className={`flex-1 min-w-[200px] ${inputClass}`} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`min-w-[220px] max-w-[280px] ${inputClass}`} aria-label="Filter by department type">
            <option value="">All department types</option>
            {DEPARTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-[140px] ${inputClass}`}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-teal-200 dark:border-slate-600">
          {loading ? (
            <p className="py-8 text-center text-teal-600 dark:text-teal-300">Loading...</p>
          ) : departments.length === 0 ? (
            <div className="text-center py-12 px-8 text-teal-700 dark:text-teal-200">
              <p>No departments found.</p>
              <button type="button" className="mt-4 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>Add first department</button>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Description</th>
                  <th className="text-left px-4 py-3 font-semibold">Head</th>
                  <th className="text-left px-4 py-3 font-semibold">Floor</th>
                  <th className="text-left px-4 py-3 font-semibold">Extension</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/80">
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">{d.name}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-teal-900 dark:text-teal-200 text-xs max-w-[160px]">{departmentTypeLabel(d.departmentType)}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 max-w-[200px] text-slate-800 dark:text-slate-200">{d.description ? (d.description.length > 50 ? d.description.slice(0, 50) + '…' : d.description) : '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.headOfDepartment?.name ? `${d.headOfDepartment.name} (${d.headOfDepartment.specialization})` : '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.floor || '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{d.contactExtension || '-'}</td>
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-teal-200/80 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-teal-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-teal-900 dark:text-teal-100">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h2>
              <button type="button" className="text-2xl leading-none text-teal-900 dark:text-teal-100 hover:opacity-70" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5">
                <div className={formGroup}>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cardiology" required />
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Department type *</label>
                  <select
                    className={inputClass}
                    value={form.departmentType}
                    onChange={(e) => setForm({ ...form, departmentType: e.target.value })}
                    required
                  >
                    {DEPARTMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-teal-700/90 dark:text-teal-300/90 mt-1.5">Choose the closest clinical or operational category for this unit.</p>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Description</label>
                  <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Head of department</label>
                  <select className={inputClass} value={form.headOfDepartment} onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}>
                    <option value="">None — assign later</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} — {doc.specialization}
                      </option>
                    ))}
                  </select>
                  {doctors.length === 0 ? (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                      No <strong>active</strong> doctors in the directory yet, so this list is empty. Add physicians under{' '}
                      <Link to="/doctors" className="font-semibold text-teal-800 dark:text-teal-300 underline hover:text-teal-900 dark:hover:text-teal-200">
                        Doctors
                      </Link>{' '}
                      (status must be <strong>active</strong>), then return here to pick a head.
                    </p>
                  ) : (
                    <p className="text-xs text-teal-700/80 dark:text-teal-300/80 mt-1.5">Only active doctors are listed.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Floor</label>
                    <input className={inputClass} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. 2nd" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Contact extension</label>
                    <input className={inputClass} value={form.contactExtension} onChange={(e) => setForm({ ...form, contactExtension: e.target.value })} placeholder="e.g. 234" />
                  </div>
                </div>
                {modal !== 'add' && (
                  <div className={formGroup}>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
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
