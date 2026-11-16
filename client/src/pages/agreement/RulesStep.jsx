import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import FormSection from '../../components/common/FormSection.jsx';
import Select from '../../components/common/Select.jsx';
import ChoiceGroup from '../../components/common/ChoiceGroup.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import Button from '../../components/common/Button.jsx';
import Alert from '../../components/common/Alert.jsx';
import SaveStatus from '../../components/agreement/SaveStatus.jsx';
import { useAutoSave } from '../../hooks/useAutoSave.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage, getFieldErrors } from '../../api/axiosInstance.js';
import { PAYER_OPTIONS, PROPERTY_USE_OPTIONS } from '../../utils/constants.js';
import { renderTermsHtml, MAX_CLAUSES, MAX_CLAUSE_LENGTH } from '../../../../shared/terms.js';
import { useClauses } from '../../hooks/useClauses.js';
import { ordinal } from '../../utils/dateUtils.js';

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
const DAY_OPTIONS = range(1, 28).map((d) => ({ value: d, label: `${ordinal(d)} of every month` }));
const NOTICE_OPTIONS = range(0, 6).map((m) => ({ value: m, label: m === '0' ? 'No notice period' : `${m} month${m === '1' ? '' : 's'}` }));
const LOCKIN_OPTIONS = ['0', '3', '6', '11', '12'].map((m) => ({ value: m, label: m === '0' ? 'No lock-in' : `${m} months` }));
const INCREASE_OPTIONS = [{ value: '', label: 'Not specified' }, ...['5', '8', '10', '15'].map((p) => ({ value: p, label: `${p}% on renewal` }))];
const newClause = () => ({ id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text: '' });

// /agreements/:id/rules — Step 4: Terms & Conditions
export default function RulesStep() {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const [continuing, setContinuing] = useState(false);

  const { register, control, watch, handleSubmit, setError, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: { terms: agreement.terms },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'terms.additionalClauses', keyName: 'key' });
  const terms = useWatch({ control, name: 'terms' });
  const allClauses = useClauses();
  const standardClauses = allClauses.filter((c) => !c.templates?.length || c.templates.includes(agreement.templateId));

  // Auto-save
  const save = useCallback(
    async (values) => setAgreement((await agreementApi.update(agreement.id, values)).agreement),
    [agreement.id, setAgreement]
  );
  const { status, schedule, cancel } = useAutoSave(save, 1500);
  useEffect(() => {
    const sub = watch((values) => schedule(JSON.parse(JSON.stringify(values))));
    return () => sub.unsubscribe();
  }, [watch, schedule]);

  const onContinue = async (values) => {
    cancel();
    setContinuing(true);
    try {
      const data = await agreementApi.update(agreement.id, { ...values, currentStep: 'editor' });
      setAgreement(data.agreement);
      navigate('../editor');
    } catch (err) {
      Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
      toast.error(getErrorMessage(err));
    } finally {
      setContinuing(false);
    }
  };

  const e = errors.terms || {};
  const previewHtml = renderTermsHtml(terms, { monthlyRent: agreement.property.monthlyRent, templateId: agreement.templateId, standardClauses: allClauses });

  return (
    <form onSubmit={handleSubmit(onContinue, () => toast.error('Please fix the highlighted fields'))} noValidate className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Terms &amp; conditions</h1>
        <p className="mt-1 text-slate-600">Choose the rental terms. They are added to the agreement automatically.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ===== Left: form ===== */}
        <div className="space-y-6 lg:col-span-3">
          <FormSection title="Rent & period">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Rent due date" required options={DAY_OPTIONS} error={e.rentDueDay?.message}
                {...register('terms.rentDueDay', { required: 'Select the rent due date' })} />
              <Select label="Notice period" required options={NOTICE_OPTIONS} error={e.noticePeriodMonths?.message}
                hint="Written notice either party must give to end the agreement."
                {...register('terms.noticePeriodMonths', { required: 'Select the notice period' })} />
              <Select label="Lock-in period" options={LOCKIN_OPTIONS} error={e.lockInMonths?.message}
                hint="Minimum period before the agreement can be ended."
                {...register('terms.lockInMonths')} />
              <Select label="Rent increase on renewal" options={INCREASE_OPTIONS} placeholder={null}
                error={e.rentIncreasePercent?.message} {...register('terms.rentIncreasePercent')} />
            </div>
          </FormSection>

          <FormSection title="Charges & usage">
            <div className="space-y-5">
              <ChoiceGroup label="Electricity charges paid by" required options={PAYER_OPTIONS} error={e.electricity?.message}
                {...register('terms.electricity', { required: 'Select who pays' })} />
              <ChoiceGroup label="Water charges paid by" required options={PAYER_OPTIONS} error={e.water?.message}
                {...register('terms.water', { required: 'Select who pays' })} />
              <ChoiceGroup label="Maintenance charges paid by" required options={PAYER_OPTIONS} error={e.maintenance?.message}
                {...register('terms.maintenance', { required: 'Select who pays' })} />
              <ChoiceGroup label="Use of property" required options={PROPERTY_USE_OPTIONS} error={e.propertyUse?.message}
                {...register('terms.propertyUse', { required: 'Select the property use' })} />
            </div>
          </FormSection>

          <FormSection title="Additional conditions" description="Add any other points both parties agreed on (optional).">
            {standardClauses.length > 0 && (
              <Alert type="info" className="mb-4" title="Standard clauses included">
                {standardClauses.length} approved clause(s) for this template are added automatically.
              </Alert>
            )}
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.key} className="flex items-start gap-2">
                  <span className="mt-2.5 w-6 shrink-0 text-right text-sm font-medium text-slate-400">{i + 1}.</span>
                  <input type="hidden" {...register(`terms.additionalClauses.${i}.id`)} />
                  <Textarea
                    rows={2}
                    className="flex-1"
                    placeholder="e.g. One covered car parking slot is included."
                    maxLength={MAX_CLAUSE_LENGTH}
                    error={e.additionalClauses?.[i]?.text?.message}
                    {...register(`terms.additionalClauses.${i}.text`, {
                      required: 'Write the condition or remove it',
                      maxLength: { value: MAX_CLAUSE_LENGTH, message: `Maximum ${MAX_CLAUSE_LENGTH} characters` },
                    })}
                  />
                  <button type="button" onClick={() => remove(i)} aria-label={`Remove condition ${i + 1}`}
                    className="mt-1.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
            {fields.length < MAX_CLAUSES && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => append(newClause())}>
                + Add condition
              </Button>
            )}
          </FormSection>
        </div>

        {/* ===== Right: document-la epdi varum ===== */}
        <aside className="lg:col-span-2">
          <div className="sticky top-20 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">In your agreement</h2>
            <div
              className="agreement-doc mt-3 !min-h-0 !p-0 text-[10pt] !shadow-none"
              dangerouslySetInnerHTML={{ __html: previewHtml || '<p>No terms selected yet.</p>' }}
            />
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Legal clauses must be reviewed by the parties or a legal professional. Stamp duty and registration
              follow your state&apos;s rules.
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:px-5">
        <SaveStatus status={status} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('../upload')}>Back</Button>
          <Button type="submit" loading={continuing} className="flex-1 sm:flex-none">Save &amp; Continue</Button>
        </div>
      </div>
    </form>
  );
}
