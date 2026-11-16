import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import Alert from '../components/common/Alert.jsx';
import { AGREEMENT_STEPS } from '../utils/constants.js';
import { useTemplates } from '../hooks/useTemplates.js';

const FEATURES = [
  { title: 'Ready templates', text: 'Four agreement formats with your details filled in automatically.' },
  { title: 'Word-like editor', text: 'Change fonts, sizes, colours, alignment and lists in the browser.' },
  { title: 'Live preview', text: 'See the full agreement update as you type.' },
  { title: 'Secure uploads', text: 'ID documents are encrypted and visible only to you and the admin.' },
  { title: 'Word & PDF', text: 'Download a print-ready agreement in either format.' },
  { title: 'Saved history', text: 'Log in any time to view or reuse previous agreements.' },
];

export default function Home() {
  const { templates, loading, error } = useTemplates();

  return (
    <>
      {/* ===== Hero section ===== */}
      <section className="bg-gradient-to-b from-primary-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 shadow-sm">
            Online rental agreements in minutes
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Create your rental agreement online — fill, customize, download.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            Choose a template, enter owner, tenant and property details, and get a ready-to-print
            agreement in Word or PDF.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/register" size="lg">Create Agreement</Button>
            <Button to="/#templates" size="lg" variant="secondary">View Templates</Button>
          </div>
        </div>
      </section>

      {/* ===== Templates section ===== */}
      <section id="templates" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <SectionHeading
          title={`Choose from ${templates?.length || 'our'} agreement templates`}
          text="Pick the format that matches your property. Your details fill in automatically."
        />
        {loading && <Loader />}
        {error && (
          <Alert type="error" className="mx-auto mt-8 max-w-lg">
            Templates could not be loaded. Please make sure the server is running and refresh the page.
          </Alert>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates?.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden="true">{t.icon}</span>
              <h3 className="mt-4 font-semibold text-slate-900">{t.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{t.description}</p>
              <Button to="/register" variant="outline" size="sm" className="mt-5">
                Use this template
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how-it-works" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading title="How it works" text="Seven simple steps from start to download." />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AGREEMENT_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-slate-200 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading title="Everything you need" text="Built to make rental paperwork simple and safe." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-primary-700 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to create your agreement?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-100">
            Register for free and save all your agreements in one place.
          </p>
          <Button to="/register" size="lg" variant="secondary" className="mt-7">
            Get Started
          </Button>
        </div>
      </section>
    </>
  );
}

// Ella section-kum same heading style — chinna reusable component
function SectionHeading({ title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-3 text-slate-600">{text}</p>
    </div>
  );
}
