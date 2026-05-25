import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import staffDeskRoutes from './routes/staffDeskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

connectDB();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://hospital-management-system-theta-silk.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/staff-desk', staffDeskRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));