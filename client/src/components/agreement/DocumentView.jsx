/**
 * Agreement-ah A4 paper maadhiri kaattum.
 * - html: fillTemplate() return pannra final HTML
 * - theme: classic | modern | corporate | elegant (design — index.css-la styles)
 * Mobile-la page width-ku fit aagum; desktop-la real A4 width (210mm).
 */
export default function DocumentView({ html, theme = 'classic' }) {
  return (
    <div className="bg-slate-100 px-2 py-6 sm:px-6">
      <article
        className={`agreement-doc doc-theme-${theme} mx-auto w-full max-w-[210mm] bg-white shadow-md`}
        // Values ellam fillTemplate()-la escape aagidum; template HTML admin-dhu
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
