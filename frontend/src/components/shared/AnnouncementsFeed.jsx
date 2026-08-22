import { Megaphone, Clock } from 'lucide-react';
import { PriorityBadge } from './StatusBadge';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AnnouncementsFeed({ announcements, emptyMessage, compact = false }) {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Megaphone className="h-8 w-8 text-navy-200" strokeWidth={1.5} />
        <p className="text-sm text-navy-400">
          {emptyMessage || 'No announcements to show right now.'}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy-100">
      {announcements.map((a) => (
        <li key={a._id} className={compact ? 'py-3' : 'py-4'}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-semibold text-navy-900">{a.title}</h4>
                {a.priority !== 'Normal' && <PriorityBadge priority={a.priority} />}
              </div>
              {!compact && (
                <p className="mt-1 text-sm leading-relaxed text-navy-500">{a.content}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-300">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(a.createdAt)}
                </span>
                <span>&middot;</span>
                <span>{a.postedBy?.name || 'Administration'}</span>
                <span>&middot;</span>
                <span>{a.audience}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
