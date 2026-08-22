import { useEffect, useState, useCallback } from 'react';
import { Search, X, Plus, Wallet, LoaderCircle, UserX, UserCheck } from 'lucide-react';
import api, { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { SEMESTERS, getCurrentAcademicYear } from '../../utils/constants';
import { StatusBadge } from '../shared/StatusBadge';
import LoadingSpinner from '../shared/LoadingSpinner';

const formatGHS = (amount) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);

function StudentDetailModal({ studentId, onClose, canManage, onStudentUpdated }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeForm, setFeeForm] = useState({
    academicYear: getCurrentAcademicYear(),
    semester: 'Semester 1',
    totalFees: '',
    dueDate: '',
  });
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  const loadStudent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/users/${studentId}`);
      setStudent(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!feeForm.totalFees) return;
    setBusy(true);
    try {
      await api.post(`/users/${studentId}/fees`, feeForm);
      setShowFeeForm(false);
      setFeeForm({ academicYear: getCurrentAcademicYear(), semester: 'Semester 1', totalFees: '', dueDate: '' });
      await loadStudent();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRecordPayment = async (feeId) => {
    const amount = paymentDrafts[feeId];
    if (!amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      await api.post(`/users/${studentId}/fees/${feeId}/payments`, {
        amount: Number(amount),
        method: 'Mobile Money',
      });
      setPaymentDrafts((d) => ({ ...d, [feeId]: '' }));
      await loadStudent();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async () => {
    setBusy(true);
    try {
      const { data } = await api.put(`/users/${studentId}`, { isActive: !student.isActive });
      setStudent((s) => ({ ...s, isActive: data.data.isActive }));
      onStudentUpdated?.(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-raised sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy-900">Student Record</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading student" />
        ) : error && !student ? (
          <p className="py-8 text-center text-sm text-danger-600">{error}</p>
        ) : (
          student && (
            <div className="mt-5 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-navy-100 p-4">
                <div>
                  <p className="font-semibold text-navy-900">{student.name}</p>
                  <p className="text-sm text-navy-400">{student.email}</p>
                  <p className="mt-1 text-sm text-navy-500">
                    {student.indexNumber} &middot; {student.program || 'No program set'} &middot; Level{' '}
                    {student.level}
                  </p>
                  <p className="text-sm text-navy-500">{student.department || 'No department set'}</p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleToggleActive}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      student.isActive
                        ? 'bg-danger-50 text-danger-600 hover:bg-danger-50/80'
                        : 'bg-success-50 text-success-600 hover:bg-success-50/80'
                    }`}
                  >
                    {student.isActive ? (
                      <>
                        <UserX className="h-3.5 w-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" /> Reactivate
                      </>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
                  {error}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-navy-900">
                    <Wallet className="h-4 w-4" /> Fee Records
                  </h4>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowFeeForm((v) => !v)}
                      className="flex items-center gap-1 text-xs font-semibold text-navy-600 hover:text-gold-600"
                    >
                      <Plus className="h-3.5 w-3.5" /> New fee record
                    </button>
                  )}
                </div>

                {showFeeForm && (
                  <form
                    onSubmit={handleAddFee}
                    className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-navy-100 bg-navy-50 p-4 sm:grid-cols-4"
                  >
                    <input
                      value={feeForm.academicYear}
                      onChange={(e) => setFeeForm((f) => ({ ...f, academicYear: e.target.value }))}
                      placeholder="2025/2026"
                      className="input-field col-span-1 !py-2 text-xs"
                      required
                    />
                    <select
                      value={feeForm.semester}
                      onChange={(e) => setFeeForm((f) => ({ ...f, semester: e.target.value }))}
                      className="input-field col-span-1 !py-2 text-xs"
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={feeForm.totalFees}
                      onChange={(e) => setFeeForm((f) => ({ ...f, totalFees: e.target.value }))}
                      placeholder="Total fees (GHS)"
                      className="input-field col-span-1 !py-2 text-xs"
                      required
                    />
                    <button type="submit" disabled={busy} className="btn-gold col-span-1 !py-2 text-xs">
                      {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </button>
                  </form>
                )}

                <div className="mt-3 space-y-3">
                  {(!student.feeRecords || student.feeRecords.length === 0) && (
                    <p className="py-4 text-center text-sm text-navy-400">No fee records yet.</p>
                  )}
                  {student.feeRecords?.map((r) => (
                    <div key={r._id} className="rounded-lg border border-navy-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-navy-900">
                          {r.semester} &middot; {r.academicYear}
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="mt-1 text-sm text-navy-500">
                        {formatGHS(r.amountPaid)} of {formatGHS(r.totalFees)} paid &middot; Balance{' '}
                        {formatGHS(r.balance)}
                      </p>
                      {canManage && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentDrafts[r._id] || ''}
                            onChange={(e) =>
                              setPaymentDrafts((d) => ({ ...d, [r._id]: e.target.value }))
                            }
                            placeholder="Record payment (GHS)"
                            className="input-field !py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRecordPayment(r._id)}
                            className="btn-secondary !py-1.5 text-xs"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function ManageStudents() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users', {
        params: { role: 'student', search: search || undefined, page, limit: 10 },
      });
      setStudents(data.data);
      setPages(data.pages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const debounce = setTimeout(loadStudents, 300);
    return () => clearTimeout(debounce);
  }, [loadStudents]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, email or index number"
          className="input-field pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading students" />
        ) : students.length === 0 ? (
          <p className="py-12 text-center text-sm text-navy-400">No student records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Index No.</th>
                  <th className="px-5 py-3 font-semibold">Program</th>
                  <th className="px-5 py-3 font-semibold">Level</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {students.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() => setSelectedId(s._id)}
                    className="cursor-pointer hover:bg-navy-50"
                  >
                    <td className="px-5 py-3.5 font-medium text-navy-900">{s.name}</td>
                    <td className="px-5 py-3.5 text-navy-500">{s.indexNumber}</td>
                    <td className="px-5 py-3.5 text-navy-500">{s.program || '—'}</td>
                    <td className="px-5 py-3.5 text-navy-500">{s.level}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          s.isActive
                            ? 'bg-success-50 text-success-600'
                            : 'bg-danger-50 text-danger-600'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-navy-100 px-5 py-3">
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

      {selectedId && (
        <StudentDetailModal
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
          canManage={isAdmin}
          onStudentUpdated={loadStudents}
        />
      )}
    </div>
  );
}
