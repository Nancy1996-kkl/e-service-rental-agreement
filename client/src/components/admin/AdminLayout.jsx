import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: '📊', end: true },
  { to: '/admin/clients', label: 'Clients', icon: '👥' },
  { to: '/admin/agreements', label: 'Agreements', icon: '📄' },
  { to: '/admin/templates', label: 'Templates', icon: '🗂️' },
  { to: '/admin/clauses', label: 'Clauses', icon: '⚖️' },
  { to: '/admin/activity', label: 'Activity log', icon: '🕒' },
];

// Admin pages-ku common layout: left side menu (mobile-la mela scroll tabs)
export default function AdminLayout() {
  const linkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">Admin</span>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Admin" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={linkClass}>
                  <span aria-hidden="true">{l.icon}</span> {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Admin pages-la common chinna components
export function PageHeader({ title, text, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {text && <p className="mt-1 text-sm text-slate-600">{text}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    completed: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-red-100 text-red-700',
    admin: 'bg-slate-900 text-white',
    off: 'bg-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>;
}

export function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">{text}</td>
    </tr>
  );
}

export const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
export const td = 'px-4 py-3 text-sm text-slate-700';
