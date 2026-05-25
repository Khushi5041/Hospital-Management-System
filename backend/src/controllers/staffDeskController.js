import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import VisitQueue from '../models/VisitQueue.js';
import Bed from '../models/Bed.js';
import Bill from '../models/Bill.js';
import EmergencyCase from '../models/EmergencyCase.js';
import StaffMessage from '../models/StaffMessage.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getStats = async (req, res, next) => {
  try {
    const start = startOfToday();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [patientsToday, appointmentsToday, queueWaiting, emergenciesOpen] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Appointment.countDocuments({
        status: { $in: ['scheduled', 'completed'] },
        date: { $gte: start, $lt: end },
      }),
      VisitQueue.countDocuments({ status: 'waiting' }),
      EmergencyCase.countDocuments({ status: 'open' }),
    ]);

    const completedToday = await VisitQueue.find({
      status: 'completed',
      completedAt: { $gte: start, $lt: end },
      calledAt: { $exists: true },
      checkedInAt: { $exists: true },
    }).select('checkedInAt calledAt');

    let waitSum = 0;
    let waitN = 0;
    for (const e of completedToday) {
      if (e.calledAt && e.checkedInAt) {
        waitSum += (new Date(e.calledAt) - new Date(e.checkedInAt)) / 60000;
        waitN += 1;
      }
    }

    const handledToday = await VisitQueue.countDocuments({
      status: { $in: ['completed', 'with_doctor'] },
      updatedAt: { $gte: start, $lt: end },
    });

    res.json({
      patientsRegisteredToday: patientsToday,
      appointmentsToday,
      queueWaiting,
      emergenciesOpen,
      avgWaitMinutesToday: waitN ? Math.round((waitSum / waitN) * 10) / 10 : null,
      visitsHandledToday: handledToday,
    });
  } catch (e) {
    next(e);
  }
};

export const listQueue = async (req, res, next) => {
  try {
    const list = await VisitQueue.find({ status: { $in: ['waiting', 'called', 'with_doctor'] } })
      .populate('patient', 'name phone patientCode walkIn')
      .populate('doctor', 'name specialization')
      .populate('appointment')
      .sort({ checkedInAt: 1 });
    list.sort((a, b) => {
      const au = a.priority === 'urgent' ? 0 : 1;
      const bu = b.priority === 'urgent' ? 0 : 1;
      if (au !== bu) return au - bu;
      return new Date(a.checkedInAt) - new Date(b.checkedInAt);
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
};

export const addQueueEntry = async (req, res, next) => {
  try {
    const { patient, doctor, appointment, chiefComplaint, priority } = req.body;
    if (!patient) return res.status(400).json({ message: 'Patient is required' });
    const p = await Patient.findById(patient);
    if (!p) return res.status(404).json({ message: 'Patient not found' });
    const entry = await VisitQueue.create({
      patient,
      doctor: doctor || undefined,
      appointment: appointment || undefined,
      chiefComplaint: chiefComplaint || '',
      priority: priority === 'urgent' ? 'urgent' : 'normal',
    });
    await entry.populate(['patient', 'doctor', 'appointment']);
    res.status(201).json(entry);
  } catch (e) {
    next(e);
  }
};

export const updateQueueEntry = async (req, res, next) => {
  try {
    const { status, doctor } = req.body;
    const entry = await VisitQueue.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Queue entry not found' });
    if (status === 'called') {
      entry.status = 'called';
      entry.calledAt = new Date();
    } else if (status === 'with_doctor') {
      entry.status = 'with_doctor';
      if (!entry.calledAt) entry.calledAt = new Date();
    } else if (status === 'completed') {
      entry.status = 'completed';
      entry.completedAt = new Date();
    } else if (status === 'cancelled') {
      entry.status = 'cancelled';
    }
    if (doctor) entry.doctor = doctor;
    await entry.save();
    await entry.populate(['patient', 'doctor', 'appointment']);
    res.json(entry);
  } catch (e) {
    next(e);
  }
};

export const listBeds = async (req, res, next) => {
  try {
    const beds = await Bed.find().populate('patient', 'name patientCode').sort({ room: 1, bedLabel: 1 });
    res.json(beds);
  } catch (e) {
    next(e);
  }
};

export const createBed = async (req, res, next) => {
  try {
    const { room, bedLabel, status, notes } = req.body;
    if (!room?.trim() || !bedLabel?.trim()) return res.status(400).json({ message: 'Room and bed label required' });
    const bed = await Bed.create({
      room: room.trim(),
      bedLabel: bedLabel.trim(),
      status: status || 'available',
      notes: notes || '',
    });
    res.status(201).json(bed);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Bed already exists for this room' });
    next(e);
  }
};

export const updateBed = async (req, res, next) => {
  try {
    const { status, patient, notes } = req.body;
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(patient !== undefined && { patient: patient || null }),
        ...(notes !== undefined && { notes }),
      },
      { new: true, runValidators: true }
    ).populate('patient', 'name patientCode');
    if (!bed) return res.status(404).json({ message: 'Bed not found' });
    res.json(bed);
  } catch (e) {
    next(e);
  }
};

export const listBills = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.patient) filter.patient = req.query.patient;
    const bills = await Bill.find(filter)
      .populate('patient', 'name patientCode phone')
      .sort({ createdAt: -1 })
      .limit(100);
    const out = bills.map((b) => {
      const o = b.toObject({ virtuals: true });
      o.total = (b.lines || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
      return o;
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
};

export const createBill = async (req, res, next) => {
  try {
    const { patient, lines, insuranceNote, status } = req.body;
    if (!patient) return res.status(400).json({ message: 'Patient required' });
    if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ message: 'At least one line item' });
    const bill = await Bill.create({
      patient,
      lines: lines.map((l) => ({ description: String(l.description || '').trim(), amount: Number(l.amount) || 0 })),
      insuranceNote: insuranceNote || '',
      status: status === 'draft' ? 'draft' : 'issued',
      createdBy: req.user._id,
    });
    await bill.populate('patient', 'name patientCode');
    const o = bill.toObject({ virtuals: true });
    o.total = bill.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    res.status(201).json(o);
  } catch (e) {
    next(e);
  }
};

export const markBillPaid = async (req, res, next) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true }).populate(
      'patient',
      'name patientCode'
    );
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    const o = bill.toObject({ virtuals: true });
    o.total = bill.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
    res.json(o);
  } catch (e) {
    next(e);
  }
};

export const listEmergencies = async (req, res, next) => {
  try {
    const list = await EmergencyCase.find()
      .populate('assignedDoctor', 'name specialization')
      .populate('patient', 'name patientCode')
      .sort({ createdAt: -1 })
      .limit(80);
    res.json(list);
  } catch (e) {
    next(e);
  }
};

export const createEmergency = async (req, res, next) => {
  try {
    const { callerName, phone, location, chiefComplaint, triageLevel, assignedDoctor, patient, notes } = req.body;
    if (!callerName?.trim() || !chiefComplaint?.trim()) {
      return res.status(400).json({ message: 'Caller name and chief complaint required' });
    }
    const doc = await EmergencyCase.create({
      callerName: callerName.trim(),
      phone: phone || '',
      location: location || '',
      chiefComplaint: chiefComplaint.trim(),
      triageLevel: triageLevel || '3',
      assignedDoctor: assignedDoctor || undefined,
      patient: patient || undefined,
      notes: notes || '',
      loggedBy: req.user._id,
    });
    await doc.populate(['assignedDoctor', 'patient']);
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
};

export const closeEmergency = async (req, res, next) => {
  try {
    const doc = await EmergencyCase.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const notifyDoctor = async (req, res, next) => {
  try {
    const { toDoctor, patient, body, channel } = req.body;
    if (!toDoctor || !body?.trim()) return res.status(400).json({ message: 'Doctor and message required' });
    const msg = await StaffMessage.create({
      toDoctor,
      patient: patient || undefined,
      body: body.trim(),
      channel: ['sms', 'email', 'in_app'].includes(channel) ? channel : 'in_app',
      deliveryStatus: 'logged',
      fromUser: req.user._id,
    });
    await msg.populate(['toDoctor', 'patient', 'fromUser']);
    res.status(201).json({
      ...msg.toObject(),
      note: 'SMS/Email are logged for demo; connect Twilio/SendGrid in production.',
    });
  } catch (e) {
    next(e);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    const list = await StaffMessage.find()
      .populate('toDoctor', 'name specialization')
      .populate('patient', 'name patientCode')
      .populate('fromUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(list);
  } catch (e) {
    next(e);
  }
};
