import { Link } from 'react-router-dom';
import { WIZARD_STEPS } from '../../utils/constants.js';

/**
 * Mela varra step progress bar.
 * - activeKey: ippo irukka step
 * - reachedKey: user ivlo dhooram vandhirukkaanga (adhu varaikkum click panni pogalaam)
 * - basePath: /agreements/:id
 */
export default function StepWizard({ activeKey, reachedKey, basePath }) {
  const activeIndex = WIZARD_STEPS.findIndex((s) => s.key === activeKey);
  const reachedIndex = Math.max(WIZARD_STEPS.findIndex((s) => s.key === reachedKey), activeIndex);
  const active = WIZARD_STEPS[activeIndex];

  return (
    <nav aria-label="Agreement progress">
      {/* Mobile: simple text + bar */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-slate-700">
          Step {activeIndex + 1} of {WIZARD_STEPS.length}: <span className="text-primary-600">{active?.label}</span>
        </p>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-primary-600 transition-all"
            style={{ width: `${((activeIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tablet / Desktop: full steps */}
      <ol className="hidden items-center sm:flex">
        {WIZARD_STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex || (i <= reachedIndex && i !== activeIndex);
          const canClick = i <= reachedIndex && !isActive;

          const circle = (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold
                ${isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100' : ''}
                ${isDone ? 'bg-primary-100 text-primary-700' : ''}
                ${!isActive && !isDone ? 'bg-slate-200 text-slate-500' : ''}`}
            >
              {isDone ? '✓' : i + 1}
            </span>
          );
          const label = (
            <span className={`hidden text-xs font-medium lg:block ${isActive ? 'text-primary-700' : 'text-slate-500'}`}>
              {step.label}
            </span>
          );

          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              {canClick ? (
                <Link to={`${basePath}/${step.key}`} className="flex items-center gap-2 hover:opacity-80" title={step.label}>
                  {circle}
                  {label}
                </Link>
              ) : (
                <span className="flex items-center gap-2" aria-current={isActive ? 'step' : undefined} title={step.label}>
                  {circle}
                  {label}
                </span>
              )}
              {i < WIZARD_STEPS.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 ${i < reachedIndex ? 'bg-primary-200' : 'bg-slate-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
