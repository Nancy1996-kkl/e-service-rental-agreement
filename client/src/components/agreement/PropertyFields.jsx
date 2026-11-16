import { useWatch } from 'react-hook-form';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Textarea from '../common/Textarea.jsx';
import { PROPERTY_TYPES, DURATION_OPTIONS } from '../../utils/constants.js';
import { calcEndDate, formatDate, formatRupees } from '../../utils/dateUtils.js';

const amountRule = (label, allowZero) => ({
  required: `Enter the ${label}${allowZero ? ' (0 if none)' : ''}`,
  pattern: { value: /^\d{1,9}$/, message: 'Enter numbers only (no commas or ₹)' },
  validate: (v) => allowZero || Number(v) > 0 || `${label[0].toUpperCase()}${label.slice(1)} must be more than 0`,
});

export default function PropertyFields({ register, control, errors = {} }) {
  // Indha values maarumbodhu keezha irukka hints update aagum
  const [startDate, durationMonths, monthlyRent, securityDeposit] = useWatch({
    control,
    name: ['property.startDate', 'property.durationMonths', 'property.monthlyRent', 'property.securityDeposit'],
  });
  const endDate = calcEndDate(startDate, durationMonths);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Textarea
        label="Property Address"
        required
        rows={2}
        className="sm:col-span-2"
        placeholder="Door no, street, area, city, PIN code"
        error={errors.address?.message}
        {...register('property.address', {
          required: 'Property address is required',
          minLength: { value: 5, message: 'Enter the full address' },
        })}
      />
      <Select
        label="Property Type"
        required
        options={PROPERTY_TYPES}
        placeholder="Select property type"
        error={errors.type?.message}
        {...register('property.type', { required: 'Select the property type' })}
      />
      <Input
        label="Property Details"
        placeholder="e.g. 2 BHK, first floor, with car parking"
        error={errors.description?.message}
        {...register('property.description')}
      />
      <Input
        label="Monthly Rent (₹)"
        inputMode="numeric"
        placeholder="e.g. 15000"
        required
        hint={formatRupees(monthlyRent)}
        error={errors.monthlyRent?.message}
        {...register('property.monthlyRent', amountRule('monthly rent'))}
      />
      <Input
        label="Security Deposit / Advance (₹)"
        inputMode="numeric"
        placeholder="e.g. 50000"
        required
        hint={formatRupees(securityDeposit)}
        error={errors.securityDeposit?.message}
        {...register('property.securityDeposit', amountRule('security deposit', true))}
      />
      <Input
        label="Agreement Start Date"
        type="date"
        required
        error={errors.startDate?.message}
        {...register('property.startDate', { required: 'Select the agreement start date' })}
      />
      <Select
        label="Agreement Duration"
        required
        options={DURATION_OPTIONS}
        placeholder="Select duration"
        error={errors.durationMonths?.message}
        {...register('property.durationMonths', { required: 'Select the duration' })}
      />

      {/* End date — automatic-ah calculate aagum, user type panna vendaam */}
      <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700 sm:col-span-2">
        {endDate ? (
          <>
            <span className="font-medium">Agreement period:</span> {formatDate(startDate)} to{' '}
            <span className="font-semibold">{formatDate(endDate)}</span> ({durationMonths} months)
          </>
        ) : (
          'Select a start date and duration — the end date will be calculated automatically.'
        )}
      </div>
    </div>
  );
}
