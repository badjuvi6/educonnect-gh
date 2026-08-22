import { STATUS_STYLES, PRIORITY_STYLES } from '../../utils/constants';

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-navy-100 text-navy-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || 'bg-navy-100 text-navy-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {priority}
    </span>
  );
}
