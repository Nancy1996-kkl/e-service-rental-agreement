import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import { PageHeader, StatusBadge, Card, EmptyRow, th, td } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDate } from '../../utils/dateUtils.js';

// /admin/clients — registered clients list, enable / disable, admin role
export default function AdminClients() {
  const { user: me } = useAuth();
  const [clients, setClients] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    // Type pannumbodhu konja neram wait panni search (ovvoru letter-kum server call venaam)
    const t = setTimeout(() => {
      adminApi.clients(search).then((d) => setClients(d.clients)).catch((err) => setError(getErrorMessage(err)));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const update = async (client, changes, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(client.id);
    try {
      const { client: updated } = await adminApi.updateClient(client.id, changes);
      setClients((list) => list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      toast.success('Client updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Clients" text="Everyone who has registered on the platform." />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or mobile…"
        aria-label="Search clients"
        className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 sm:max-w-sm"
      />
      {error && <Alert type="error">{error}</Alert>}
      {!clients && !error && <Loader />}
      {clients && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className={th}>Client</th><th className={th}>Mobile</th><th className={th}>Agreements</th>
                  <th className={th}>Joined</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.length === 0 && <EmptyRow colSpan={6} text="No clients found." />}
                {clients.map((c) => {
                  const isMe = c.id === me.id;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className={td}>
                        <Link to={`/admin/clients/${c.id}`} className="font-medium text-primary-700 hover:underline">{c.fullName}</Link>
                        <p className="text-xs text-slate-500">{c.email}</p>
                      </td>
                      <td className={td}>{c.mobile}</td>
                      <td className={td}>{c.agreements.total} <span className="text-xs text-slate-500">({c.agreements.completed} completed)</span></td>
                      <td className={td}>{formatDate(c.createdAt)}</td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={c.isActive ? 'active' : 'disabled'} />
                          {c.role === 'admin' && <StatusBadge status="admin" />}
                        </div>
                      </td>
                      <td className={`${td} text-right`}>
                        {isMe ? (
                          <span className="text-xs text-slate-400">You</span>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" loading={busyId === c.id}
                              className={c.isActive ? '!text-red-600 hover:!bg-red-50' : ''}
                              onClick={() => update(c, { isActive: !c.isActive }, c.isActive ? `Disable ${c.fullName}? They will not be able to log in.` : null)}>
                              {c.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button size="sm" variant="ghost" disabled={busyId === c.id}
                              onClick={() => update(c, { role: c.role === 'admin' ? 'client' : 'admin' },
                                c.role === 'admin' ? `Remove admin access from ${c.fullName}?` : `Give ${c.fullName} full admin access?`)}>
                              {c.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
