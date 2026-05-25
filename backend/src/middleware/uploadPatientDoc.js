import fs from 'fs';
import path from 'path';
import multer from 'multer';

const dir = path.join(process.cwd(), 'uploads', 'patient-docs');

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safe}`);
  },
});

const filter = (_, file, cb) => {
  if (/^(image\/(jpeg|png|webp)|application\/pdf)$/i.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF or JPEG/PNG/WebP images are allowed'));
};

export const uploadPatientDocument = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: filter,
});
