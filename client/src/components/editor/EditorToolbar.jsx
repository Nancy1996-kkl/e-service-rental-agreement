import { useEditorState } from '@tiptap/react';

// Word maadhiri toolbar — font, size, color, bold, italic, underline, align, headings, lists
const FONTS = [
  { value: '', label: 'Default font' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Courier New", monospace', label: 'Courier New' },
];
const SIZES = ['', '9pt', '10pt', '11pt', '12pt', '13pt', '14pt', '16pt', '18pt', '20pt', '24pt'];
const COLORS = ['#000000', '#1e3a5f', '#0f766e', '#7f1d1d', '#b45309', '#2553e0', '#15803d', '#dc2626', '#6b7280'];

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // Editor focus pogaama irukka
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition
        ${active ? 'bg-primary-100 text-primary-700' : 'text-slate-700 hover:bg-slate-100'}
        disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />;

const selectClass =
  'h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200';

export default function EditorToolbar({ editor }) {
  // Toolbar buttons active-ah (e.g. Bold on) nu track panna
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      align: ['left', 'center', 'right', 'justify'].find((a) => e.isActive({ textAlign: a })) || 'left',
      block: e.isActive('heading', { level: 1 }) ? 'h1' : e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      font: e.getAttributes('textStyle').fontFamily || '',
      size: e.getAttributes('textStyle').fontSize || '',
      color: e.getAttributes('textStyle').color || '#000000',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const setBlock = (value) => {
    if (value === 'p') chain().setParagraph().run();
    else chain().toggleHeading({ level: Number(value[1]) }).run();
  };

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2 py-2">
      <Btn title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}>↶</Btn>
      <Btn title="Redo (Ctrl+Y)" onClick={() => chain().redo().run()} disabled={!s.canRedo}>↷</Btn>
      <Divider />

      <select aria-label="Text style" className={selectClass} value={s.block} onChange={(e) => setBlock(e.target.value)}>
        <option value="p">Normal text</option>
        <option value="h1">Title</option>
        <option value="h2">Heading</option>
        <option value="h3">Sub-heading</option>
      </select>
      <select aria-label="Font family" className={`${selectClass} w-36`} value={s.font}
        onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}>
        {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
      </select>
      <select aria-label="Font size" className={`${selectClass} w-20`} value={s.size}
        onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}>
        {SIZES.map((sz) => <option key={sz || 'default'} value={sz}>{sz ? sz.replace('pt', '') : 'Size'}</option>)}
      </select>
      <Divider />

      <Btn title="Bold (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
      <Btn title="Italic (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}><i className="font-serif">I</i></Btn>
      <Btn title="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}><u>U</u></Btn>
      <Btn title="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>

      {/* Font color */}
      <div className="group relative">
        <Btn title="Text color">
          <span className="flex flex-col items-center leading-none">
            <span className="font-semibold">A</span>
            <span className="mt-0.5 h-1 w-4 rounded" style={{ background: s.color }} />
          </span>
        </Btn>
        <div className="invisible absolute left-0 top-9 z-20 w-44 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-200 group-focus-within:visible group-hover:visible">
          <div className="grid grid-cols-5 gap-1.5">
            {COLORS.map((c) => (
              <button key={c} type="button" title={c} aria-label={`Color ${c}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => chain().setColor(c).run()}
                className="h-6 w-6 rounded border border-slate-200" style={{ background: c }} />
            ))}
            <label className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-slate-200 text-xs" title="Custom color">
              +
              <input type="color" className="sr-only" value={s.color} onChange={(e) => chain().setColor(e.target.value).run()} />
            </label>
          </div>
          <button type="button" className="mt-2 w-full rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            onMouseDown={(e) => e.preventDefault()} onClick={() => chain().unsetColor().run()}>
            Reset color
          </button>
        </div>
      </div>
      <Divider />

      {[
        ['left', 'Align left', '⇤'],
        ['center', 'Align center', '≡'],
        ['right', 'Align right', '⇥'],
        ['justify', 'Justify', '☰'],
      ].map(([a, label, icon]) => (
        <Btn key={a} title={label} active={s.align === a} onClick={() => chain().setTextAlign(a).run()}>{icon}</Btn>
      ))}
      <Divider />

      <Btn title="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>•≡</Btn>
      <Btn title="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>1.</Btn>
      <Divider />
      <Btn title="Clear formatting" onClick={() => chain().unsetAllMarks().unsetTextAlign().run()}>⌫</Btn>
    </div>
  );
}
