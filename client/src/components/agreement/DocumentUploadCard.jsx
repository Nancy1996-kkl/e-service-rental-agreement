import { useRef, useState } from 'react';
import Button from '../common/Button.jsx';
import { uploadApi } from '../../api/uploadApi.js';
import { getErrorMessage } from '../../api/axiosInstance.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB (backend-layum same check irukku)
const ALLOWED = { 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG' };

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Oru document upload box (e.g. Owner Aadhaar).
 * - upload: already upload aana file info (illana null)
 * - disabled: consent tick pannala-na true
 * - onChange(upload | null): upload / remove aanaa parent-ku sollum
 */
export default function DocumentUploadCard({ agreementId, docType, title, hint, upload, disabled, consent, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null); // null = upload nadakkala
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    // Frontend check — fast feedback (backend thirumba check pannum)
    if (!ALLOWED[file.type]) return setError('Only PDF, JPG and PNG files are allowed.');
    if (file.size > MAX_SIZE) return setError(`File is too large (${formatSize(file.size)}). Maximum is 5 MB.`);

    setProgress(0);
    try {
      const data = await uploadApi.upload(agreementId, docType, file, { consent, onProgress: setProgress });
      onChange(data.upload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = ''; // Same file thirumba select panna allow
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Remove the ${title}?`)) return;
    setRemoving(true);
    try {
      await uploadApi.remove(agreementId, docType);
      onChange(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const fileUrl = upload ? uploadApi.fileUrl(agreementId, docType, upload.id) : '';
  const isImage = upload?.mimeType.startsWith('image/');
  const uploading = progress !== null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            {title} <span className="text-red-500">*</span>
          </h3>
          {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
        </div>
        {upload && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ Uploaded</span>
        )}
      </div>

      {/* Hidden file input — box click pannaa idhu open aagum */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {upload && !uploading ? (
        // ===== Upload aana file =====
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:w-40"
            title="Open full view"
          >
            {isImage ? (
              <img src={fileUrl} alt={`${title} preview`} className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center text-red-600">
                <span className="text-3xl" aria-hidden="true">📄</span>
                <span className="text-xs font-semibold">PDF</span>
              </span>
            )}
          </a>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-800" title={upload.fileName}>{upload.fileName}</p>
            <p className="text-sm text-slate-500">
              {ALLOWED[upload.mimeType]} · {formatSize(upload.size)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => window.open(fileUrl, '_blank', 'noopener')}>View</Button>
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>Replace</Button>
              <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" loading={removing} onClick={handleRemove}>Remove</Button>
            </div>
          </div>
        </div>
      ) : (
        // ===== Drop zone =====
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && !uploading) handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`mt-4 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            ${dragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'}
            disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-300 disabled:hover:bg-transparent`}
        >
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="text-sm font-medium text-primary-700">Uploading… {progress}%</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <span className="text-3xl" aria-hidden="true">⬆️</span>
              <span className="mt-2 text-sm font-medium text-slate-700">
                {disabled ? 'Accept the consent above to upload' : 'Click to upload or drag & drop'}
              </span>
              <span className="mt-1 text-xs text-slate-500">PDF, JPG or PNG · max 5 MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
