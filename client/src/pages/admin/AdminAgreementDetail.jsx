import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import DocumentView from '../../components/agreement/DocumentView.jsx';
import { PageHeader, StatusBadge, Card } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { agreementApi } from '../../api/agreementApi.js';
import { uploadApi } from '../../api/uploadApi.js';
import { downloadAgreement } from '../../api/downloadApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { useTemplateHtml } from '../../hooks/useTemplateHtml.js';
import { useClauses } from '../../hooks/useClauses.js';
import { buildPlaceholderValues, fillTemplate } from '../../utils/placeholders.js';
import { buildTermItems } from '../../../../shared/terms.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';
import { PROPERTY_TYPES } from '../../utils/constants.js';

const DOC_LABELS = { owner_aadhaar: 'Owner Aadhaar', tenant_aadhaar: 'Tenant Aadhaar' };

// /admin/agreements/:id — full details, Aadhaar documents, download, preview
export default function AdminAgreementDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [full, setFull] = useState(null); // editedContent-oda (preview-ku)
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.agreement(id), agreementApi.get(id)])
      .then(([d, f]) => {
        setData(d);
        setFull(f.agreement);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const handleDownload = async (format) => {
    setBusy(format);
    try {
      await downloadAgreement(id, format);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <Loader />;
  const { agreement: a, client, uploads, documents } = data;
  const terms = buildTermItems(a.terms, { monthlyRent: a.property.monthlyRent, templateId: a.templateId });

  return (
    <>
      <Link to="/admin/agreements" className="text-sm text-primary-600 hover:underline">← All agreements</Link>
      <PageHeader title={`${a.owner.fullName || '—'} → ${a.tenant.fullName || '—'}`}
        text={`Created ${formatDate(a.createdAt)} · Updated ${formatDate(a.updatedAt)}`}>
        <StatusBadge status={a.status} />
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setPreview(true)}>👁 Preview document</Button>
        <Button loading={busy === 'pdf'} disabled={!!busy} onClick={() => handleDownload('pdf')}>Download PDF</Button>
        <Button loading={busy === 'docx'} disabled={!!busy} variant="secondary" onClick={() => handleDownload('docx')}>Download Word</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Client">
          {client ? (
            <Rows rows={[['Name', <Link key="c" to={`/admin/clients/${client.id}`} className="text-primary-700 hover:underline">{client.fullName}</Link>], ['Email', client.email], ['Mobile', client.mobile]]} />
          ) : <p className="text-sm text-slate-500">Client account not found.</p>}
        </Section>

        <Section title="Uploaded documents">
          {uploads.length === 0 && <p className="text-sm text-slate-500">No documents uploaded.</p>}
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{DOC_LABELS[u.docType] || u.docType}</p>
                  <p className="truncate text-xs text-slate-500">{u.fileName} · {formatDate(u.createdAt)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => window.open(uploadApi.fileUrl(a.id, u.docType, u.id), '_blank', 'noopener')}>View</Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">🔒 Viewing a document is recorded in the activity log.</p>
        </Section>

        <Section title="Owner"><Party p={a.owner} /></Section>
        <Section title="Tenant"><Party p={a.tenant} /></Section>

        <Section title="Property & rent">
          <Rows rows={[
            ['Address', a.property.address],
            ['Type', PROPERTY_TYPES.find((t) => t.value === a.property.type)?.label],
            ['Details', a.property.description],
            ['Monthly rent', formatRupees(a.property.monthlyRent)],
            ['Deposit', formatRupees(a.property.securityDeposit)],
            ['Period', a.property.endDate && `${formatDate(a.property.startDate)} – ${formatDate(a.property.endDate)} (${a.property.durationMonths} months)`],
          ]} />
        </Section>

        <Section title="Terms selected">
          {terms.length ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {terms.map((t, i) => <li key={i}>{t.label && <strong>{t.label}: </strong>}{t.text}</li>)}
            </ol>
          ) : <p className="text-sm text-slate-500">No terms yet.</p>}
          {documents.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Generated: {documents.map((d) => `${d.format.toUpperCase()} (${formatDate(d.generatedAt)})`).join(', ')}
            </p>
          )}
        </Section>
      </div>

      {full && <PreviewModal open={preview} onClose={() => setPreview(false)} agreement={full} />}
    </>
  );
}

function PreviewModal({ open, onClose, agreement }) {
  const { template, error } = useTemplateHtml(open ? agreement.templateId : null);
  const standardClauses = useClauses();
  const html = template ? fillTemplate(agreement.editedContent || template.html, buildPlaceholderValues(agreement, { standardClauses })) : '';
  return (
    <Modal open={open} onClose={onClose} size="xl" title="Agreement preview">
      {error && <div className="p-5"><Alert type="error">{getErrorMessage(error)}</Alert></div>}
      {!error && !template && <Loader />}
      {template && <DocumentView html={html} theme={template.theme} />}
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </Card>
  );
}

function Rows({ rows }) {
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-2">
          <dt className="text-slate-500">{k}</dt>
          <dd className="col-span-2 whitespace-pre-line text-slate-800">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Party({ p }) {
  return (
    <Rows rows={[
      ['Name', p.fullName], ["Father's / Husband's", p.relationName], ['Mobile', p.mobile],
      ['Email', p.email], ['Address', p.address], ['Aadhaar', p.aadhaarLast4 && `XXXX XXXX ${p.aadhaarLast4}`],
    ]} />
  );
}
