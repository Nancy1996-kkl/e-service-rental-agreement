const STYLES = {
  success: { box: 'bg-green-50 border-green-200 text-green-800', icon: '✓' },
  error: { box: 'bg-red-50 border-red-200 text-red-800', icon: '!' },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', icon: '!' },
  info: { box: 'bg-primary-50 border-primary-100 text-primary-700', icon: 'i' },
};

/**
 * Message box — form error, success message kaatta
 * type: success | error | warning | info
 */
export default function Alert({ type = 'info', title, children, onClose, className = '' }) {
  const style = STYLES[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg border p-4 text-sm ${style.box} ${className}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
        {style.icon}
      </span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close" className="opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}
