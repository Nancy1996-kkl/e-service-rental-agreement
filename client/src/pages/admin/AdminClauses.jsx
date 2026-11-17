import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Textarea from '../../components/common/Textarea.jsx';
import Modal from '../../components/common/Modal.jsx';
import { PageHeader, StatusBadge, Card } from '../../components/admin/AdminLayout.jsx';
import { adminApi } from '../../api/adminApi.js';
import { getErrorMessage, getFieldErrors } from '../../api/axiosInstance.js';

// /admin/clauses — client / lawyer approve panna standard clauses (ellaa agreements-layum automatic-ah varum)
export default function AdminClauses() {
  const [clauses, setClauses] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // clause | 'new'

  const load = () =>
    Promise.all([adminApi.clauses(), adminApi.templates()])
      .then(([c, t]) => {
        setClauses(c.clauses);
        setTemplates(t.templates);
      })
      .catch((err) => setError(getErrorMessage(err)));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (c) => {
    try {
      await adminApi.updateClause(c.id, { isActive: !c.isActive });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (c) => {
    if (!window.confirm('Delete this clause?')) return;
    try {
      await adminApi.deleteClause(c.id);
      toast.success('Clause deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const addDefaults = async () => {
    try {
      const { added } = await adminApi.addDefaultClauses();
      toast.success(added ? `${added} suggested clause(s) added` : 'All suggested clauses are already added');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (error) return <Alert type="error">{error}</Alert>;
  if (!clauses) return <Loader />;
  const nameOf = (id) => templates.find((t) => t.id === id)?.name || id;

  return (
    <>
      <PageHeader title="Standard clauses" text="Approved clauses added automatically to the Terms & Conditions of agreements.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addDefaults}>Add suggested clauses</Button>
          <Button onClick={() => setEditing('new')}>+ Add clause</Button>
        </div>
      </PageHeader>
      <Alert type="warning" className="mb-5">
        Add only clauses approved by the client or a qualified legal professional. Rules can differ between states.
      </Alert>

      {clauses.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500">No standard clauses yet. Clients&apos; own terms are still added to every agreement.</Card>
      )}
      <div className="space-y-3">
        {clauses.map((c, i) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{i + 1}. {c.title || 'Untitled clause'}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{c.text}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {c.templates?.length ? `Templates: ${c.templates.map(nameOf).join(', ')}` : 'All templates'}
                </p>
              </div>
              <StatusBadge status={c.isActive ? 'active' : 'off'} />
            </div>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(c)}>{c.isActive ? 'Turn off' : 'Turn on'}</Button>
              <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => remove(c)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <ClauseForm open={!!editing} clause={editing === 'new' ? null : editing} templates={templates}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </>
  );
}

function ClauseForm({ open, clause, templates, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', text: '', templates: [], isActive: true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(clause ? { title: clause.title, text: clause.text, templates: clause.templates || [], isActive: clause.isActive } : { title: '', text: '', templates: [], isActive: true });
      setErrors({});
    }
  }, [open, clause]);

  const toggleTemplate = (id) =>
    setForm((f) => ({ ...f, templates: f.templates.includes(id) ? f.templates.filter((x) => x !== id) : [...f.templates, id] }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (clause) await adminApi.updateClause(clause.id, form);
      else await adminApi.createClause(form);
      toast.success('Clause saved');
      onSaved();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={clause ? 'Edit clause' : 'Add clause'}>
      <form onSubmit={save} className="space-y-4 p-5">
        <Input label="Short title" placeholder="e.g. Subletting" hint="Shown in bold before the clause (optional)."
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Clause text" required rows={5} maxLength={2000} error={errors.text}
          hint="You can use placeholders like {{tenant_name}}, {{monthly_rent}}."
          value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Show in templates</legend>
          <p className="mb-2 text-xs text-slate-500">Select none to show in all templates.</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-sm">
                <input type="checkbox" className="accent-primary-600" checked={form.templates.includes(t.id)} onChange={() => toggleTemplate(t.id)} />
                {t.icon} {t.name.replace(/ Agreement$/, '')}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
