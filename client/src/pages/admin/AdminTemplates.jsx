import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import DocumentView from '../../components/agreement/DocumentView.jsx';
import { PageHeader, StatusBadge, Card } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';
import { fillTemplate } from '../../utils/placeholders.js';

const THEME_LABELS = { classic: 'Classic — navy', modern: 'Modern — teal', corporate: 'Corporate — charcoal & gold', elegant: 'Elegant — maroon' };

// /admin/templates — Word templates manage
export default function AdminTemplates() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // template | 'new' | null
  const [previewId, setPreviewId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const load = () => adminApi.templates().then(setData).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (t) => {
    try {
      await adminApi.updateTemplate(t.id, { isActive: !t.isActive });
      toast.success(t.isActive ? 'Template turned off' : 'Template turned on');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteTemplate(t.id);
      toast.success('Template deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <Loader />;

  return (
    <>
      <PageHeader title="Templates" text="Word (.docx) agreement templates shown to clients.">
        <Button variant="secondary" onClick={() => setShowHelp(true)}>Placeholders guide</Button>
        <Button onClick={() => setEditing('new')}>+ Add template</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {data.templates.map((t) => (
          <Card key={t.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">{t.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">ID: {t.id} · {THEME_LABELS[t.theme] || t.theme}</p>
                </div>
              </div>
              <StatusBadge status={t.isActive ? 'active' : 'off'} />
            </div>
            <p className="mt-3 flex-1 text-sm text-slate-600">{t.description}</p>
            <p className="mt-3 text-xs text-slate-500">
              Used in {t.usage} agreement(s) · {t.placeholders?.length || 0} placeholders · Updated {new Date(t.updatedAt).toLocaleDateString('en-IN')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button size="sm" variant="secondary" onClick={() => setPreviewId(t.id)}>Preview</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(t)}>{t.isActive ? 'Turn off' : 'Turn on'}</Button>
              {t.usage === 0 && <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => remove(t)}>Delete</Button>}
            </div>
          </Card>
        ))}
      </div>

      <TemplateForm open={!!editing} template={editing === 'new' ? null : editing} themes={data.themes}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      <PreviewModal id={previewId} onClose={() => setPreviewId(null)} />
      <Modal open={showHelp} onClose={() => setShowHelp(false)} size="lg" title="Placeholders guide">
        <div className="space-y-3 p-5 text-sm text-slate-700">
          <p>Type these placeholders in your Word file exactly where the details should appear. Type each placeholder in one go (don&apos;t format part of it).</p>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {data.placeholders.map((p) => (
                <tr key={p.key}>
                  <td className="py-1.5 pr-3 font-mono text-xs text-primary-700">{`{{${p.key}}}`}</td>
                  <td className="py-1.5 text-slate-600">{p.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500">Put <code>{'{{terms_and_conditions}}'}</code> on its own line — the terms list appears there.</p>
        </div>
      </Modal>
    </>
  );
}

function TemplateForm({ open, template, themes, onClose, onSaved }) {
  const isNew = !template;
  const fileRef = useRef(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    if (open) {
      setForm(template ? { name: template.name, description: template.description, icon: template.icon, theme: template.theme, order: template.order }
        : { id: '', name: '', description: '', icon: '📄', theme: 'classic', order: 10 });
      setProblems([]);
    }
  }, [open, template]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (isNew && !file) return toast.error('Choose a Word (.docx) file');
    setSaving(true);
    try {
      let result;
      if (isNew) {
        result = await adminApi.createTemplate(form, file);
      } else {
        await adminApi.updateTemplate(template.id, form);
        if (file) result = await adminApi.replaceTemplateFile(template.id, file);
      }
      if (result?.problems?.length) {
        setProblems(result.problems);
        toast('Saved, but some placeholders need fixing', { icon: '⚠️' });
      } else {
        toast.success('Template saved');
        onSaved();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Add template' : `Edit — ${template?.name}`}>
      <form onSubmit={save} className="space-y-4 p-5">
        {isNew && <Input label="Template ID" required placeholder="e.g. lease" hint="Short name used in links. Letters, numbers, - or _." value={form.id || ''} onChange={set('id')} />}
        <Input label="Name" required value={form.name || ''} onChange={set('name')} />
        <Input label="Short description" value={form.description || ''} onChange={set('description')} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Icon (emoji)" maxLength={4} value={form.icon || ''} onChange={set('icon')} />
          <Select label="Design" className="col-span-2" placeholder={null} value={form.theme || 'classic'} onChange={set('theme')}
            options={themes.map((t) => ({ value: t, label: THEME_LABELS[t] || t }))} />
        </div>
        <Input label="Display order" type="number" value={form.order ?? ''} onChange={set('order')} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Word file (.docx) {isNew && <span className="text-red-500">*</span>}
          </label>
          <input ref={fileRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-primary-700" />
          {!isNew && <p className="mt-1 text-xs text-slate-500">Leave empty to keep the current file. Agreements already edited by clients keep their version.</p>}
        </div>
        {problems.length > 0 && (
          <Alert type="warning" title="Check these placeholders in the Word file">
            <ul className="list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </Alert>
        )}
        <Alert type="info">Use only content approved by the client or a legal professional.</Alert>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={problems.length ? onSaved : onClose}>{problems.length ? 'Done' : 'Cancel'}</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ id, onClose }) {
  const [template, setTemplate] = useState(null);
  useEffect(() => {
    setTemplate(null);
    if (id) adminApi.template(id).then((d) => setTemplate(d.template)).catch((err) => toast.error(getErrorMessage(err)));
  }, [id]);
  return (
    <Modal open={!!id} onClose={onClose} size="xl" title={template ? `Preview — ${template.name}` : 'Preview'}>
      {!template ? <Loader /> : <DocumentView html={fillTemplate(template.html, {})} theme={template.theme} />}
    </Modal>
  );
}
