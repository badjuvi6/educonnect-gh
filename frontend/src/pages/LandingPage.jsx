import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  BookOpen,
  Wallet,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: 'Academic process tracking',
    desc: 'Submit course registration, clearance, transcript and attachment requests, and follow their status from Pending to Approved without visiting the registry.',
  },
  {
    icon: BookOpen,
    title: 'Course materials, organized',
    desc: 'Lecturers share slides, past questions and handouts by course and level, so materials are always where students expect to find them.',
  },
  {
    icon: Wallet,
    title: 'Fee status at a glance',
    desc: 'Students see exactly what has been billed, what has been paid, and what is outstanding for each semester, in Ghana Cedis.',
  },
  {
    icon: Megaphone,
    title: 'Announcements that reach you',
    desc: 'Department and institutional notices are broadcast straight to the right audience, by level or by role.',
  },
];

const ROLES = [
  {
    title: 'For Students',
    points: [
      'Track every academic process request in one timeline',
      'Download course materials by course code and level',
      'Check fee balance and payment history',
      'Install as an app and keep browsing recent data offline',
    ],
    cta: 'Create a student account',
    to: '/signup',
  },
  {
    title: 'For Lecturers & Admins',
    points: [
      'Review and action student process requests',
      'Upload and manage course resources',
      'Broadcast notices to specific levels or the whole school',
      'Maintain student records and fee accounts',
    ],
    cta: 'Sign in to the staff portal',
    to: '/login',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(228,169,63,0.14),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(228,169,63,0.08),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold text-gold-400">
              Built for Ghanaian tertiary education
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Your academic process, tracked from submission to approval.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-navy-300 sm:text-lg">
              EduConnect GH brings registration, clearance, course materials, fees and
              announcements into a single portal — for students, lecturers and administrators.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-gold w-full sm:w-auto">
                Get started as a student <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full rounded-lg border border-navy-700 bg-navy-800/60 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-800 sm:w-auto"
              >
                Staff sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-navy-900">
            One portal, four essentials
          </h2>
          <p className="mt-3 text-navy-500">
            Designed around what actually slows students and staff down each semester.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role split */}
      <section className="bg-navy-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {ROLES.map((role) => (
              <div key={role.title} className="card flex flex-col p-8">
                <h3 className="font-display text-xl font-bold text-navy-900">{role.title}</h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-navy-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link to={role.to} className="btn-primary mt-7 w-full">
                  {role.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-800">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h4 className="font-display text-base font-bold text-navy-900">
                Secure by design
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
                Role-based access keeps student records and staff tools separate, with every
                session backed by a signed token.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-800">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <h4 className="font-display text-base font-bold text-navy-900">
                Installs like an app
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
                Add EduConnect GH to your home screen on iOS or desktop Chrome and keep viewing
                recent data even with a weak connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-navy-400 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} EduConnect GH. Built for Ghanaian tertiary
          institutions.
        </div>
      </footer>
    </div>
  );
}
