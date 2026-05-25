import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/** Builds safe JSON; pass user from `.select('+password')` to compute hasPassword. */
const toPublicUser = (user) => {
  const o = user?.toObject ? user.toObject() : { ...user };
  const hasPassword = Boolean(o.password);
  delete o.password;
  return {
    _id: o._id,
    name: o.name,
    email: o.email,
    role: o.role,
    profilePic: o.profilePic || '',
    authProvider: o.authProvider || 'local',
    hasPassword,
  };
};

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const profilePic = req.file ? `/uploads/profiles/${req.file.filename}` : '';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      profilePic,
      authProvider: 'local',
    });

    if (user.role === 'patient') {
      const patientExists = await Patient.findOne({ email: user.email });
      if (!patientExists) {
        await Patient.create({
          name: user.name,
          email: user.email,
          phone: '',
          status: 'active',
        });
      }
    }

    const saved = await User.findById(user._id).select('+password');
    res.status(201).json({
      ...toPublicUser(saved),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.password)
      return res.status(400).json({
        message: 'This account uses Google sign-in. Please continue with Google.',
      });
    if (!(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const fresh = await User.findById(user._id).select('+password');
    res.json({
      ...toPublicUser(fresh),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: 'Google sign-in is not configured on the server' });
    }

    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ message: 'Invalid Google token' });

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || '';

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.profilePic) user.profilePic = picture;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        profilePic: picture,
        role: 'patient',
      });
      const patientExists = await Patient.findOne({ email });
      if (!patientExists) {
        await Patient.create({
          name,
          email,
          phone: '',
          status: 'active',
        });
      }
    }

    const fresh = await User.findById(user._id).select('+password');
    res.json({
      ...toPublicUser(fresh),
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const u = await User.findById(req.user._id).select('+password');
    if (!u) return res.status(401).json({ message: 'User not found' });
    res.json(toPublicUser(u));
  } catch (error) {
    next(error);
  }
};

export const patchProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name === undefined || name === null || !String(name).trim()) {
      return res.status(400).json({ message: 'Please provide a valid name' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = String(name).trim();
    await user.save();
    if (user.role === 'patient') {
      await Patient.updateOne({ email: user.email }, { $set: { name: user.name } });
    }
    const fresh = await User.findById(user._id).select('+password');
    res.json(toPublicUser(fresh));
  } catch (error) {
    next(error);
  }
};

export const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image file' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.profilePic = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    const fresh = await User.findById(user._id).select('+password');
    res.json(toPublicUser(fresh));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      user.password = newPassword;
      await user.save();
      return res.json({
        message: 'Password set successfully. You can sign in with email and password or continue with Google.',
      });
    }

    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/** Permanently removes the authenticated user from MongoDB. */
export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, confirmEmail } = req.body;

    if (user.password) {
      if (!password) return res.status(400).json({ message: 'Enter your password to delete your account' });
      if (!(await user.matchPassword(password))) {
        return res.status(400).json({ message: 'Password is incorrect' });
      }
    } else {
      const expect = user.email?.toLowerCase();
      const got = String(confirmEmail || '').trim().toLowerCase();
      if (!got || got !== expect) {
        return res.status(400).json({ message: 'Type your account email exactly to confirm deletion' });
      }
    }

    if (user.profilePic && /^\/uploads\/profiles\//.test(user.profilePic)) {
      try {
        const rel = user.profilePic.replace(/^\//, '');
        const fp = path.join(process.cwd(), rel);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch (_) {
        /* ignore missing file */
      }
    }

    await User.findByIdAndDelete(user._id);
    res.json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};
