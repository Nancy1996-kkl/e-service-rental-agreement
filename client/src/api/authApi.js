import api from './axiosInstance.js';

// Auth related API calls — components direct-ah axios use panna maattaanga, indha functions dhaan
export const authApi = {
  register: (data) => api.post('/auth/register', data).then((res) => res.data),
  login: (data) => api.post('/auth/login', data).then((res) => res.data),
  me: () => api.get('/auth/me').then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
};
