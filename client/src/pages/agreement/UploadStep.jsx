import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import Loader from '../../components/common/Loader.jsx';
import DocumentUploadCard from '../../components/agreement/DocumentUploadCard.jsx';
import { uploadApi } from '../../api/uploadApi.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';

// Upload panna vendiya documents (backend: server/src/config/uploads.js)
const DOCUMENTS = [
  { docType: 'owner_aadhaar', title: 'Owner Aadhaar', who: 'owner' },
  { docType: 'tenant_aadhaar', title: 'Tenant Aadhaar', who: 'tenant' },
];

// /agreements/:id/upload — Step 3: Aadhaar documents upload
export default function UploadStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState(null); // { owner_aadhaar: {...}, tenant_aadhaar: null }
  const [consent, setConsent] = useState(!!agreement.uploadConsentAt);
  const [loadError, setLoadError] = useState('');
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    uploadApi
      .list(agreement.id)
      .then((data) => {
        setUploads(Object.fromEntries(data.uploads.map((u) => [u.docType, u])));
        if (data.consentAt) setConsent(true);
      })
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [agreement.id]);

  const allUploaded = uploads && DOCUMENTS.every((d) => uploads[d.docType]);

  const handleContinue = async () => {
    setContinuing(true);
    try {
      const data = await agreementApi.update(agreement.id, { currentStep: 'rules' });
      setAgreement(data.agreement);
      navigate('../rules');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setContinuing(false);
    }
  };

  if (loadError) return <Alert type="error">{loadError}</Alert>;
  if (!uploads) return <Loader text="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload documents</h1>
        <p className="mt-1 text-slate-600">Upload the Aadhaar card of the owner and the tenant (front side, or both sides in one PDF).</p>
      </div>

      <Alert type="info" title="Your documents are protected">
        Files are encrypted before they are stored and can be viewed only by you and the administrator.
        They are never shown publicly or included in the downloaded agreement.
      </Alert>

      {/* Consent — idhu tick pannaama upload panna mudiyaadhu */}
      <label
        className={`flex items-start gap-3 rounded-xl p-4 text-sm ring-1 ${
          consent ? 'bg-green-50 text-green-900 ring-green-200' : 'bg-white text-slate-700 ring-slate-200'
        }`}
      >
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
          checked={consent}
          disabled={!!agreement.uploadConsentAt}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I confirm that I have the permission of the owner and the tenant to upload their Aadhaar documents, and I
          agree that these documents will be used only for preparing this rental agreement.
        </span>
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        {DOCUMENTS.map((d) => (
          <DocumentUploadCard
            key={d.docType}
            agreementId={agreement.id}
            docType={d.docType}
            title={d.title}
            hint={agreement[d.who]?.fullName ? `For ${agreement[d.who].fullName}` : undefined}
            upload={uploads[d.docType]}
            disabled={!consent}
            consent={consent}
            onChange={(upload) => {
              setUploads((prev) => ({ ...prev, [d.docType]: upload }));
              if (upload) {
                toast.success(`${d.title} uploaded`);
                if (!agreement.uploadConsentAt) setAgreement({ ...agreement, uploadConsentAt: new Date().toISOString() });
              }
            }}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {allUploaded ? '✓ All documents uploaded' : 'Both documents are required to continue.'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('../details')}>Back</Button>
          <Button onClick={handleContinue} disabled={!allUploaded} loading={continuing} className="flex-1 sm:flex-none">
            Save &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
