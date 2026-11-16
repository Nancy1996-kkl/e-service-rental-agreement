import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import TemplateComparePreview from './TemplateComparePreview.jsx';

/**
 * Details page-la "Preview Document" popup.
 * Ellaa templates-layum ippo type panna details-ah apply panni switch panni paakkalaam.
 */
export default function DocumentPreviewModal({ open, onClose, templateId, data, onUseTemplate, using }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Preview your agreement"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            <span className="rounded bg-amber-100 px-1 text-amber-800">Highlighted</span> parts are not filled yet.
          </p>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      {open && (
        <TemplateComparePreview data={data} selectedId={templateId} onUse={onUseTemplate} using={using} />
      )}
    </Modal>
  );
}
