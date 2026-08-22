import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LEVELS } from '../../utils/constants';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  indexNumber: '',
  program: '',
  department: '',
  level: '100',
  phone: '',
};

export default function SignupForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.indexNumber) {
      setError('Please fill in your name, email, password and index number.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword: _confirmPassword, ...payload } = form;
    const result = await register(payload);
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-navy-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Ama Serwaa Boateng"
            className="input-field"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@university.edu.gh"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="indexNumber" className="mb-1.5 block text-sm font-medium text-navy-700">
            Index number
          </label>
          <input
            id="indexNumber"
            name="indexNumber"
            required
            value={form.indexNumber}
            onChange={handleChange}
            placeholder="e.g. 10812345"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-navy-700">
            Level
          </label>
          <select
            id="level"
            name="level"
            value={form.level}
            onChange={handleChange}
            className="input-field"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="program" className="mb-1.5 block text-sm font-medium text-navy-700">
            Program of study
          </label>
          <input
            id="program"
            name="program"
            value={form.program}
            onChange={handleChange}
            placeholder="e.g. BSc. Computer Science"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-navy-700">
            Department
          </label>
          <input
            id="department"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="e.g. Computer Science"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy-700">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. 024 123 4567"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className="input-field"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className="input-field"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-gold w-full">
        {submitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" /> Creating your account...
          </>
        ) : (
          'Create student account'
        )}
      </button>

      <p className="text-center text-sm text-navy-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-navy-800 hover:text-gold-600">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-navy-300">
        Lecturer and admin accounts are created by your institution&apos;s administrator.
      </p>
    </form>
  );
}
