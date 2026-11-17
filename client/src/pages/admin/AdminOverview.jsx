import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import { PageHeader, StatusBadge, Card, EmptyRow, th, td } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';

// /admin — numbers + recent agreements
export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setData).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <Loader text="Loading dashboard..." />;
  const s = data.stats;

  const cards = [
    { label: 'Clients', value: s.clients, sub: `${s.activeClients} active`, to: '/admin/clients' },
    { label: 'Agreements', value: s.agreements, sub: `${s.drafts} drafts`, to: '/admin/agreements' },
    { label: 'Completed', value: s.completed, sub: 'downloaded at least once', to: '/admin/agreements?status=completed' },
    { label: 'Documents', value: s.uploads, sub: `${s.downloads} files generated`, to: '/admin/agreements' },
  ];

  return (
    <>
      <PageHeader title="Overview" text="A quick look at your platform." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-primary-300">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Recent agreements</h3>
          <Link to="/admin/agreements" className="text-sm font-medium text-primary-600 hover:underline">View all</Link>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50">
              <tr><th className={th}>Owner → Tenant</th><th className={th}>Client</th><th className={th}>Rent</th><th className={th}>Status</th><th className={th}>Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent.length === 0 && <EmptyRow colSpan={5} text="No agreements yet." />}
              {data.recent.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className={td}>
                    <Link to={`/admin/agreements/${a.id}`} className="font-medium text-primary-700 hover:underline">
                      {a.owner?.fullName || '—'} → {a.tenant?.fullName || '—'}
                    </Link>
                  </td>
                  <td className={td}>{a.client}</td>
                  <td className={td}>{formatRupees(a.property?.monthlyRent) || '—'}</td>
                  <td className={td}><StatusBadge status={a.status} /></td>
                  <td className={td}>{formatDate(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
