import api from './axiosInstance.js';

export const templateApi = {
  list: () => api.get('/templates').then((res) => res.data),
  get: (id) => api.get(`/templates/${id}`).then((res) => res.data),
};
