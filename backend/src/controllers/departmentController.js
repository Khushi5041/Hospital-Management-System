import Department from '../models/Department.js';

export const getDepartments = async (req, res, next) => {
  try {
    const { search, status, departmentType } = req.query;
    const filter = {};
    if (search) filter.name = new RegExp(search, 'i');
    if (status) filter.status = status;
    if (departmentType) filter.departmentType = departmentType;
    const departments = await Department.find(filter).populate('headOfDepartment', 'name specialization').sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('headOfDepartment', 'name specialization email phone');
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') return res.status(403).json({ message: 'Not allowed' });
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department removed' });
  } catch (error) {
    next(error);
  }
};
