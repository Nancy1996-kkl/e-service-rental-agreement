import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import { downloadAgreement } from '../../api/downloadApi.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { useTemplates } from '../../hooks/useTemplates.js';
import { formatDate } from '../../utils/dateUtils.js';

const FORMATS = [
  { format: 'pdf', title: 'PDF', icon: '📕', text: 'Best for printing and sharing. Looks exactly like the preview.' },
  { format: 'docx', title: 'Word (.docx)', icon: '📘', text: 'Open in Microsoft Word or Google Docs to make further edits.' },
];

// /agreements/:id/download — Step 7
export default function DownloadStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const { getTemplate } = useTemplates();
  const [busy, setBusy] = useState(null); // 'pdf' | 'docx'
  const [reopening, setReopening] = useState(false);
  const completed = agreement.status === 'completed';

  const handleDownload = async (format) => {
    setBusy(format);
    try {
      const fileName = await downloadAgreement(agreement.id, format);
      toast.success(`Downloaded ${fileName}`);
      // First download → server "completed" nu mark pannum; latest data edukkrom
      if (!completed) setAgreement((await agreementApi.get(agreement.id)).agreement);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleMakeChanges = async () => {
    setReopening(true);
    try {
      const data = await agreementApi.update(agreement.id, { status: 'draft' });
      setAgreement(data.agreement);
      navigate('../editor');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white sm:p-8">
        <p className="text-4xl" aria-hidden="true">🎉</p>
        <h1 className="mt-3 text-2xl font-bold">Your agreement is ready!</h1>
        <p className="mt-1 text-primary-100">
          {getTemplate(agreement.templateId)?.name} · {agreement.owner.fullName} → {agreement.tenant.fullName}
        </p>
        {completed && agreement.completedAt && (
          <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm">
            ✓ Completed on {formatDate(agreement.completedAt)}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FORMATS.map((f) => (
          <div key={f.format} className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl" aria-hidden="true">{f.icon}</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-600">{f.text}</p>
            <Button className="mt-5" size="lg" loading={busy === f.format} disabled={!!busy} onClick={() => handleDownload(f.format)}>
              {busy === f.format ? 'Preparing…' : `Download ${f.title.split(' ')[0]}`}
            </Button>
          </div>
        ))}
      </div>

      <Alert type="warning" title="Before you sign">
        This document is a draft prepared from the details you entered. Print it on stamp paper / e-stamp of the
        correct value, have both parties and witnesses sign it, and register it if required by your state&apos;s rules.
        Get the terms reviewed by a legal professional if needed.
      </Alert>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
        {completed ? (
          <Button variant="secondary" loading={reopening} onClick={handleMakeChanges}>✎ Make changes</Button>
        ) : (
          <Button variant="secondary" onClick={() => navigate('../preview')}>Back to preview</Button>
        )}
        <Button to="/dashboard" variant="outline">Go to Dashboard</Button>
      </div>
    </div>
  );
}
