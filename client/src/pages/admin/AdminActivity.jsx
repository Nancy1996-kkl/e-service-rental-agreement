import { useEffect, useState } from 'react';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import { PageHeader, Card, EmptyRow, th, td } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';

const ACTIONS = {
  'upload.view': 'Viewed an uploaded document',
  'agreement.download': 'Downloaded a client agreement',
  'client.update': 'Changed a client account',
  'template.create': 'Added a template',
  'template.update': 'Updated a template',
  'template.file': 'Replaced a template file',
  'template.delete': 'Deleted a template',
  'clause.create': 'Added a clause',
  'clause.update': 'Updated a clause',
  'clause.delete': 'Deleted a clause',
};

// /admin/activity — yaar enna panninaanga (security audit)
export default function AdminActivity() {
  const [actions, setActions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.audit().then((d) => setActions(d.actions)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!actions) return <Loader />;

  return (
    <>
      <PageHeader title="Activity log" text="Sensitive admin actions — latest 200." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Details</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actions.length === 0 && <EmptyRow colSpan={4} text="No activity yet." />}
              {actions.map((a, i) => (
                <tr key={`${a.at}-${i}`}>
                  <td className={`${td} whitespace-nowrap`}>{new Date(a.at).toLocaleString('en-IN')}</td>
                  <td className={td}>{a.user}</td>
                  <td className={td}>{ACTIONS[a.action] || a.action}</td>
                  <td className={`${td} max-w-xs truncate text-xs text-slate-500`} title={`${a.target} ${a.detail}`}>{a.target} {a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
