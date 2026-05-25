/** Reception / operations desk — staff and admin only (not doctors/patients). */
export const requireStaffDesk = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff desk is only for reception & admin roles' });
  }
  next();
};
