import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  BookOpen,
  Megaphone,
  ArrowRight,
  Check,
  X as XIcon,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, pending: 0, materials: 0, announcements: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, pendingRes, materialsRes, announcementsRes] = await Promise.all([
        api.get('/users', { params: { role: 'student', limit: 1 } }),
        api.get('/process', { params: { status: 'Pending', limit: 6 } }),
        api.get('/materials', { params: { limit: 1 } }),
        api.get('/announcements', { params: { limit: 1 } }),
      ]);

      setStats({
        students: studentsRes.data.total,
        pending: pendingRes.data.total,
        materials: materialsRes.data.total,
        announcements: announcementsRes.data.total,
      });
      setPendingRequests(pendingRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickAction = async (id, status) => {
    setActioning(id);
    try {
      await api.put(`/process/${id}`, { status });
      setPendingRequests((prev) => prev.filter((p) => p._id !== id));
      setStats((s) => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioning(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading dashboard" />;

  const statCards = [
    { label: 'Students', value: stats.students, icon: Users, to: '/dashboard/students' },
    { label: 'Pending Requests', value: stats.pending, icon: ClipboardList, to: '/dashboard/processes' },
    { label: 'Course Materials', value: stats.materials, icon: BookOpen, to: '/dashboard/materials' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, to: '/dashboard/announcements' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm capitalize text-navy-400">
          {user.role} {user.department ? `· ${user.department}` : ''}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="card p-4 transition hover:border-gold-400/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-xs text-navy-400">{label}</p>
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">
            Requests Needing Action
          </h3>
          <Link
            to="/dashboard/processes"
            className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-gold-600"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="py-10 text-center text-sm text-navy-400">
            No pending requests right now. You&apos;re all caught up.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-navy-100">
            {pendingRequests.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {p.student?.name}{' '}
                    <span className="font-normal text-navy-400">
                      &middot; {p.student?.indexNumber}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    {p.type} &middot; {p.academicYear}, {p.semester}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actioning === p._id}
                    onClick={() => handleQuickAction(p._id, 'Approved')}
                    className="flex items-center gap-1 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-600 hover:bg-success-50/80 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={actioning === p._id}
                    onClick={() => handleQuickAction(p._id, 'Rejected')}
                    className="flex items-center gap-1 rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50/80 disabled:opacity-50"
                  >
                    <XIcon className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
