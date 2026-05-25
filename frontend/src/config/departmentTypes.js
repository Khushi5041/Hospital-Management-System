/** Matches backend `Department.departmentType` enum values. */
export const DEPARTMENT_TYPES = [
  { value: 'emergency_trauma', label: 'Emergency & Trauma' },
  { value: 'internal_medicine', label: 'Internal / General Medicine' },
  { value: 'surgery_orthopedics', label: 'Surgery & Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'obstetrics_gynecology', label: 'Obstetrics & Gynecology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'radiology_imaging', label: 'Radiology & Imaging' },
  { value: 'laboratory_pathology', label: 'Laboratory & Pathology' },
  { value: 'outpatient_primary', label: 'Outpatient / Primary Care' },
  { value: 'icu_critical_care', label: 'ICU & Critical Care' },
  { value: 'psychiatry_mental_health', label: 'Psychiatry & Mental Health' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'administration_support', label: 'Administration & Support' },
  { value: 'other', label: 'Other' },
];

export function departmentTypeLabel(value) {
  if (!value) return '—';
  return DEPARTMENT_TYPES.find((t) => t.value === value)?.label || value;
}
