import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import { WIZARD_STEPS } from '../../utils/constants.js';

// Innum build pannaadha steps-ku temporary page (Phase 8 – 12-la real pages varum)
export default function StepPlaceholder() {
  const { step } = useParams();
  const navigate = useNavigate();
  const index = WIZARD_STEPS.findIndex((s) => s.key === step);
  const prev = WIZARD_STEPS[index - 1];

  return (
    <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <p className="text-4xl" aria-hidden="true">🚧</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">{WIZARD_STEPS[index]?.label || 'This step'} — coming soon</h1>
      <p className="mt-2 text-sm text-slate-600">Your details are saved. This step will be available in the next update.</p>
      <div className="mt-6 flex justify-center gap-3">
        {prev && <Button variant="secondary" onClick={() => navigate(`../${prev.key}`)}>Back</Button>}
        <Button to="/dashboard">Go to Dashboard</Button>
      </div>
    </div>
  );
}
