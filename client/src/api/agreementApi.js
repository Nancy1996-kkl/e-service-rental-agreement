import api from './axiosInstance.js';

// Agreement related API calls
export const agreementApi = {
  list: () => api.get('/agreements').then((res) => res.data),
  get: (id) => api.get(`/agreements/${id}`).then((res) => res.data),
  create: (templateId) => api.post('/agreements', { templateId }).then((res) => res.data),
  update: (id, changes) => api.put(`/agreements/${id}`, changes).then((res) => res.data),
  remove: (id) => api.delete(`/agreements/${id}`).then((res) => res.data),
};
