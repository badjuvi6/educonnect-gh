import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import SignupForm from '../components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(228,169,63,0.12),transparent_45%)]" />
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
            Create your student account and take charge of your academic process.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-navy-300">
            Submit registration and clearance requests, download course materials, and check
            your fee status — all from your phone or laptop, on campus or off.
          </p>
        </div>

        <p className="relative text-xs text-navy-400">
          Already have staff credentials? Ask your administrator for access.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
              <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-bold text-navy-900">
              EduConnect <span className="text-gold-500">GH</span>
            </span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-navy-900">
            Create your student account
          </h1>
          <p className="mt-1.5 text-sm text-navy-400">
            Get access to your personal academic dashboard in a minute.
          </p>

          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
