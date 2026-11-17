import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import { PageHeader, StatusBadge, Card, EmptyRow, th, td } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';

// /admin/clients/:id — oru client-oda details + avanga agreements
export default function AdminClientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.client(id).then(setData).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <Loader />;
  const { client, agreements } = data;

  return (
    <>
      <Link to="/admin/clients" className="text-sm text-primary-600 hover:underline">← All clients</Link>
      <PageHeader title={client.fullName} text={`${client.email} · ${client.mobile}`}>
        <StatusBadge status={client.isActive ? 'active' : 'disabled'} />
        {client.role === 'admin' && <StatusBadge status="admin" />}
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm text-slate-500">Joined {formatDate(client.createdAt)}</p>

      <Card className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50">
              <tr><th className={th}>Owner → Tenant</th><th className={th}>Template</th><th className={th}>Rent</th><th className={th}>Status</th><th className={th}>Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agreements.length === 0 && <EmptyRow colSpan={5} text="This client has no agreements yet." />}
              {agreements.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className={td}>
                    <Link to={`/admin/agreements/${a.id}`} className="font-medium text-primary-700 hover:underline">
                      {a.owner?.fullName || '—'} → {a.tenant?.fullName || '—'}
                    </Link>
                  </td>
                  <td className={`${td} capitalize`}>{a.templateId}</td>
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
