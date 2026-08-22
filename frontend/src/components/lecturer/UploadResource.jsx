import { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import api, { getErrorMessage } from '../../api/axios';
import { RESOURCE_TYPES, SEMESTERS, LEVELS } from '../../utils/constants';

const initialForm = {
  title: '',
  description: '',
  courseCode: '',
  courseName: '',
  resourceUrl: '',
  resourceType: 'Lecture Slides',
  department: '',
  level: '100',
  semester: 'Semester 1',
};

export default function UploadResource({ onClose, onUploaded }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.courseCode || !form.courseName || !form.resourceUrl || !form.department) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/materials', form);
      onUploaded(data.data);
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
          <h3 className="font-display text-lg font-bold text-navy-900">Upload Course Material</h3>
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
              placeholder="e.g. Week 4 Lecture Slides - Data Structures"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Course code
              </label>
              <input
                name="courseCode"
                value={form.courseCode}
                onChange={handleChange}
                placeholder="CSM 261"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Resource type
              </label>
              <select
                name="resourceType"
                value={form.resourceType}
                onChange={handleChange}
                className="input-field"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">Course name</label>
            <input
              name="courseName"
              value={form.courseName}
              onChange={handleChange}
              placeholder="e.g. Data Structures & Algorithms"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
              Resource link
            </label>
            <input
              name="resourceUrl"
              type="url"
              value={form.resourceUrl}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
              className="input-field"
              required
            />
            <p className="mt-1 text-xs text-navy-300">
              Link to a Google Drive, OneDrive, or other shared file.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Computer Science"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">Level</label>
              <select name="level" value={form.level} onChange={handleChange} className="input-field">
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
                <option value="All">All</option>
              </select>
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
              Description (optional)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Any extra context for students"
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-gold flex-1">
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
