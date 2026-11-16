import { useId } from 'react';

/**
 * Pill buttons maadhiri radio options (e.g. Tenant | Owner | Shared).
 * react-hook-form: <ChoiceGroup label="..." options={[...]} {...register('terms.water')} />
 */
export default function ChoiceGroup({ label, options, error, hint, required, name, ref, onChange, onBlur, className = '' }) {
  const id = useId();
  return (
    <fieldset className={className} aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="cursor-pointer">
            <input
              type="radio"
              value={opt.value}
              name={name}
              ref={ref}
              onChange={onChange}
              onBlur={onBlur}
              className="peer sr-only"
            />
            <span
              className="inline-block rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition
                hover:border-primary-400 peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white
                peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1"
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </fieldset>
  );
}
