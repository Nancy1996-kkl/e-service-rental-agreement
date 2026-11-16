import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import DocumentView from '../../components/agreement/DocumentView.jsx';
import { useTemplateHtml } from '../../hooks/useTemplateHtml.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { buildPlaceholderValues, fillTemplate, findMissing } from '../../utils/placeholders.js';
import { formatDate, formatRupees } from '../../utils/dateUtils.js';
import { useClauses } from '../../hooks/useClauses.js';

// /agreements/:id/preview — Step 6: final document check
export default function PreviewStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const { template, error } = useTemplateHtml(agreement.templateId);
  const [confirming, setConfirming] = useState(false);
  const standardClauses = useClauses();

  if (error) return <Alert type="error">{getErrorMessage(error)}</Alert>;
  if (!template) return <Loader text="Preparing preview..." />;

  // Download-la varra adhe logic (shared/placeholders.js) — preview = final document
  const content = agreement.editedContent || template.html;
  const values = buildPlaceholderValues(agreement, { standardClauses });
  const html = fillTemplate(content, values);
  const missing = findMissing(content, values);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const data = await agreementApi.update(agreement.id, { currentStep: 'download' });
      setAgreement(data.agreement);
      navigate('../download');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Preview</h1>
        <p className="mt-1 text-slate-600">This is exactly how your agreement will look in the PDF and Word download.</p>
      </div>

      {/* Quick summary */}
      <dl className="grid gap-3 rounded-xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200 sm:grid-cols-4">
        <Summary label="Owner" value={agreement.owner.fullName} />
        <Summary label="Tenant" value={agreement.tenant.fullName} />
        <Summary label="Rent / Deposit" value={`${formatRupees(agreement.property.monthlyRent)} / ${formatRupees(agreement.property.securityDeposit)}`} />
        <Summary label="Period" value={`${formatDate(agreement.property.startDate)} – ${formatDate(agreement.property.endDate)}`} />
      </dl>

      {missing.length > 0 ? (
        <Alert type="warning" title="Some details are missing">
          Please fill in: <strong>{missing.join(', ')}</strong>.{' '}
          <Link to="../details" className="font-medium underline">Go to Details</Link>
        </Alert>
      ) : (
        <Alert type="success" title="Everything looks complete">
          Read through the agreement carefully. You can still go back and make changes.
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <DocumentView html={html} theme={template.theme} />
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:px-5">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('../details')}>Edit details</Button>
          <Button variant="secondary" onClick={() => navigate('../editor')}>Edit document</Button>
        </div>
        <Button onClick={handleConfirm} loading={confirming} disabled={missing.length > 0} size="lg">
          Confirm &amp; Continue to Download
        </Button>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
