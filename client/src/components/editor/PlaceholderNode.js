import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { REQUIRED_LABELS } from '../../utils/placeholders.js';

/**
 * 🔒 Placeholder chip — {{owner_name}} maadhiri details editor-la LOCKED chip-ah varum.
 * - User type panni maatha mudiyaadhu (details step-la dhaan maathanum)
 * - Delete / Backspace pannaalum azhiyaadhu (protect plugin)
 * - Save aagumbodhu thirumba {{owner_name}}-ah maarum → PDF-la latest details varum
 */
const prettyKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function countPlaceholders(doc) {
  const counts = {};
  doc.descendants((node) => {
    if (node.type.name === 'placeholder') counts[node.attrs.key] = (counts[node.attrs.key] || 0) + 1;
  });
  return counts;
}

export const PlaceholderNode = Node.create({
  name: 'placeholder',
  group: 'inline',
  inline: true,
  atom: true, // Ulla cursor poga mudiyaadhu — oru unit-ah dhaan
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      values: {}, // { owner_name: 'Ravi Kumar', ... }
      onBlocked: () => {}, // Delete panna try pannaa call aagum
    };
  },

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-ph'),
        renderHTML: (attrs) => ({ 'data-ph': attrs.key }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ph]' }];
  },

  // Save aagura HTML: <span data-ph="owner_name" class="ph-chip">{{owner_name}}</span>
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'ph-chip' }), `{{${node.attrs.key}}}`];
  },

  // Editor-la kaattura view: real value (e.g. "Ravi Kumar")
  addNodeView() {
    const { values } = this.options;
    return ({ node }) => {
      const key = node.attrs.key;
      const value = values[key];
      const dom = document.createElement('span');
      dom.setAttribute('data-ph', key);
      dom.contentEditable = 'false';
      dom.title = 'Filled automatically from your details (edit them in the Details or Terms step)';

      if (key === 'terms_and_conditions') {
        dom.className = 'ph-chip ph-block';
        dom.innerHTML = value || '<em>[Terms &amp; conditions]</em>'; // value already safe HTML (shared/terms.js)
      } else {
        dom.className = value ? 'ph-chip' : 'ph-chip ph-chip-empty';
        dom.textContent = value || `[${REQUIRED_LABELS[key] || prettyKey(key)}]`;
      }
      return { dom };
    };
  },

  addProseMirrorPlugins() {
    const { onBlocked } = this.options;
    return [
      new Plugin({
        key: new PluginKey('protectPlaceholders'),
        // Edhavadhu change placeholder-ah delete pannumna, andha change-ah cancel pannrom
        filterTransaction(tr, state) {
          if (!tr.docChanged || tr.getMeta('allowPlaceholderRemoval')) return true;
          const before = countPlaceholders(state.doc);
          const after = countPlaceholders(tr.doc);
          const ok = Object.keys(before).every((k) => (after[k] || 0) >= before[k]);
          if (!ok) onBlocked();
          return ok;
        },
      }),
    ];
  },
});

/** Template HTML ({{owner_name}}) → editor HTML (<span data-ph="owner_name">) */
export function toEditorHtml(html) {
  return (html || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, '<span data-ph="$1"></span>');
}
