import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayMatchesDoctorSchedule(doctor, date) {
  const d = new Date(date);
  const long = WEEKDAYS[d.getDay()];
  const short = long.slice(0, 3).toLowerCase();
  const days = doctor.availableDays;
  if (!Array.isArray(days) || days.length === 0) return d.getDay() >= 1 && d.getDay() <= 5;
  return days.some((day) => {
    const s = String(day).toLowerCase();
    return long.toLowerCase().includes(s) || s.includes(short) || s === long.toLowerCase();
  });
}

function parseMinutes(t) {
  if (!t || typeof t !== 'string') return 9 * 60;
  const [h, m = '0'] = t.split(':');
  return Number(h) * 60 + Number(m);
}

function toSlot(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Free 30-minute slots for a doctor on a calendar day (based on doctor availability + existing scheduled visits). */
export const getAvailableSlots = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    if (doctor.status !== 'active') return res.json({ slots: [], message: 'Doctor is not active' });

    const dateStr = req.query.date;
    if (!dateStr) return res.status(400).json({ message: 'Query ?date=YYYY-MM-DD is required' });

    const dayDate = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(dayDate.getTime())) return res.status(400).json({ message: 'Invalid date' });

    if (!dayMatchesDoctorSchedule(doctor, dayDate)) {
      return res.json({ slots: [], message: 'Doctor is not available on this day' });
    }

    const startM = parseMinutes(doctor.availableTimeStart || '09:00');
    const endM = parseMinutes(doctor.availableTimeEnd || '17:00');
    const step = 30;
    const all = [];
    for (let t = startM; t + step <= endM; t += step) {
      all.push(toSlot(t));
    }

    const startOfDay = new Date(dayDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const booked = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'scheduled',
      timeSlot: { $exists: true, $nin: [null, ''] },
    }).select('timeSlot');

    const taken = new Set(booked.map((b) => b.timeSlot));
    const slots = all.filter((s) => !taken.has(s));
    res.json({ slots, doctor: { name: doctor.name, specialization: doctor.specialization } });
  } catch (error) {
    next(error);
  }
};

export const getDoctors = async (req, res, next) => {
  try {
    const { search, specialization, status } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (status) filter.status = status;
    else if (req.user?.role === 'patient') filter.status = 'active';
    const doctors = await Doctor.find(filter).populate('department', 'name').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('department', 'name');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor removed' });
  } catch (error) {
    next(error);
  }
};
