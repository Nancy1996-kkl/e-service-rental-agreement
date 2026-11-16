import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import TemplateComparePreview from '../../components/agreement/TemplateComparePreview.jsx';
import Button from '../../components/common/Button.jsx';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';

// /agreements/:id/template — ellaa templates-layum unga details-ah apply panni
// switch panni paathu, pidichadhu select pannalaam.
export default function TemplateStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const [using, setUsing] = useState(false);

  const handleUse = async (templateId) => {
    setUsing(true);
    try {
      const data = await agreementApi.update(agreement.id, { templateId });
      setAgreement(data.agreement);
      toast.success('Template changed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUsing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compare templates</h1>
          <p className="mt-1 text-slate-600">
            Switch between templates to see how your agreement looks in each. Your details stay the same.
          </p>
        </div>
        <Button onClick={() => navigate('../details')} className="shrink-0">Continue to Details</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <TemplateComparePreview
          data={agreement}
          selectedId={agreement.templateId}
          onUse={handleUse}
          using={using}
        />
      </div>
    </>
  );
}
