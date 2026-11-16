import { Link } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants.js';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-semibold text-slate-900">{APP_NAME}</p>
          <p className="mt-2 text-sm text-slate-500">
            Create, customize and download rental agreements online.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Quick Links</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-500">
            <li><Link to="/" className="hover:text-primary-600">Home</Link></li>
            <li><Link to="/login" className="hover:text-primary-600">Login</Link></li>
            <li><Link to="/register" className="hover:text-primary-600">Register</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Please note</p>
          <p className="mt-2 text-sm text-slate-500">
            Generated documents are drafts. Stamp duty and registration must be completed as per
            your state&apos;s rules.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
