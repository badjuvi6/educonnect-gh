import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import api, { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import FeeStatusCard from './FeeStatusCard';
import ProcessTracker from './ProcessTracker';
import AnnouncementsFeed from '../shared/AnnouncementsFeed';

const STAT_CONFIG = [
  { key: 'Pending', label: 'Pending', icon: Clock, tone: 'text-warning-600 bg-warning-50' },
  { key: 'In Review', label: 'In Review', icon: Eye, tone: 'text-navy-700 bg-navy-100' },
  { key: 'Approved', label: 'Approved', icon: CheckCircle2, tone: 'text-success-600 bg-success-50' },
  { key: 'Rejected', label: 'Rejected', icon: XCircle, tone: 'text-danger-600 bg-danger-50' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryRes, announcementsRes] = await Promise.all([
          api.get('/process/dashboard-summary'),
          api.get('/announcements', { params: { limit: 4 } }),
        ]);
        setSummary(summaryRes.data.data);
        setAnnouncements(announcementsRes.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading your dashboard" />;

  if (error) {
    return (
      <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-navy-400">
          {user.program || 'Your program'} &middot; Level {user.level !== 'N/A' ? user.level : '—'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="card p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold text-navy-900">
              {summary?.statusCounts?.[key] ?? 0}
            </p>
            <p className="text-xs text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-navy-900">
                Recent Process Requests
              </h3>
              <Link
                to="/dashboard/processes"
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-gold-600"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4">
              <ProcessTracker processes={summary?.recentProcesses || []} compact />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-navy-900">Announcements</h3>
              <Link
                to="/dashboard/announcements"
                className="flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-gold-600"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-2">
              <AnnouncementsFeed announcements={announcements} compact />
            </div>
          </div>
        </div>

        <div>
          <FeeStatusCard feeRecords={summary?.feeRecords || []} />
        </div>
      </div>
    </div>
  );
}
