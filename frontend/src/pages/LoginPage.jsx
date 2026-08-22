import { Link } from 'react-router-dom';
import { GraduationCap, ClipboardCheck, Wallet, Megaphone } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';

const HIGHLIGHTS = [
  { icon: ClipboardCheck, text: 'Track registration, clearance & transcript requests' },
  { icon: Wallet, text: 'See your fee balance and payment history at a glance' },
  { icon: Megaphone, text: "Never miss a notice from your department or SRC" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(228,169,63,0.12),transparent_45%)]" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-900">
            <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold text-white">
            EduConnect <span className="text-gold-400">GH</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Everything your academic journey needs, in one place.
          </h2>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-relaxed text-navy-200">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-navy-400">
          Built for students, lecturers and administrators across Ghanaian tertiary institutions.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
              <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-bold text-navy-900">
              EduConnect <span className="text-gold-500">GH</span>
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-navy-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-navy-400">
            Sign in to continue to your dashboard.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
