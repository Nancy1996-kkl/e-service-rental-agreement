import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import { PageHeader, StatusBadge, Card, EmptyRow, th, td } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { useTemplates } from '../../hooks/useTemplates.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'completed', label: 'Completed' },
];

// /admin/agreements — ellaa clients-oda agreements
export default function AdminAgreements() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [search, setSearch] = useState('');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const { getTemplate } = useTemplates();

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi.agreements({ status, search }).then((d) => setList(d.agreements)).catch((err) => setError(getErrorMessage(err)));
    }, 300);
    return () => clearTimeout(t);
  }, [status, search]);

  return (
    <>
      <PageHeader title="Agreements" text="All agreements created on the platform." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="tab" aria-selected={status === f.value}
              onClick={() => setParams(f.value ? { status: f.value } : {})}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${status === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search owner, tenant, address, client…" aria-label="Search agreements"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 sm:max-w-sm" />
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {!list && !error && <Loader />}
      {list && (
        <>
        {/* 📱 Mobile: cards */}
        <div className="space-y-3 md:hidden">
          {list.length === 0 && <Card className="p-6 text-center text-sm text-slate-500">No agreements found.</Card>}
          {list.map((a) => (
            <Link key={a.id} to={`/admin/agreements/${a.id}`} className="block">
              <Card className="p-4 transition hover:ring-primary-300">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 font-medium text-primary-700">{a.owner?.fullName || '—'} → {a.tenant?.fullName || '—'}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{a.property?.address}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-slate-500">Client</dt><dd className="text-slate-800">{a.client.fullName}</dd>
                  <dt className="text-slate-500">Template</dt><dd className="text-slate-800">{getTemplate(a.templateId)?.icon} {getTemplate(a.templateId)?.name?.replace(/ Agreement$/, '') || a.templateId}</dd>
                  <dt className="text-slate-500">Rent</dt><dd className="text-slate-800">{formatRupees(a.property?.monthlyRent) || '—'}</dd>
                  <dt className="text-slate-500">Updated</dt><dd className="text-slate-800">{formatDate(a.updatedAt)}</dd>
                </dl>
              </Card>
            </Link>
          ))}
        </div>
        <Card className="hidden overflow-hidden md:block">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className={th}>Owner → Tenant</th><th className={th}>Client</th><th className={th}>Template</th>
                  <th className={th}>Rent</th><th className={th}>Period</th><th className={th}>Status</th><th className={th}>Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.length === 0 && <EmptyRow colSpan={7} text="No agreements found." />}
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className={td}>
                      <Link to={`/admin/agreements/${a.id}`} className="font-medium text-primary-700 hover:underline">
                        {a.owner?.fullName || '—'} → {a.tenant?.fullName || '—'}
                      </Link>
                      <p className="max-w-[220px] truncate text-xs text-slate-500">{a.property?.address}</p>
                    </td>
                    <td className={td}><Link to={`/admin/clients/${a.client.id}`} className="hover:underline">{a.client.fullName}</Link></td>
                    <td className={td}>{getTemplate(a.templateId)?.icon} {getTemplate(a.templateId)?.name?.replace(/ Agreement$/, '') || a.templateId}</td>
                    <td className={td}>{formatRupees(a.property?.monthlyRent) || '—'}</td>
                    <td className={`${td} whitespace-nowrap`}>{a.property?.endDate ? `${formatDate(a.property.startDate)} – ${formatDate(a.property.endDate)}` : '—'}</td>
                    <td className={td}><StatusBadge status={a.status} /></td>
                    <td className={td}>{formatDate(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}
    </>
  );
}
