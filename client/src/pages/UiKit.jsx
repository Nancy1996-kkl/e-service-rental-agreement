import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Alert from '../components/common/Alert.jsx';
import Loader from '../components/common/Loader.jsx';
import { DURATION_OPTIONS } from '../utils/constants.js';

// Developer page — namma reusable components ellam epdi irukku-nu oru idathula paakka.
// URL: http://localhost:5173/ui-kit  (Production-la idha remove pannidalam)
export default function UiKit() {
  const [loading, setLoading] = useState(false);

  const fakeSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Saved successfully!');
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">UI Kit</h1>

      <Block title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button loading={loading} onClick={fakeSave}>{loading ? 'Saving...' : 'Click to test loading'}</Button>
        </div>
      </Block>

      <Block title="Form fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Owner Full Name" placeholder="e.g. Ramesh Kumar" required />
          <Input label="Mobile Number" type="tel" placeholder="10-digit number" hint="We'll never share your number." />
          <Input label="Email" type="email" defaultValue="wrong-email" error="Enter a valid email address" />
          <Select label="Agreement Duration" options={DURATION_OPTIONS} required />
        </div>
      </Block>

      <Block title="Alerts">
        <div className="space-y-3">
          <Alert type="success" title="Agreement saved">Your draft has been saved.</Alert>
          <Alert type="error" title="Upload failed">Only PDF, JPG and PNG files are allowed.</Alert>
          <Alert type="warning">Please complete all required fields.</Alert>
          <Alert type="info">Generated documents are drafts.</Alert>
        </div>
      </Block>

      <Block title="Loader">
        <Loader text="Loading agreements..." />
      </Block>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}
