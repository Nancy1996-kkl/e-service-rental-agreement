// Auto-save status chinna text-ah kaattum
const STATES = {
  idle: { text: 'All changes saved', className: 'text-slate-400' },
  pending: { text: 'Unsaved changes…', className: 'text-slate-500' },
  saving: { text: 'Saving…', className: 'text-primary-600' },
  saved: { text: '✓ Draft saved', className: 'text-green-600' },
  error: { text: 'Could not save. Check your connection.', className: 'text-red-600' },
};

export default function SaveStatus({ status }) {
  const s = STATES[status] || STATES.idle;
  return (
    <p className={`text-center text-xs sm:text-left sm:text-sm ${s.className}`} aria-live="polite">
      {s.text}
    </p>
  );
}
