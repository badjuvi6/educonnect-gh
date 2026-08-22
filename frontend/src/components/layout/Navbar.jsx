import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/#features' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-navy-800/60 bg-navy-900/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-900">
            <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold text-white">
            EduConnect <span className="text-gold-400">GH</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              className="text-sm font-medium text-navy-200 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-gold">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-navy-100 transition hover:text-white"
              >
                Log in
              </Link>
              <Link to="/signup" className="btn-gold">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy-100 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-navy-800 px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-100 hover:bg-navy-800"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-navy-800 pt-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-gold w-full" onClick={() => setMobileOpen(false)}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-secondary w-full !bg-navy-800 !text-white !border-navy-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link to="/signup" className="btn-gold w-full" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
