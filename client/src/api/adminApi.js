import api from './axiosInstance.js';

const data = (res) => res.data;

// 👑 Admin dashboard API calls
export const adminApi = {
  stats: () => api.get('/admin/stats').then(data),

  clients: (search = '') => api.get('/admin/clients', { params: { search } }).then(data),
  client: (id) => api.get(`/admin/clients/${id}`).then(data),
  updateClient: (id, changes) => api.patch(`/admin/clients/${id}`, changes).then(data),

  agreements: (params = {}) => api.get('/admin/agreements', { params }).then(data),
  agreement: (id) => api.get(`/admin/agreements/${id}`).then(data),

  templates: () => api.get('/admin/templates').then(data),
  template: (id) => api.get(`/admin/templates/${id}`).then(data),
  updateTemplate: (id, changes) => api.patch(`/admin/templates/${id}`, changes).then(data),
  deleteTemplate: (id) => api.delete(`/admin/templates/${id}`).then(data),
  // fields: { id, name, description, icon, theme } + file (.docx)
  createTemplate: (fields, file) => api.post('/admin/templates', toForm(fields, file), { timeout: 60000 }).then(data),
  replaceTemplateFile: (id, file) => api.post(`/admin/templates/${id}/file`, toForm({}, file), { timeout: 60000 }).then(data),

  clauses: () => api.get('/admin/clauses').then(data),
  createClause: (clause) => api.post('/admin/clauses', clause).then(data),
  addDefaultClauses: () => api.post('/admin/clauses/defaults').then(data),
  updateClause: (id, changes) => api.patch(`/admin/clauses/${id}`, changes).then(data),
  deleteClause: (id) => api.delete(`/admin/clauses/${id}`).then(data),

  audit: () => api.get('/admin/audit').then(data),
};

function toForm(fields, file) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => v !== undefined && form.append(k, v));
  if (file) form.append('file', file);
  return form;
}
