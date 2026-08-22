import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/student/StudentDashboard';
import LecturerDashboard from '../components/lecturer/LecturerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  return user.role === 'student' ? <StudentDashboard /> : <LecturerDashboard />;
}
