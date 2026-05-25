import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: false,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'doctor', 'patient'],
      default: 'staff',
    },
    profilePic: { type: String, default: '' },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model('User', userSchema);
