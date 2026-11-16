const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };

/**
 * Loading spinner
 * - inline: button-kulla use panna (text illa)
 * - fullScreen: page full-ah load aagumbodhu
 */
export default function Loader({ size = 'md', text, inline = false, fullScreen = false }) {
  const spinner = (
    <span
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZES[size]}`}
      role="status"
      aria-label={text || 'Loading'}
    />
  );

  if (inline) return spinner;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-primary-600 ${
        fullScreen ? 'min-h-screen' : 'py-10'
      }`}
    >
      {spinner}
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
