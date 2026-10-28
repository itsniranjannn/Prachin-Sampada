// Live interface translation. With the Nepali toggle on, every English text on the page that is in the dictionary is
// swapped for its Nepali version (text nodes, placeholders, titles, aria-labels, alt text), including text that React
// draws later. Switching back to English restores the originals. Text that already contains Devanagari is left alone.
import NP from '../data/ui-np.json';
import EXTRA from '../data/ui-extra-np.json';
import NAMES from '../data/names-np.json';
import CONTENT from '../data/content-np.json';
import MORE from '../data/ui-more-np.json';

const dict = new Map();
for (const src of [NP, EXTRA, MORE, CONTENT, NAMES]) for (const [k, v] of Object.entries(src)) if (k && v && k !== v) dict.set(k.replace(/\s+/g, ' ').trim(), v);

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const textState = new WeakMap(); // text node -> { orig, applied }
const attrState = new WeakMap(); // element -> { attr: { orig, applied } }
const LATIN = /[A-Za-z]{2}/;
const DEVA = /[ऀ-ॿ]/;
const SKIP = 'script,style,textarea,input,canvas,svg,iframe,.maplibregl-map,.shloka-iast,.credit,.credit-list,.find-credit,.gal-cap small,.scan-frame figcaption,[data-notranslate]';

export const missing = new Set();

const dv = (n) => String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]);
// sentences built around numbers
const PATTERNS = [
  [/^(\d+) heritage sites?$/, (m) => `${dv(m[1])} सम्पदा स्थल`],
  [/^(\d+) of (\d+) places$/, (m) => `${dv(m[2])} मध्ये ${dv(m[1])} ठाउँ`],
  [/^(\d+) of (\d+) earned$/, (m) => `${dv(m[2])} मध्ये ${dv(m[1])} पाइयो`],
  [/^(\d+) stars?$/, (m) => `${dv(m[1])} तारा`],
  [/^Photo (\d+)$/, (m) => `फोटो ${dv(m[1])}`],
  [/^Open photo (\d+) full screen$/, (m) => `फोटो ${dv(m[1])} पूरा स्क्रिनमा हेर्नुहोस्`],
  [/^Level (\d+) of (\d+)$/, (m) => `${dv(m[2])} मध्ये स्तर ${dv(m[1])}`],
  [/^(\d+) temples, stupas, palaces and pilgrim sites$/, (m) => `${dv(m[1])} मन्दिर, स्तुप, दरबार र तीर्थस्थल`],
  [/^Rs ([\d,]+)$/, (m) => `रु ${dv(m[1])}`],
  [/^(\d+) questions?$/, (m) => `${dv(m[1])} प्रश्न`],
  [/^(\d+) roofs?$/, (m) => `${dv(m[1])} छाना`],
  [/^(\d+) storeys?$/, (m) => `${dv(m[1])} तला`],
  [/^(\d+) min$/, (m) => `${dv(m[1])} मिनेट`],
  [/^(\d{1,2}):(\d{2}) (AM|PM)$/, (m) => `${m[3] === 'AM' ? 'बिहान' : +m[1] === 12 || +m[1] < 6 ? 'दिउँसो' : 'साँझ'} ${dv(+m[1])}:${dv(m[2])}`],
  [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/, (m) => `${dv(m[1])} ${MONTHS[m[2]]}`],
  [/^([\d.]+) km$/, (m) => `${dv(m[1])} किमी`],
  [/^(.+) district$/, (m) => `${dict.get(m[1]) || m[1]} जिल्ला`],
  [/^(.+) Province$/, (m) => (dict.get(m[1]) ? `${dict.get(m[1])} प्रदेश` : null)],
];
const MONTHS = { Jan: 'जनवरी', Feb: 'फेब्रुअरी', Mar: 'मार्च', Apr: 'अप्रिल', May: 'मे', Jun: 'जुन', Jul: 'जुलाई', Aug: 'अगस्ट', Sep: 'सेप्टेम्बर', Oct: 'अक्टोबर', Nov: 'नोभेम्बर', Dec: 'डिसेम्बर' };
// the 3D viewer caption always ends with this hint; the part before it is the monument's own description
const ORBIT = ' Drag to orbit, scroll to zoom.';
const ORBIT_NP = ' घुमाउन तान्नुहोस्, ठूलो-सानो गर्न स्क्रोल गर्नुहोस्।';

// text that is already mixed: translate the English pieces between commas and fix the unit
function mixed(core) {
  let out = core.replace(/ km(?![A-Za-z])/g, ' किमी');
  const parts = out.split(/(, )/);
  if (parts.length > 1) out = parts.map((p) => (LATIN.test(p) && !DEVA.test(p) ? (dict.get(p) || fromPattern(p) || p) : p)).join('');
  return out;
}
function fromPattern(core) {
  for (const [re, fn] of PATTERNS) { const x = core.match(re); const r = x && fn(x); if (r) return r; }
  return null;
}

function lookup(raw) {
  const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = m[2].replace(/\s+/g, ' ');
  if (!core || !LATIN.test(core)) return null;
  if (DEVA.test(core)) {
    // "English · नेपाली" headings that carry both languages: keep only the Nepali half
    const both = core.match(/^[A-Za-z][^ऀ-ॿ]*? · ([ऀ-ॿ].*)$/);
    if (both) return m[1] + both[1] + m[3];
    const fixed = mixed(core);
    return fixed !== core ? m[1] + fixed + m[3] : null;
  }
  const hit = dict.get(core);
  if (hit) return m[1] + hit + m[3];
  if (core.endsWith(ORBIT)) {
    const base = dict.get(core.slice(0, -ORBIT.length));
    if (base) return m[1] + base + ORBIT_NP + m[3];
  }
  const pat = fromPattern(core);
  if (pat) return m[1] + pat + m[3];
  // "Name, Province" and "Name · Province" labels: translate each side that is known
  const parts = core.split(/(, | · )/);
  if (parts.length > 1) {
    const joined = parts.map((p) => (/^(, | · )$/.test(p) ? p : (dict.get(p) || fromPattern(p) || p))).join('');
    if (joined !== core) return m[1] + joined + m[3];
  }
  missing.add(core);
  return null;
}

function doText(node) {
  const st = textState.get(node);
  if (st && node.nodeValue === st.applied) return;
  const orig = node.nodeValue;
  let out = lookup(orig);
  // "Live heritage hunt · <span lang="ne">…</span>": the Nepali span already says it, so drop the English lead-in
  const sib = node.nextSibling;
  if (!out && /·\s*$/.test(orig) && LATIN.test(orig) && sib?.nodeType === 1 && sib.lang === 'ne') out = ' ';
  if (out && out !== orig) { textState.set(node, { orig, applied: out }); node.nodeValue = out; } else if (st) textState.delete(node);
}
function doAttrs(el) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (!cur) continue;
    const rec = attrState.get(el) || {};
    if (rec[a] && cur === rec[a].applied) continue;
    const out = lookup(cur);
    if (out && out !== cur) { rec[a] = { orig: cur, applied: out }; attrState.set(el, rec); el.setAttribute(a, out); }
  }
}
function walk(root) {
  if (root.nodeType === 3) { if (!root.parentElement?.closest(SKIP)) doText(root); return; }
  if (root.nodeType !== 1 || root.closest?.(SKIP)) return;
  doAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === 3) { if (!n.parentElement?.closest(SKIP)) doText(n); } else if (!n.matches?.(SKIP)) doAttrs(n);
    n = tw.nextNode();
  }
}
function revert(root) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = tw.currentNode;
  while (n) {
    if (n.nodeType === 3) {
      const st = textState.get(n);
      if (st && n.nodeValue === st.applied) n.nodeValue = st.orig;
      textState.delete(n);
    } else if (n.nodeType === 1) {
      const rec = attrState.get(n);
      if (rec) for (const [a, v] of Object.entries(rec)) if (n.getAttribute(a) === v.applied) n.setAttribute(a, v.orig);
      attrState.delete(n);
    }
    n = tw.nextNode();
  }
}

let observer = null;
export function startTranslating() {
  if (observer) return;
  walk(document.body);
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') walk(m.target);
      else if (m.type === 'attributes') { if (m.target.nodeType === 1 && !m.target.closest(SKIP)) doAttrs(m.target); } else m.addedNodes.forEach((n) => walk(n));
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
export function stopTranslating() {
  if (observer) { observer.disconnect(); observer = null; }
  revert(document.body);
}
if (typeof window !== 'undefined') window.__npMissing = missing;
