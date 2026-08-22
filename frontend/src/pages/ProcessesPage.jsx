import { useCallback, useEffect, useState } from 'react';
import { Plus, X, LoaderCircle, Filter } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  PROCESS_TYPES,
  PROCESS_STATUSES,
  SEMESTERS,
  getCurrentAcademicYear,
} from '../utils/constants';
import { StatusBadge } from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ProcessTracker from '../components/student/ProcessTracker';

const newRequestInitial = {
  type: PROCESS_TYPES[0],
  academicYear: getCurrentAcademicYear(),
  semester: 'Semester 1',
  description: '',
};

function NewRequestModal({ onClose, onCreated }) {
  const [form, setForm] = useState(newRequestInitial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/process', form);
      onCreated(data.data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-raised sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">New Process Request</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">Request type</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              {PROCESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Academic year
              </label>
              <input
                name="academicYear"
                value={form.academicYear}
                onChange={handleChange}
                placeholder="2025/2026"
                pattern="\d{4}/\d{4}"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Semester</label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
                className="input-field"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Additional details (optional)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add any context the reviewer should know"
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-gold flex-1">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffProcessRow({ process, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(process.status);
  const [remarks, setRemarks] = useState(process.remarks || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/process/${process._id}`, { status, remarks });
      onUpdated(data.data);
      setExpanded(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-lg border border-navy-100 p-4">
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="text-sm font-semibold text-navy-900">
            {process.student?.name}{' '}
            <span className="font-normal text-navy-400">&middot; {process.student?.indexNumber}</span>
          </p>
          <p className="mt-0.5 text-xs text-navy-400">
            {process.type} &middot; {process.academicYear}, {process.semester}
          </p>
        </div>
        <StatusBadge status={process.status} />
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-navy-100 pt-4">
          {process.description && (
            <p className="text-sm text-navy-500">
              <span className="font-semibold text-navy-700">Student note: </span>
              {process.description}
            </p>
          )}
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field !py-2 text-sm"
            >
              {PROCESS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy-500">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="input-field resize-none !py-2 text-sm"
              placeholder="Optional note visible to the student"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn-primary w-full !py-2 text-sm"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </button>
        </div>
      )}
    </li>
  );
}

export default function ProcessesPage() {
  const { user } = useAuth();
  const isStaff = user.role !== 'student';

  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/process', {
        params: { status: statusFilter || undefined, page, limit: 10 },
      });
      setProcesses(data.data);
      setPages(data.pages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleWithdraw = async (id) => {
    try {
      await api.delete(`/process/${id}`);
      setProcesses((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdated = (updated) => {
    setProcesses((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            {isStaff ? 'Process Requests' : 'My Process Requests'}
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            {isStaff
              ? 'Review and action student academic process requests.'
              : 'Submit and track your registration, clearance and other requests.'}
          </p>
        </div>
        {!isStaff && (
          <button type="button" onClick={() => setShowNewModal(true)} className="btn-gold">
            <Plus className="h-4 w-4" /> New request
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-navy-300" />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="input-field w-auto !py-2 text-sm"
        >
          <option value="">All statuses</option>
          {PROCESS_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <div className="card p-6">
        {loading ? (
          <LoadingSpinner label="Loading requests" />
        ) : isStaff ? (
          processes.length === 0 ? (
            <p className="py-10 text-center text-sm text-navy-400">No requests found.</p>
          ) : (
            <ul className="space-y-3">
              {processes.map((p) => (
                <StaffProcessRow key={p._id} process={p} onUpdated={handleUpdated} />
              ))}
            </ul>
          )
        ) : (
          <ProcessTracker processes={processes} onWithdraw={handleWithdraw} />
        )}

        {pages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-navy-100 pt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm font-medium text-navy-500 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-navy-400">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm font-medium text-navy-500 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewRequestModal
          onClose={() => setShowNewModal(false)}
          onCreated={(created) => setProcesses((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
