import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const emptyPrescription = { medication: '', dosage: '', duration: '' };
const inputClass =
  'w-full px-3 py-2.5 border border-teal-200 dark:border-slate-600 rounded-lg text-teal-900 dark:text-teal-50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
const labelClass = 'block font-medium text-sm text-teal-900 dark:text-teal-100 mb-1.5';
const formGroup = 'mb-4';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    patient: '', doctor: '', appointment: '', diagnosis: '', prescription: [emptyPrescription], notes: '',
    vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '' },
    followUpDate: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (patientFilter) params.patient = patientFilter;
      const [recRes, pRes, dRes] = await Promise.all([
        api.get('/medical-records', { params }),
        api.get('/patients'),
        api.get('/doctors'),
      ]);
      setRecords(recRes.data);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (err) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientFilter]);

  const openAdd = () => {
    setForm({
      patient: '', doctor: '', appointment: '', diagnosis: '', prescription: [{ ...emptyPrescription }], notes: '',
      vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '' },
      followUpDate: '',
    });
    setModal('add');
  };

  const openEdit = (r) => {
    const prescription = (r.prescription && r.prescription.length) ? r.prescription.map((p) => ({ medication: p.medication || '', dosage: p.dosage || '', duration: p.duration || '' })) : [emptyPrescription];
    setForm({
      patient: r.patient?._id || r.patient,
      doctor: r.doctor?._id || r.doctor,
      appointment: r.appointment?._id || r.appointment || '',
      diagnosis: r.diagnosis || '',
      prescription,
      notes: r.notes || '',
      vitals: {
        bloodPressure: r.vitals?.bloodPressure || '',
        temperature: r.vitals?.temperature || '',
        pulse: r.vitals?.pulse || '',
        weight: r.vitals?.weight || '',
      },
      followUpDate: r.followUpDate ? new Date(r.followUpDate).toISOString().slice(0, 10) : '',
    });
    setModal({ type: 'edit', id: r._id });
  };

  const addPrescriptionLine = () => {
    setForm((f) => ({ ...f, prescription: [...f.prescription, { ...emptyPrescription }] }));
  };

  const updatePrescription = (index, field, value) => {
    setForm((f) => ({
      ...f,
      prescription: f.prescription.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const removePrescriptionLine = (index) => {
    if (form.prescription.length <= 1) return;
    setForm((f) => ({ ...f, prescription: f.prescription.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      patient: form.patient,
      doctor: form.doctor,
      appointment: form.appointment || undefined,
      diagnosis: form.diagnosis,
      prescription: form.prescription.filter((p) => p.medication || p.dosage || p.duration),
      notes: form.notes,
      vitals: form.vitals,
      followUpDate: form.followUpDate || undefined,
    };
    try {
      if (modal === 'add') {
        await api.post('/medical-records', payload);
        toast.success('Medical record added');
      } else {
        await api.put(`/medical-records/${modal.id}`, payload);
        toast.success('Medical record updated');
      }
      setModal(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medical record?')) return;
    try {
      await api.delete(`/medical-records/${id}`);
      toast.success('Record removed');
      fetchRecords();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-900 dark:text-teal-100">Medical Records</h1>
          <p className="text-teal-700 dark:text-teal-300 text-sm mt-1">Patient diagnosis, prescriptions and vitals</p>
        </div>
        <button type="button" className="inline-flex items-center gap-2 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>+ Add Record</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-teal-200 dark:border-slate-600 p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)} className={`min-w-[220px] ${inputClass}`}>
            <option value="">All patients</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.name} - {p.email}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-teal-200 dark:border-slate-600">
          {loading ? (
            <p className="py-8 text-center text-teal-600 dark:text-teal-300">Loading...</p>
          ) : records.length === 0 ? (
            <div className="text-center py-12 px-8 text-teal-700 dark:text-teal-200">
              <p>No medical records found.</p>
              <button type="button" className="mt-4 py-2 px-4 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600" onClick={openAdd}>Add first record</button>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold">Doctor</th>
                  <th className="text-left px-4 py-3 font-semibold">Diagnosis</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/80">
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{r.patient?.name}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{r.doctor?.name} ({r.doctor?.specialization})</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 max-w-[220px] text-slate-800 dark:text-slate-200">{r.diagnosis ? (r.diagnosis.length > 40 ? r.diagnosis.slice(0, 40) + '…' : r.diagnosis) : '-'}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 border-b border-teal-100 dark:border-slate-700">
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mr-2" onClick={() => openEdit(r)}>Edit</button>
                      <button type="button" className="py-1.5 px-3 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(r._id)}>Delete</button>
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-[560px] w-full max-h-[90vh] overflow-y-auto border border-teal-200/80 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-teal-200 dark:border-slate-600 flex justify-between items-center">
              <h2 className="text-xl font-bold text-teal-900 dark:text-teal-100">{modal === 'add' ? 'Add Medical Record' : 'Edit Medical Record'}</h2>
              <button type="button" className="text-2xl leading-none text-teal-900 dark:text-teal-100 hover:opacity-70" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className={formGroup}>
                    <label className={labelClass}>Patient *</label>
                    <select className={inputClass} value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Doctor *</label>
                    <select className={inputClass} value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
                      <option value="">Select doctor</option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>{d.name} - {d.specialization}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Diagnosis *</label>
                  <textarea className={inputClass} rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className={formGroup}>
                    <label className={labelClass}>BP</label>
                    <input className={inputClass} value={form.vitals.bloodPressure} onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, bloodPressure: e.target.value } })} placeholder="120/80" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Temp</label>
                    <input className={inputClass} value={form.vitals.temperature} onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, temperature: e.target.value } })} placeholder="98.6°F" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Pulse</label>
                    <input className={inputClass} value={form.vitals.pulse} onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, pulse: e.target.value } })} placeholder="72" />
                  </div>
                  <div className={formGroup}>
                    <label className={labelClass}>Weight</label>
                    <input className={inputClass} value={form.vitals.weight} onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, weight: e.target.value } })} placeholder="kg" />
                  </div>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Prescription</label>
                  {form.prescription.map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end mb-2">
                      <input className={inputClass} placeholder="Medication" value={p.medication} onChange={(e) => updatePrescription(i, 'medication', e.target.value)} />
                      <input className={inputClass} placeholder="Dosage" value={p.dosage} onChange={(e) => updatePrescription(i, 'dosage', e.target.value)} />
                      <input className={inputClass} placeholder="Duration" value={p.duration} onChange={(e) => updatePrescription(i, 'duration', e.target.value)} />
                      <button type="button" className="py-2 px-2 rounded-lg border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 disabled:opacity-50" onClick={() => removePrescriptionLine(i)} disabled={form.prescription.length <= 1}>−</button>
                    </div>
                  ))}
                  <button type="button" className="py-2 px-3 rounded-lg font-medium text-sm border border-teal-200 dark:border-slate-600 bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-slate-700 mt-1" onClick={addPrescriptionLine}>+ Add line</button>
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className={formGroup}>
                  <label className={labelClass}>Follow-up date</label>
                  <input type="date" className={inputClass} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
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
