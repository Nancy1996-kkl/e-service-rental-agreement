import api from './axiosInstance.js';

export const uploadApi = {
  list: (agreementId) => api.get(`/agreements/${agreementId}/uploads`).then((res) => res.data),

  // onProgress(percent) — progress bar-ku
  upload: (agreementId, docType, file, { consent, onProgress } = {}) => {
    const form = new FormData();
    form.append('consent', consent ? 'true' : 'false');
    form.append('file', file);
    return api
      .post(`/agreements/${agreementId}/uploads/${docType}`, form, {
        timeout: 60000,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((res) => res.data);
  },

  remove: (agreementId, docType) => api.delete(`/agreements/${agreementId}/uploads/${docType}`).then((res) => res.data),

  // File paakka URL (login cookie automatic-ah pogum). v = cache illama latest file kaatta
  fileUrl: (agreementId, docType, version) =>
    `${api.defaults.baseURL}/agreements/${agreementId}/uploads/${docType}/file?v=${version}`,
};
