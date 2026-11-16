import { useEffect, useRef, useState } from 'react';
import Loader from '../common/Loader.jsx';
import Alert from '../common/Alert.jsx';
import Button from '../common/Button.jsx';
import DocumentView from './DocumentView.jsx';
import { useTemplates } from '../../hooks/useTemplates.js';
import { useTemplateHtml } from '../../hooks/useTemplateHtml.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { buildPlaceholderValues, fillTemplate } from '../../utils/placeholders.js';
import { useClauses } from '../../hooks/useClauses.js';

/**
 * Ellaa templates-layum user details-ah apply panni, tabs-la switch panni paakka.
 *
 * - data: { owner, tenant, property } — fill aaga vendiya details
 * - selectedId: ippo agreement-ku select aagirukka template
 * - onUse(templateId): "Use this template" click pannaa
 * - using: true-na button-la loading
 */
export default function TemplateComparePreview({ data, selectedId, onUse, using = false }) {
  const { templates, loading, error: listError } = useTemplates();
  const [viewingId, setViewingId] = useState(selectedId);
  const { template, error } = useTemplateHtml(viewingId);
  const activeTabRef = useRef(null);
  const standardClauses = useClauses();

  // Mobile-la active tab screen-ku veliya irundha, adha theriyura maadhiri scroll pannrom
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [viewingId, loading]);

  if (loading) return <Loader text="Loading templates..." />;
  if (listError) return <div className="p-5"><Alert type="error">{getErrorMessage(listError)}</Alert></div>;

  // Preview-la terms list andha template-ku correct-ah vara, templateId-um kudukkrom
  const html = template
    ? fillTemplate(template.html, buildPlaceholderValues({ ...(data || {}), templateId: viewingId }, { standardClauses }))
    : '';
  const isCurrent = viewingId === selectedId;

  return (
    <div>
      {/* Template tabs — mobile-la side-ah scroll aagum */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div role="tablist" aria-label="Templates" className="flex gap-1 overflow-x-auto px-3 pt-3">
          {templates.map((t) => {
            const active = t.id === viewingId;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                ref={active ? activeTabRef : undefined}
                onClick={() => setViewingId(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition
                  ${active ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span className="whitespace-nowrap">{t.name.replace(/ Agreement$/, '')}</span>
                {t.id === selectedId && <span className="text-xs text-green-600" title="Current template">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Ippo paakkura template-ah use panna */}
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {isCurrent ? (
              <span className="font-medium text-green-700">✓ This is your current template</span>
            ) : (
              <>Previewing <span className="font-medium text-slate-900">{templates.find((t) => t.id === viewingId)?.name}</span> with your details</>
            )}
          </p>
          {!isCurrent && (
            <Button size="sm" loading={using} onClick={() => onUse(viewingId)}>
              Use this template
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-5"><Alert type="error">{getErrorMessage(error)}</Alert></div>}
      {!error && !template && <Loader text="Loading template..." />}
      {!error && template && <DocumentView html={html} theme={template.theme} />}
    </div>
  );
}
