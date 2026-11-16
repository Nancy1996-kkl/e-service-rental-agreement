import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TemplatePicker from '../../components/agreement/TemplatePicker.jsx';
import StepWizard from '../../components/agreement/StepWizard.jsx';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';

// /agreements/new — Step 1: template select pannaa pudhu draft create aagum
export default function NewAgreement() {
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const handleSelect = async (templateId) => {
    setBusyId(templateId);
    try {
      const { agreement } = await agreementApi.create(templateId);
      navigate(`/agreements/${agreement.id}/details`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <StepWizard activeKey="template" reachedKey="template" basePath="" />
      <div className="mt-8">
        <h1 className="text-2xl font-bold text-slate-900">Choose a template</h1>
        <p className="mt-1 text-slate-600">Select the agreement type that matches your property.</p>
      </div>
      <div className="mt-6">
        <TemplatePicker busyId={busyId} onSelect={handleSelect} />
      </div>
    </div>
  );
}
