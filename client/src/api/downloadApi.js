import api from './axiosInstance.js';

/**
 * Agreement-ah PDF / Word-ah download pannum.
 * Server file anuppum → browser-la "Save" aagura maadhiri trigger pannrom.
 */
export async function downloadAgreement(agreementId, format) {
  let res;
  try {
    res = await api.get(`/agreements/${agreementId}/download`, {
      params: { format },
      responseType: 'blob',
      timeout: 90000, // PDF create panna konja neram aagalaam
    });
  } catch (err) {
    // Error-um blob-ah varum — adha JSON-ah maathi message edukkrom
    if (err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text());
      } catch {
        /* ignore */
      }
    }
    throw err;
  }

  // Server sonna file name edukkrom
  const disposition = res.headers['content-disposition'] || '';
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `Rental-Agreement.${format}`;

  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
