import Loader from '../common/Loader.jsx';
import Alert from '../common/Alert.jsx';
import { useTemplates } from '../../hooks/useTemplates.js';

/**
 * Templates cards (server-la evlo irukko avlo — 4 or 5) — onnu click pannaa onSelect(id) call aagum.
 * selectedId: already select panna template (highlight aagum)
 * busyId: andha card-la loading spinner
 */
export default function TemplatePicker({ selectedId, busyId, onSelect }) {
  const { templates, loading, error } = useTemplates();

  if (loading) return <Loader text="Loading templates..." />;
  if (error) return <Alert type="error">Could not load templates. Please refresh the page.</Alert>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {templates.map((t) => {
        const selected = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            disabled={!!busyId}
            aria-pressed={selected}
            className={`flex items-start gap-4 rounded-xl border-2 bg-white p-5 text-left transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait
              ${selected ? 'border-primary-600 shadow-md' : 'border-slate-200 hover:border-primary-300 hover:shadow-sm'}`}
          >
            <span className="text-3xl" aria-hidden="true">{t.icon}</span>
            <span className="flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{t.name}</span>
                {busyId === t.id && <span className="text-primary-600"><Loader size="sm" inline /></span>}
                {selected && busyId !== t.id && (
                  <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">Selected</span>
                )}
              </span>
              <span className="mt-1 block text-sm text-slate-600">{t.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
