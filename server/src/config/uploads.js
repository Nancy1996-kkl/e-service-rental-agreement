// Upload settings — oru idathula.

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Upload panna vendiya documents (agreement-ku ovvonnum oru file)
export const DOC_TYPES = {
  owner_aadhaar: 'Owner Aadhaar',
  tenant_aadhaar: 'Tenant Aadhaar',
};

// Allowed file types. File-oda mudhal sila bytes ("magic bytes") vechu check pannrom —
// extension-ah ".pdf"-nu maathi vera file anuppinaalum kandupidikka mudiyum.
export const FILE_SIGNATURES = [
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

export function detectFileType(buffer) {
  return FILE_SIGNATURES.find((sig) => sig.bytes.every((b, i) => buffer[i] === b)) || null;
}
