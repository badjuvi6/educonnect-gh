import { useCallback, useEffect, useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { LEVELS, SEMESTERS } from '../utils/constants';
import CourseMaterials from '../components/student/CourseMaterials';
import UploadResource from '../components/lecturer/UploadResource';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function MaterialsPage() {
  const { isStaff } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({ level: '', semester: '', courseCode: '' });

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/materials', {
        params: {
          level: filters.level || undefined,
          semester: filters.semester || undefined,
          courseCode: filters.courseCode || undefined,
          limit: 30,
        },
      });
      setMaterials(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Course Materials</h1>
          <p className="mt-1 text-sm text-navy-400">
            Slides, past questions and handouts, organized by course.
          </p>
        </div>
        {isStaff && (
          <button type="button" onClick={() => setShowUpload(true)} className="btn-gold">
            <Plus className="h-4 w-4" /> Upload material
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-navy-300" />
        <input
          value={filters.courseCode}
          onChange={(e) => setFilters((f) => ({ ...f, courseCode: e.target.value }))}
          placeholder="Course code, e.g. CSM 261"
          className="input-field w-auto !py-2 text-sm"
        />
        <select
          value={filters.level}
          onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
          className="input-field w-auto !py-2 text-sm"
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
        <select
          value={filters.semester}
          onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
          className="input-field w-auto !py-2 text-sm"
        >
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => (
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

      {loading ? <LoadingSpinner label="Loading materials" /> : <CourseMaterials materials={materials} />}

      {showUpload && (
        <UploadResource
          onClose={() => setShowUpload(false)}
          onUploaded={(created) => setMaterials((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
