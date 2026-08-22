import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-50 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
        <GraduationCap className="h-7 w-7" strokeWidth={2} />
      </span>
      <p className="mt-6 font-display text-6xl font-bold text-navy-900">404</p>
      <h1 className="mt-2 text-lg font-semibold text-navy-800">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-navy-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link to="/" className="btn-gold mt-8">
        Back to home
      </Link>
    </div>
  );
}
