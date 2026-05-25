import Patient from '../models/Patient.js';

/** Returns the Patient document linked to this user (by email), or null. */
export async function findPatientForUser(user) {
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  return Patient.findOne({ email });
}
