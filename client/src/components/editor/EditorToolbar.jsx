import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorState } from '@tiptap/react';

// Word maadhiri toolbar — font, size, color, bold, italic, underline, align, headings, lists
// Desktop: groups wrap aagum | Mobile: oru line-la horizontal scroll
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
const COLORS = ['#000000', '#374151', '#1e3a5f', '#0f766e', '#7f1d1d', '#b45309', '#2553e0', '#15803d', '#dc2626', '#7c3aed'];

// Simple line icons (24x24)
const PATHS = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  alignLeft: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  alignCenter: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  alignRight: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  justify: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  bullet: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  ordered: 'M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M4.2 15.2a1 1 0 0 1 1.8.6c0 .9-2 1.4-2 2.2h2',
  clear: 'M4 7V5h11v2M9.5 5l-3 14M14 14l6 6M20 14l-6 6',
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[name]} />
  </svg>
);

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
      className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 text-[15px] transition
        ${active ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-700 hover:bg-white hover:shadow-sm'}
        disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:shadow-none`}
    >
      {children}
    </button>
  );
}

// Oru group (e.g. B I U S) — light grey pill
const Group = ({ label, children }) => (
  <div role="group" aria-label={label} className="flex shrink-0 items-center gap-0.5 rounded-lg bg-slate-100/80 p-0.5">
    {children}
  </div>
);

const selectClass =
  'h-8 shrink-0 cursor-pointer rounded-md border-0 bg-white px-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300';

/** Color picker — popup "fixed" position-la (toolbar scroll aanaalum cut aagaadhu) */
function ColorPicker({ color, onPick, onReset }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!pos) return undefined;
    const close = (e) => {
      if (!boxRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setPos(null);
    };
    const hide = () => setPos(null);
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', hide);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btnRef.current.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - 196);
    return setPos({ top: r.bottom + 6, left: Math.max(8, left) });
  };

  return (
    <>
      <span ref={btnRef} className="flex">
        <Btn title="Text color" active={!!pos} onClick={toggle}>
          <span className="flex flex-col items-center leading-none">
            <span className="text-[15px] font-semibold">A</span>
            <span className="mt-0.5 h-[3px] w-4 rounded" style={{ background: color }} />
          </span>
        </Btn>
      </span>
      {pos && createPortal(
        <div ref={boxRef} role="dialog" aria-label="Text color" style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-[188px] rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
          <p className="mb-2 text-xs font-medium text-slate-500">Text colour</p>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" title={c} aria-label={`Color ${c}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(c); setPos(null); }}
                className={`h-7 w-7 rounded-full ring-offset-2 transition hover:scale-110 ${color === c ? 'ring-2 ring-primary-500' : 'ring-1 ring-slate-200'}`}
                style={{ background: c }} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-slate-600 hover:bg-slate-50">
              <span className="h-5 w-5 rounded-full border border-dashed border-slate-400 text-center leading-5">+</span>
              Custom
              <input type="color" className="sr-only" value={color} onChange={(e) => onPick(e.target.value)} />
            </label>
            <button type="button" className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              onMouseDown={(e) => e.preventDefault()} onClick={() => { onReset(); setPos(null); }}>
              Reset
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

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
    <div
      role="toolbar"
      aria-label="Formatting"
      className="editor-toolbar flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur sm:flex-wrap sm:overflow-visible sm:px-3"
    >
      <Group label="History">
        <Btn title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}><Icon name="undo" /></Btn>
        <Btn title="Redo (Ctrl+Y)" onClick={() => chain().redo().run()} disabled={!s.canRedo}><Icon name="redo" /></Btn>
      </Group>

      <Group label="Text style">
        <select aria-label="Text style" className={`${selectClass} w-[118px]`} value={s.block} onChange={(e) => setBlock(e.target.value)}>
          <option value="p">Normal text</option>
          <option value="h1">Title</option>
          <option value="h2">Heading</option>
          <option value="h3">Sub-heading</option>
        </select>
        <select aria-label="Font family" className={`${selectClass} w-[132px]`} value={s.font}
          onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}>
          {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select aria-label="Font size" className={`${selectClass} w-[64px]`} value={s.size}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}>
          {SIZES.map((sz) => <option key={sz || 'default'} value={sz}>{sz ? sz.replace('pt', '') : 'Size'}</option>)}
        </select>
      </Group>

      <Group label="Format">
        <Btn title="Bold (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
        <Btn title="Italic (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}><i className="font-serif text-base">I</i></Btn>
        <Btn title="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}><u>U</u></Btn>
        <Btn title="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>
        <ColorPicker color={s.color} onPick={(c) => chain().setColor(c).run()} onReset={() => chain().unsetColor().run()} />
      </Group>

      <Group label="Alignment">
        {[
          ['left', 'Align left', 'alignLeft'],
          ['center', 'Align center', 'alignCenter'],
          ['right', 'Align right', 'alignRight'],
          ['justify', 'Justify', 'justify'],
        ].map(([a, label, icon]) => (
          <Btn key={a} title={label} active={s.align === a} onClick={() => chain().setTextAlign(a).run()}><Icon name={icon} /></Btn>
        ))}
      </Group>

      <Group label="Lists">
        <Btn title="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}><Icon name="bullet" /></Btn>
        <Btn title="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}><Icon name="ordered" /></Btn>
        <Btn title="Clear formatting" onClick={() => chain().unsetAllMarks().unsetTextAlign().run()}><Icon name="clear" /></Btn>
      </Group>
    </div>
  );
}
