import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import StepWizard from '../../components/agreement/StepWizard.jsx';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { WIZARD_STEPS } from '../../utils/constants.js';
import { useTemplates } from '../../hooks/useTemplates.js';

/**
 * /agreements/:id/* — ellaa wizard steps-kum common layout.
 * Agreement-ah oru dhadava load panni, ovvoru step-kum <Outlet context> vazhiya kudukkrom.
 */
export default function AgreementWizard() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState('');
  const { getTemplate } = useTemplates();

  useEffect(() => {
    setError('');
    agreementApi
      .get(id)
      .then((data) => setAgreement(data.agreement))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Alert type="error" title="Could not open this agreement">{error}</Alert>
        <Button to="/dashboard" variant="secondary" className="mt-6">Back to Dashboard</Button>
      </div>
    );
  }
  if (!agreement) return <Loader text="Loading agreement..." />;

  const activeKey = pathname.split('/').pop();

  // Guard: innum reach pannaadha step-ku (URL type panni) poga mudiyaadhu
  const activeIndex = WIZARD_STEPS.findIndex((s) => s.key === activeKey);
  const reachedIndex = WIZARD_STEPS.findIndex((s) => s.key === agreement.currentStep);
  if (activeIndex === -1 || activeIndex > reachedIndex) {
    return <Navigate to={`/agreements/${id}/${agreement.currentStep}`} replace />;
  }
  // Completed agreement → Download page mattum (edit panna "Make changes" click pannanum)
  const completed = agreement.status === 'completed';
  if (completed && activeKey !== 'download') {
    return <Navigate to={`/agreements/${id}/download`} replace />;
  }

  const template = getTemplate(agreement.templateId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <StepWizard activeKey={activeKey} reachedKey={agreement.currentStep} basePath={`/agreements/${id}`} />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span aria-hidden="true">{template?.icon}</span>
        <span className="font-medium text-slate-700">{template?.name}</span>
        {completed ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Completed</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Draft</span>
        )}
      </div>

      <div className="mt-4">
        <Outlet context={{ agreement, setAgreement }} />
      </div>
    </div>
  );
}
