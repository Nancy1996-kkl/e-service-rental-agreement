import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import FormSection from '../../components/common/FormSection.jsx';
import Button from '../../components/common/Button.jsx';
import PartyFields from '../../components/agreement/PartyFields.jsx';
import PropertyFields from '../../components/agreement/PropertyFields.jsx';
import SaveStatus from '../../components/agreement/SaveStatus.jsx';
import DocumentPreviewModal from '../../components/agreement/DocumentPreviewModal.jsx';
import { useAutoSave } from '../../hooks/useAutoSave.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage, getFieldErrors } from '../../api/axiosInstance.js';

// /agreements/:id/details — Owner, Tenant, Property details (auto-save oda)
export default function DetailsStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const [continuing, setContinuing] = useState(false);
  const [previewData, setPreviewData] = useState(null); // null = popup close
  const [switching, setSwitching] = useState(false);

  const {
    register,
    control,
    watch,
    getValues,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched', // Field-ah vittu veliya vandha apram dhaan error kaattum
    defaultValues: {
      owner: agreement.owner,
      tenant: agreement.tenant,
      property: agreement.property,
    },
  });

  // Auto-save: type pannumbodhu 1.5 sec wait panni save
  const save = useCallback(
    async (values) => {
      const data = await agreementApi.update(agreement.id, values);
      setAgreement(data.agreement);
    },
    [agreement.id, setAgreement]
  );
  const { status, schedule, cancel } = useAutoSave(save, 1500);

  useEffect(() => {
    // Form-la edhavadhu maarinaa schedule() call aagum
    const subscription = watch((values) => schedule(JSON.parse(JSON.stringify(values))));
    return () => subscription.unsubscribe();
  }, [watch, schedule]);

  // "Save & Continue" — full validation + next step
  const onContinue = async (values) => {
    cancel(); // Pending auto-save venaam, ippo full save pannrom
    setContinuing(true);
    try {
      const data = await agreementApi.update(agreement.id, { ...values, currentStep: 'upload' });
      setAgreement(data.agreement);
      navigate('../upload');
    } catch (err) {
      // Backend errors ("owner.mobile": "...") andha field keezha kaattrom
      Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
      toast.error(getErrorMessage(err));
    } finally {
      setContinuing(false);
    }
  };

  const onInvalid = () => toast.error('Please fix the highlighted fields');

  // Preview popup-la vera template "Use this template" click pannaa
  const handleUseTemplate = async (templateId) => {
    setSwitching(true);
    try {
      const data = await agreementApi.update(agreement.id, { templateId });
      setAgreement(data.agreement);
      toast.success('Template changed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onContinue, onInvalid)} noValidate className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agreement details</h1>
          <p className="mt-1 text-slate-600">
            Fields marked <span className="text-red-500">*</span> are required. Your progress is saved automatically.
          </p>
        </div>
        {/* Ippo type panna details-oda document epdi irukkum-nu paakka */}
        <Button variant="outline" onClick={() => setPreviewData(getValues())} className="shrink-0">
          👁 Preview Document
        </Button>
      </div>

      <FormSection title="Owner (Landlord) Details" description="The person who owns and is renting out the property.">
        <PartyFields prefix="owner" register={register} errors={errors.owner} />
      </FormSection>

      <FormSection title="Tenant Details" description="The person who will be renting the property.">
        <PartyFields prefix="tenant" register={register} errors={errors.tenant} />
      </FormSection>

      <FormSection title="Property & Rent Details">
        <PropertyFields register={register} control={control} errors={errors.property} />
      </FormSection>

      {/* Keezha sticky action bar */}
      <div className="step-actions sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 pt-2.5 pb-3 shadow-[0_-6px_16px_-8px_rgba(15,23,42,0.15)] backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-none">
        <SaveStatus status={status} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('../template')}>Back</Button>
          <Button type="submit" loading={continuing} className="flex-1 sm:flex-none">
            Save &amp; Continue
          </Button>
        </div>
      </div>
      <DocumentPreviewModal
        open={!!previewData}
        onClose={() => setPreviewData(null)}
        templateId={agreement.templateId}
        data={previewData}
        onUseTemplate={handleUseTemplate}
        using={switching}
      />
    </form>
  );
}
