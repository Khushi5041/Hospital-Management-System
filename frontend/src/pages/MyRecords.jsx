import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HOSPITAL_NAME } from '../config/constants';
import PageHeader from '../components/PageHeader';
import PatientCareBanner from '../components/PatientCareBanner';

export default function MyRecords() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const { data: patients } = await api.get('/patients', { params: { search: user.email } });
        const me = Array.isArray(patients) ? patients.find((p) => p.email?.toLowerCase() === user.email?.toLowerCase()) : null;
        setPatient(me);
        if (me?._id) {
          const { data } = await api.get('/medical-records', { params: { patient: me._id } });
          setRecords(Array.isArray(data) ? data : []);
        } else {
          setRecords([]);
        }
      } catch (_) {
        setPatient(null);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.email]);

  if (loading) {
    return (
      <>
        <PageHeader title="My Medical Records" subtitle={HOSPITAL_NAME} />
        <PatientCareBanner variant="records" />
        <p className="py-12 text-center text-slate-500">Loading...</p>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <PageHeader title="My Medical Records" subtitle={HOSPITAL_NAME} />
        <PatientCareBanner variant="records" />
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-semibold">No patient profile linked</p>
          <p className="text-amber-700 text-sm mt-1">Your account is not linked to a patient record. Contact {HOSPITAL_NAME} to register.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Medical Records" subtitle={`Your care history at ${HOSPITAL_NAME}`} />
      <PatientCareBanner variant="records" />
      <div className="mt-6 space-y-4">
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-10 text-center text-slate-500">No medical records yet.</div>
        ) : (
          records.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                <p className="text-sm font-medium text-slate-800">Dr. {r.doctor?.name} · {r.doctor?.specialization}</p>
              </div>
              <p className="font-medium text-slate-800 mb-2">Diagnosis</p>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{r.diagnosis}</p>
              {r.prescription?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="font-medium text-slate-800 mb-2">Prescription</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {r.prescription.map((p, i) => (
                      <li key={i}>
                        {p.medication} — {p.dosage} {p.duration && `· ${p.duration}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {r.notes && (
                <p className="mt-2 text-sm text-slate-500 italic">{r.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
