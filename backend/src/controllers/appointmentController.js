import Appointment from '../models/Appointment.js';
import { findPatientForUser } from '../utils/patientAccess.js';

const isStaff = (user) => user && ['admin', 'staff', 'doctor'].includes(user.role);

export const getAppointments = async (req, res, next) => {
  try {
    const { patient, doctor, date, status } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me) return res.json([]);
      filter.patient = me._id;
    } else {
      if (patient) filter.patient = patient;
    }

    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;

    // Patient requests are often `pending` with no `date` yet. A plain `date` range
    // excludes those documents in MongoDB, so they vanished whenever staff filtered by day.
    if (date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      const dayRange = { $gte: d, $lt: end };
      const dateScope = {
        $or: [
          { date: dayRange },
          { status: 'pending', preferredDate: dayRange },
          {
            status: 'pending',
            $or: [{ preferredDate: { $exists: false } }, { preferredDate: null }],
          },
        ],
      };
      filter.$and = [...(filter.$and || []), dateScope];
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('preferredDoctor', 'name specialization')
      .populate('department', 'name')
      .sort({ date: 1, timeSlot: 1, createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth')
      .populate('doctor', 'name specialization consultationFee')
      .populate('preferredDoctor', 'name specialization')
      .populate('department', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me || String(appointment.patient?._id || appointment.patient) !== String(me._id)) {
        return res.status(403).json({ message: 'Not allowed' });
      }
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me) return res.status(400).json({ message: 'No patient profile linked to your account' });

      const { department, preferredDoctor, preferredDate, patientNotes, type } = req.body;
      const pending = await Appointment.create({
        patient: me._id,
        status: 'pending',
        department: department || undefined,
        preferredDoctor: preferredDoctor || undefined,
        preferredDate: preferredDate ? new Date(preferredDate) : undefined,
        patientNotes: patientNotes || '',
        type: type || 'consultation',
      });
      await pending.populate(['patient', 'department', 'preferredDoctor']);
      return res.status(201).json(pending);
    }

    if (!isStaff(req.user)) return res.status(403).json({ message: 'Not allowed' });

    const appointment = await Appointment.create(req.body);
    await appointment.populate(['patient', 'doctor', 'department', 'preferredDoctor']);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

async function assertSlotFree(doctorId, date, timeSlot, excludeId) {
  if (!doctorId || !date || !timeSlot) return;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setDate(end.getDate() + 1);
  const q = {
    doctor: doctorId,
    date: { $gte: d, $lt: end },
    timeSlot,
    status: 'scheduled',
  };
  if (excludeId) q._id = { $ne: excludeId };
  const clash = await Appointment.findOne(q);
  if (clash) {
    const err = new Error('That time slot is no longer available for this doctor');
    err.statusCode = 409;
    throw err;
  }
}

export const updateAppointment = async (req, res, next) => {
  try {
    const existing = await Appointment.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient') {
      const me = await findPatientForUser(req.user);
      if (!me || String(existing.patient) !== String(me._id)) {
        return res.status(403).json({ message: 'Not allowed' });
      }
      const keys = Object.keys(req.body).filter((k) => req.body[k] !== undefined && req.body[k] !== '');
      if (keys.length !== 1 || keys[0] !== 'status' || req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'Patients may only cancel appointments' });
      }
      if (!['pending', 'scheduled'].includes(existing.status)) {
        return res.status(400).json({ message: 'This appointment cannot be cancelled' });
      }
      existing.status = 'cancelled';
      await existing.save();
      await existing.populate(['patient', 'doctor', 'department', 'preferredDoctor']);
      return res.json(existing);
    }

    if (!isStaff(req.user)) return res.status(403).json({ message: 'Not allowed' });

    const nextStatus = req.body.status ?? existing.status;
    const nextDoctor = req.body.doctor ?? existing.doctor;
    const nextDate = req.body.date !== undefined ? req.body.date : existing.date;
    const nextSlot = req.body.timeSlot ?? existing.timeSlot;

    if (nextStatus !== 'pending' && nextDoctor && nextDate && nextSlot) {
      await assertSlotFree(nextDoctor, nextDate, nextSlot, existing._id);
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('preferredDoctor', 'name specialization')
      .populate('department', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    if (error.statusCode === 409) return res.status(409).json({ message: error.message });
    next(error);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment removed' });
  } catch (error) {
    next(error);
  }
};
