import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import SaveStatus from '../../components/agreement/SaveStatus.jsx';
import EditorToolbar from '../../components/editor/EditorToolbar.jsx';
import { PlaceholderNode, toEditorHtml } from '../../components/editor/PlaceholderNode.js';
import { useTemplateHtml } from '../../hooks/useTemplateHtml.js';
import { useAutoSave } from '../../hooks/useAutoSave.js';
import { agreementApi } from '../../api/agreementApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { buildPlaceholderValues } from '../../utils/placeholders.js';
import { useClauses } from '../../hooks/useClauses.js';

// /agreements/:id/editor — Step 5: Word maadhiri document customize
export default function EditorStep() {
  const { agreement } = useOutletContext();
  const { template, error } = useTemplateHtml(agreement.templateId);
  const standardClauses = useClauses();

  if (error) return <Alert type="error">{getErrorMessage(error)}</Alert>;
  if (!template) return <Loader text="Loading document..." />;

  // Template load aanadhum dhaan editor create pannrom
  return <DocumentEditor template={template} standardClauses={standardClauses} />;
}

function DocumentEditor({ template, standardClauses }) {
  const { agreement, setAgreement } = useOutletContext();
  const navigate = useNavigate();
  const [continuing, setContinuing] = useState(false);
  const lastBlockedToast = useRef(0);

  const values = useMemo(() => buildPlaceholderValues(agreement, { standardClauses }), [agreement.owner, agreement.tenant, agreement.property, agreement.terms, standardClauses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save — editedContent mattum anuppurom (server sanitize pannum)
  const save = useCallback(
    async (editedContent) => setAgreement((await agreementApi.update(agreement.id, { editedContent })).agreement),
    [agreement.id, setAgreement]
  );
  const { status, schedule, flush } = useAutoSave(save, 1500);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, code: false, codeBlock: false }),
      TextStyleKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit.configure({ table: { resizable: false } }),
      PlaceholderNode.configure({
        values,
        onBlocked: () => {
          // Delete panna try pannaa oru chinna message (adikkadi spam aagaama)
          if (Date.now() - lastBlockedToast.current > 3000) {
            lastBlockedToast.current = Date.now();
            toast('Highlighted details are locked. Change them in the Details or Terms step.', { icon: '🔒' });
          }
        },
      }),
    ],
    content: toEditorHtml(agreement.editedContent || template.html),
    onUpdate: ({ editor: e }) => schedule(e.getHTML()),
    editorProps: { attributes: { class: 'focus:outline-none', spellcheck: 'true' } },
  });

  const handleReset = async () => {
    if (!window.confirm('Reset to the original template? All your formatting and text changes will be lost.')) return;
    editor.chain().setMeta('allowPlaceholderRemoval', true).setContent(toEditorHtml(template.html), { emitUpdate: false }).run();
    try {
      setAgreement((await agreementApi.update(agreement.id, { editedContent: null })).agreement);
      toast.success('Document reset to template');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleContinue = async () => {
    setContinuing(true);
    try {
      await flush(); // Pending changes save
      const data = await agreementApi.update(agreement.id, { currentStep: 'preview' });
      setAgreement(data.agreement);
      navigate('../preview');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setContinuing(false);
    }
  };

  if (!editor) return <Loader />;
  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customize your agreement</h1>
          <p className="mt-1 text-slate-600">
            Edit the text and formatting like in Word. <span className="rounded bg-indigo-100 px-1 text-indigo-800">Blue</span>{' '}
            details are filled automatically and locked.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0">↺ Reset to template</Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* Toolbar scroll aagumbodhum mela nikkum (navbar keezha) */}
        <div className="sticky top-16 z-20 overflow-hidden rounded-t-xl">
          <EditorToolbar editor={editor} />
          <div className="flex items-center gap-x-4 gap-y-1 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="max-w-[110px] truncate rounded bg-indigo-100 px-1.5 py-px text-indigo-800">{agreement.owner?.fullName || 'Name'}</span>
              <span>🔒 auto-filled — change in Details / Terms</span>
            </span>
            <span className="ml-auto hidden sm:inline">A4 · {wordCount} words</span>
          </div>
        </div>
        <div className="rounded-b-xl bg-slate-200/70 px-1.5 py-4 sm:px-8 sm:py-8">
          <article className={`agreement-doc doc-theme-${template.theme || 'classic'} mx-auto w-full max-w-[210mm] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.18)]`}>
            <EditorContent editor={editor} />
          </article>
        </div>
      </div>

      <div className="step-actions sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 pt-2.5 pb-3 shadow-[0_-6px_16px_-8px_rgba(15,23,42,0.15)] backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-none">
        <SaveStatus status={status} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('../rules')}>Back</Button>
          <Button onClick={handleContinue} loading={continuing} className="flex-1 sm:flex-none">Save &amp; Preview</Button>
        </div>
      </div>
    </div>
  );
}
