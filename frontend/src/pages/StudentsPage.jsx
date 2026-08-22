import ManageStudents from '../components/lecturer/ManageStudents';

export default function StudentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Student Records</h1>
        <p className="mt-1 text-sm text-navy-400">
          Search student records and manage fee status and account access.
        </p>
      </div>
      <ManageStudents />
    </div>
  );
}
