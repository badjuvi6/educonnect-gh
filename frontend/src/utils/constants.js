export const PROCESS_TYPES = [
  'Course Registration',
  'Semester Registration',
  'Exams Registration',
  'Re-sit Registration',
  'Transcript Request',
  'Clearance Form',
  'Industrial Attachment',
  'Change of Program',
  'Hostel Application',
  'Other',
];

export const PROCESS_STATUSES = ['Pending', 'In Review', 'Approved', 'Rejected'];

export const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Trimester 1',
  'Trimester 2',
  'Trimester 3',
];

export const LEVELS = ['100', '200', '300', '400', '500'];

export const RESOURCE_TYPES = [
  'Lecture Slides',
  'Past Questions',
  'Handout',
  'Video',
  'Reading List',
  'Other',
];

export const ANNOUNCEMENT_AUDIENCES = [
  'All',
  'Students',
  'Lecturers',
  'Level 100',
  'Level 200',
  'Level 300',
  'Level 400',
];

export const PRIORITIES = ['Normal', 'Important', 'Urgent'];

/** Returns the current Ghanaian academic year in the "YYYY/YYYY" format,
 *  assuming the academic year begins in August. */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 7 = August
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

export const STATUS_STYLES = {
  Pending: 'bg-warning-50 text-warning-600',
  'In Review': 'bg-navy-100 text-navy-700',
  Approved: 'bg-success-50 text-success-600',
  Rejected: 'bg-danger-50 text-danger-600',
  Paid: 'bg-success-50 text-success-600',
  Partial: 'bg-warning-50 text-warning-600',
  Owing: 'bg-danger-50 text-danger-600',
};

export const PRIORITY_STYLES = {
  Normal: 'bg-navy-100 text-navy-700',
  Important: 'bg-warning-50 text-warning-600',
  Urgent: 'bg-danger-50 text-danger-600',
};
