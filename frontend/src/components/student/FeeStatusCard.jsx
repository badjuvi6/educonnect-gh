import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge';

const formatGHS = (amount) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount || 0);

function FeeRecord({ record }) {
  const [expanded, setExpanded] = useState(false);
  const percentPaid = record.totalFees
    ? Math.min(100, Math.round((record.amountPaid / record.totalFees) * 100))
    : 0;

  return (
    <div className="rounded-lg border border-navy-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">
            {record.semester} &middot; {record.academicYear}
          </p>
          <p className="mt-0.5 text-xs text-navy-400">
            Due {record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-GB') : '—'}
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full rounded-full bg-gold-400 transition-all"
          style={{ width: `${percentPaid}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-navy-500">
          {formatGHS(record.amountPaid)} of {formatGHS(record.totalFees)} paid
        </span>
        <span className="font-semibold text-navy-900">
          Bal: {formatGHS(record.balance)}
        </span>
      </div>

      {record.paymentHistory?.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-navy-800"
          >
            {expanded ? 'Hide' : 'Show'} payment history
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5 border-t border-navy-100 pt-2">
              {record.paymentHistory.map((p, i) => (
                <li key={i} className="flex justify-between text-xs text-navy-500">
                  <span>
                    {new Date(p.paidAt).toLocaleDateString('en-GB')} &middot; {p.method}
                  </span>
                  <span className="font-medium text-navy-700">{formatGHS(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function FeeStatusCard({ feeRecords = [] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
          <Wallet className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold text-navy-900">Fee Status</h3>
      </div>

      <div className="mt-4 space-y-3">
        {feeRecords.length === 0 ? (
          <p className="py-6 text-center text-sm text-navy-400">
            No fee records available yet. Check back once billing is posted for the semester.
          </p>
        ) : (
          feeRecords.map((r) => <FeeRecord key={r._id} record={r} />)
        )}
      </div>
    </div>
  );
}
