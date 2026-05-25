import fs from 'fs';
import path from 'path';
import multer from 'multer';

const profilesDir = path.join(process.cwd(), 'uploads', 'profiles');

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    fs.mkdirSync(profilesDir, { recursive: true });
    cb(null, profilesDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const imageFilter = (_, file, cb) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
  }
};

export const uploadProfilePic = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});
