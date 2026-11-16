import { useId } from 'react';

// Reusable multi-line input (address maadhiri periya text-ku)
export default function Textarea({ label, error, hint, required, rows = 3, className = '', id, ref, ...rest }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const messageId = `${fieldId}-msg`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error || hint ? messageId : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400
          focus:outline-none focus:ring-2
          ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'}`}
        {...rest}
      />
      {error ? (
        <p id={messageId} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
