import Button from '../components/common/Button.jsx';

// Temporary page — Login/Register Phase 5-la real page-ah maarum
export default function ComingSoon({ title = 'Coming soon' }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">This page is being built and will be available soon.</p>
      <Button to="/" variant="secondary" className="mt-6">Back to Home</Button>
    </div>
  );
}
