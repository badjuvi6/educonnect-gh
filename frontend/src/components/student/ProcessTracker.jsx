import { FileText, Calendar, X } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

export default function ProcessTracker({ processes = [], compact = false, onWithdraw }) {
  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <FileText className="h-8 w-8 text-navy-200" strokeWidth={1.5} />
        <p className="text-sm text-navy-400">No process requests yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {processes.map((p) => (
        <li key={p._id} className="rounded-lg border border-navy-100 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-navy-900">{p.type}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-400">
                <Calendar className="h-3.5 w-3.5" />
                {p.academicYear} &middot; {p.semester}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={p.status} />
              {onWithdraw && p.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => onWithdraw(p._id)}
                  className="rounded-md p-1 text-navy-300 hover:bg-danger-50 hover:text-danger-500"
                  aria-label="Withdraw request"
                  title="Withdraw request"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {!compact && p.description && (
            <p className="mt-2.5 text-sm text-navy-500">{p.description}</p>
          )}

          {!compact && p.remarks && (
            <div className="mt-2.5 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">
              <span className="font-semibold">Remarks: </span>
              {p.remarks}
            </div>
          )}

          <p className="mt-2.5 text-xs text-navy-300">
            Submitted {new Date(p.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
