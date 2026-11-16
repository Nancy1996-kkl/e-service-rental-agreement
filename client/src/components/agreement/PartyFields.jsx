import Input from '../common/Input.jsx';
import Textarea from '../common/Textarea.jsx';
import { rules } from '../../utils/validators.js';

/**
 * Owner & Tenant rendukkum SAME fields — oru component, rendu dhadava use pannrom.
 * prefix = 'owner' or 'tenant' → form-la "owner.fullName" maadhiri save aagum.
 */
export default function PartyFields({ prefix, register, errors = {} }) {
  const name = (field) => `${prefix}.${field}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full Name"
        placeholder="As per ID proof"
        required
        error={errors.fullName?.message}
        {...register(name('fullName'), rules.fullName)}
      />
      <Input
        label="Father's / Husband's Name"
        placeholder="Optional"
        error={errors.relationName?.message}
        {...register(name('relationName'))}
      />
      <Input
        label="Mobile Number"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit number"
        required
        error={errors.mobile?.message}
        {...register(name('mobile'), rules.mobile)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="Optional"
        error={errors.email?.message}
        {...register(name('email'), { pattern: rules.email.pattern })}
      />
      <Textarea
        label="Permanent Address"
        required
        rows={2}
        className="sm:col-span-2"
        error={errors.address?.message}
        {...register(name('address'), {
          required: 'Address is required',
          minLength: { value: 5, message: 'Enter the full address' },
        })}
      />
      <Input
        label="Aadhaar — last 4 digits"
        inputMode="numeric"
        maxLength={4}
        placeholder="e.g. 1234"
        hint="For your privacy we store only the last 4 digits."
        error={errors.aadhaarLast4?.message}
        {...register(name('aadhaarLast4'), {
          pattern: { value: /^\d{4}$/, message: 'Enter exactly 4 digits' },
        })}
      />
    </div>
  );
}
