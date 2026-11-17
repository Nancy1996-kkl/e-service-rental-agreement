import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { APP_NAME } from '../../utils/constants.js';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/#templates', label: 'Templates' },
  { to: '/#how-it-works', label: 'How it works' },
];

export default function Navbar() {
  // Mobile menu open-ah close-ah nu track panna
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    navigate('/'); // Mothalla public page-ku poyidrom, illana protected page Login-ku redirect aagidum
    await logout();
    toast.success('Logged out');
  };

  const linkClass = 'text-sm font-medium text-slate-600 transition-colors hover:text-primary-600';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">
            E
          </span>
          <span className="font-semibold text-slate-900">{APP_NAME}</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-500">Hi, {user.fullName.split(' ')[0]}</span>
              {user.role === 'admin' && <Button to="/admin" size="sm" variant="secondary">👑 Admin</Button>}
              <Button to="/dashboard" size="sm">Dashboard</Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Login</Button>
              <Button to="/register" size="sm">Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Button to="/admin" variant="secondary" fullWidth onClick={() => setOpen(false)}>👑 Admin</Button>
                )}
                <Button to="/dashboard" fullWidth onClick={() => setOpen(false)}>Dashboard</Button>
                <Button variant="secondary" fullWidth onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="secondary" fullWidth onClick={() => setOpen(false)}>Login</Button>
                <Button to="/register" fullWidth onClick={() => setOpen(false)}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
