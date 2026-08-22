import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import api, { getErrorMessage } from '../../api/axios';
import { ANNOUNCEMENT_AUDIENCES, PRIORITIES } from '../../utils/constants';

const initialForm = {
  title: '',
  content: '',
  audience: 'All',
  department: '',
  priority: 'Normal',
};

export default function BroadcastNotice({ onClose, onPosted }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.content) {
      setError('Please provide a title and message.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, department: form.department || 'All Departments' };
      const { data } = await api.post('/announcements', payload);
      onPosted(data.data);
      setForm(initialForm);
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
          <h3 className="font-display text-lg font-bold text-navy-900">Broadcast Notice</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50"
          >
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
            <label className="mb-1.5 block text-sm font-medium text-navy-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Mid-semester exams timetable released"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">Message</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={4}
              placeholder="Write the announcement..."
              className="input-field resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Audience</label>
              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
                className="input-field"
              >
                {ANNOUNCEMENT_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="input-field"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Department (optional)
            </label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Leave blank for all departments"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-gold flex-1">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
