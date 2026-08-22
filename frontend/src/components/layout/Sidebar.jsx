import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Megaphone,
  Users,
  UserCircle,
  GraduationCap,
  X,
} from 'lucide-react';

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/processes', label: 'My Processes', icon: ClipboardList },
  { to: '/dashboard/materials', label: 'Course Materials', icon: BookOpen },
  { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/dashboard/profile', label: 'Profile', icon: UserCircle },
];

const STAFF_LINKS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/processes', label: 'Process Requests', icon: ClipboardList },
  { to: '/dashboard/students', label: 'Student Records', icon: Users },
  { to: '/dashboard/materials', label: 'Course Materials', icon: BookOpen },
  { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/dashboard/profile', label: 'Profile', icon: UserCircle },
];

export default function Sidebar({ role, open, onClose }) {
  const links = role === 'student' ? STUDENT_LINKS : STAFF_LINKS;

  const content = (
    <div className="flex h-full flex-col bg-navy-900">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-900">
            <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="font-display text-base font-bold text-white">
            EduConnect <span className="text-gold-400">GH</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-navy-300 hover:bg-navy-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-navy-800 text-gold-400'
                  : 'text-navy-200 hover:bg-navy-800/70 hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <p className="text-xs text-navy-400">
          EduConnect GH &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {content}
      </aside>

      {/* Mobile: slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-raised">{content}</div>
        </div>
      )}
    </>
  );
}
