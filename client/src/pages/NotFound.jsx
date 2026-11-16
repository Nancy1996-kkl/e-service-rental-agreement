import Button from '../components/common/Button.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">The page you are looking for doesn&apos;t exist.</p>
      <Button to="/" className="mt-6">Back to Home</Button>
    </div>
  );
}
