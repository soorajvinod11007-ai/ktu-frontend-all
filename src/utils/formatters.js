export const fmtPct = (n) => (n == null ? '—' : `${Number(n).toFixed(2)}%`);
export const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString());
export const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const gradeBadge = (grade) => {
  if (!grade) return 'badge-default';
  const g = grade.toUpperCase();
  if (['S', 'A+', 'A'].includes(g)) return 'badge-success';
  if (['B+', 'B', 'C+', 'C'].includes(g)) return 'badge-info';
  if (['D'].includes(g)) return 'badge-warning';
  return 'badge-danger';
};

export const statusBadge = (status) => {
  const map = {
    active:            'badge-success',
    completed:         'badge-success',
    passed:            'badge-success',
    pending:           'badge-warning',
    processing:        'badge-warning',
    failed:            'badge-danger',
    error:             'badge-danger',
    inactive:          'badge-default',
    'results pending': 'badge-pending',
    'not uploaded':    'badge-pending',
  };
  return map[status?.toLowerCase()] ?? 'badge-default';
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const RESOURCE_LABELS = {
  users:            'Users',
  programs:         'Programs',
  batches:          'Batches',
  divisions:        'Divisions',
  students:         'Students',
  faculty:          'Faculty',
  subjects:         'Subjects',
  'course-offerings': 'Course Offerings',
  'exam-sessions':  'Exam Sessions',
  results:          'Results',
  'grade-cards':    'Grade Cards',
  'result-history': 'Result History',
  'upload-logs':    'Upload Logs',
};

export const FILE_TYPES = [
  { value: 'student_list',  label: 'Student List' },
  { value: 'course_book',   label: 'Course Book' },
  { value: 'grade_card',    label: 'Grade Card' },
  { value: 'result',        label: 'Result' },
  { value: 'revaluation',   label: 'Revaluation' },
];

export const REPORT_CONFIGS = [
  {
    id: 'course-faculty-performance',
    title: 'Course-wise Faculty Performance',
    icon: 'BarChart2',
    description: 'Pass % per course and faculty for a semester',
    required: ['program_id','batch_id','semester','academic_year'],
    optional: ['division_id'],
    color: 'from-accent/20 to-accent/5',
    accent: '#22C55E',
  },
  {
    id: 'faculty-history',
    title: 'Faculty Performance History',
    icon: 'UserCheck',
    description: 'All-time teaching performance per faculty member',
    required: ['faculty_id'],
    optional: ['academic_year'],
    color: 'from-blue-500/20 to-blue-500/5',
    accent: '#3B82F6',
  },
  {
    id: 'supplementary-status',
    title: 'Supplementary Status',
    icon: 'AlertCircle',
    description: 'Students with pending supplementary exams',
    required: ['program_id','batch_id'],
    optional: ['division_id'],
    color: 'from-amber-500/20 to-amber-500/5',
    accent: '#F59E0B',
  },
  {
    id: 'program-semester',
    title: 'Program & Semester-wise',
    icon: 'Table2',
    description: 'Overall pass statistics across all programs',
    required: ['academic_year'],
    optional: ['program_id'],
    color: 'from-purple-500/20 to-purple-500/5',
    accent: '#A855F7',
  },
  {
    id: 'graduation',
    title: 'Graduation Statistics',
    icon: 'GraduationCap',
    description: 'Batch-wise graduation rates and trends',
    required: [],
    optional: ['batch_id','program_id'],
    color: 'from-pink-500/20 to-pink-500/5',
    accent: '#EC4899',
  },
  {
    id: 'student-performance',
    title: 'Student Performance',
    icon: 'GraduationCap',
    description: 'Semester result, SGPA, CGPA and student grade breakdown',
    required: ['program_id', 'batch_id', 'semester'],
    optional: ['division_id'],
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: '#10B981',
  },
];
