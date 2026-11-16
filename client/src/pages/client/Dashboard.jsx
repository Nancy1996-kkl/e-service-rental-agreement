import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { useTemplates } from '../../hooks/useTemplates.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';

// Client Dashboard — en agreements list
export default function Dashboard() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    agreementApi
      .list()
      .then((data) => setAgreements(data.agreements))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    try {
      await agreementApi.remove(id);
      setAgreements((list) => list.filter((a) => a.id !== id));
      toast.success('Draft deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const drafts = agreements?.filter((a) => a.status === 'draft').length ?? 0;
  const completed = agreements?.filter((a) => a.status === 'completed').length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user.fullName.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-slate-600">Manage your rental agreements here.</p>
        </div>
        <Button to="/agreements/new" size="lg">+ New Agreement</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total agreements" value={agreements?.length ?? '–'} />
        <Stat label="Drafts" value={agreements ? drafts : '–'} />
        <Stat label="Completed" value={agreements ? completed : '–'} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">My Agreements</h2>

        {error && <Alert type="error">{error}</Alert>}
        {!error && !agreements && <Loader text="Loading your agreements..." />}

        {agreements?.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-4xl" aria-hidden="true">📄</p>
            <h3 className="mt-3 font-semibold text-slate-900">No agreements yet</h3>
            <p className="mt-1 text-sm text-slate-600">Create your first rental agreement in a few simple steps.</p>
            <Button to="/agreements/new" variant="outline" className="mt-5">Create Agreement</Button>
          </div>
        )}

        {agreements?.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {agreements.map((a) => (
              <AgreementCard key={a.id} agreement={a} onDelete={() => handleDelete(a.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AgreementCard({ agreement: a, onDelete }) {
  const { getTemplate } = useTemplates();
  const template = getTemplate(a.templateId);
  const parties =
    a.owner.fullName || a.tenant.fullName
      ? `${a.owner.fullName || '—'} → ${a.tenant.fullName || '—'}`
      : 'Details not entered yet';
  const isDraft = a.status === 'draft';

  return (
    <li className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{template?.icon}</span>
          <div>
            <p className="font-semibold text-slate-900">{template?.name}</p>
            <p className="text-sm text-slate-600">{parties}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isDraft ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {isDraft ? 'Draft' : 'Completed'}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Rent</dt>
          <dd className="text-slate-800">{formatRupees(a.property.monthlyRent) || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Period</dt>
          <dd className="text-slate-800">
            {a.property.endDate ? `${formatDate(a.property.startDate)} – ${formatDate(a.property.endDate)}` : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">Updated {formatDate(a.updatedAt)}</p>
        <div className="flex gap-2">
          {isDraft && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="!text-red-600 hover:!bg-red-50">
              Delete
            </Button>
          )}
          <Button to={`/agreements/${a.id}/${a.currentStep || 'details'}`} size="sm">
            {isDraft ? 'Continue' : 'Open'}
          </Button>
        </div>
      </div>
    </li>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
