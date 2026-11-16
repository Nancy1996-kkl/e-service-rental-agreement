import { listTemplates, getTemplateById } from '../services/templateService.js';
import { PLACEHOLDERS } from '../config/placeholders.js';

// GET /api/templates — cards-ku venum info mattum (HTML illama, fast-ah load aaga)
export async function list(req, res) {
  const templates = await listTemplates();
  res.json({
    templates: templates.map(({ id, name, description, icon, theme }) => ({ id, name, description, icon, theme })),
  });
}

// GET /api/templates/:id — full template (HTML oda) — preview / editor-ku
export async function getOne(req, res) {
  const template = await getTemplateById(req.params.id);
  // Inactive template-um kudukkrom — pazhaya agreements adha use pannalaam (pudhu agreements-ku list-la varaadhu)
  if (!template) return res.status(404).json({ message: 'Template not found' });
  const { id, name, description, icon, theme, html, updatedAt } = template;
  res.json({ template: { id, name, description, icon, theme, html, updatedAt } });
}

// GET /api/templates/placeholders — available placeholders list (admin-ku help)
export function placeholders(req, res) {
  res.json({ placeholders: PLACEHOLDERS });
}
