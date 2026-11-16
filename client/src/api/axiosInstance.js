import axios from 'axios';

// Ellaa API calls-um indha oru axios instance vazhiya dhaan pogum.
// withCredentials: true → login cookie automatic-ah anuppum.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

// Backend error-la irundhu user-ku kaatta vendiya message-ah edukka
export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  // Backend off-ah irundha: direct-ah response varaadhu, illa Vite proxy empty 500/502/504 kudukkum
  if (!error.response || [502, 503, 504].includes(error.response.status) || !error.response.data) {
    return 'Cannot reach the server. Please make sure the backend is running.';
  }
  return 'Something went wrong. Please try again.';
}

// Backend field errors ({ email: '...' }) — form fields-la kaatta
export function getFieldErrors(error) {
  return error.response?.data?.errors || {};
}

export default api;
