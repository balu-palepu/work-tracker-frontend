export const SPECIALTY_OPTIONS = [
  'Frontend',
  'Backend',
  'Full Stack',
  'Mobile',
  'QA',
  'DevOps',
  'UI/UX',
  'Data Engineer',
  'Business Analyst',
  'Project Manager',
  'Other',
];

export const normalizeSpecialtySelection = (selection, otherValue = '') => {
  if (selection === 'Other') {
    return otherValue.trim();
  }
  return selection || '';
};

export const getMemberDesignation = (member) => (
  member?.customTitle
  || member?.speciality
  || member?.specialty
  || member?.user?.customTitle
  || member?.user?.speciality
  || member?.user?.specialty
  || ''
);
