import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AnnouncementsFeed from '../components/shared/AnnouncementsFeed';
import BroadcastNotice from '../components/lecturer/BroadcastNotice';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function AnnouncementsPage() {
  const { isStaff } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/announcements', { params: { limit: 30 } });
      setAnnouncements(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Announcements</h1>
          <p className="mt-1 text-sm text-navy-400">Notices from your department and school.</p>
        </div>
        {isStaff && (
          <button type="button" onClick={() => setShowCompose(true)} className="btn-gold">
            <Plus className="h-4 w-4" /> Broadcast notice
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <LoadingSpinner label="Loading announcements" />
        ) : (
          <AnnouncementsFeed announcements={announcements} />
        )}
      </div>

      {showCompose && (
        <BroadcastNotice
          onClose={() => setShowCompose(false)}
          onPosted={(created) => setAnnouncements((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
