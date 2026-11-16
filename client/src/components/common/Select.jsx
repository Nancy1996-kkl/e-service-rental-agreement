import { useId } from 'react';

/**
 * Reusable dropdown
 * options = [{ value: '11', label: '11 Months' }, ...]
 */
export default function Select({
  label,
  error,
  hint,
  required,
  options = [],
  placeholder = 'Select an option',
  className = '',
  id,
  ref,
  ...rest
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const messageId = `${selectId}-msg`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error || hint ? messageId : undefined}
        {...(rest.value === undefined && rest.defaultValue === undefined ? { defaultValue: '' } : {})}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800
          focus:outline-none focus:ring-2 disabled:bg-slate-100
          ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'}`}
        {...rest}
      >
        {placeholder !== null && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={messageId} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
