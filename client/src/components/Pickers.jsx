import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';

// Themed replacements for the browser's native dropdown and time popups, which ignore the site's palette.
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return [open, setOpen, ref];
}

/** options: [{ value, label }]; shows `placeholder` text when value matches nothing. */
export function Dropdown({ id, value, options, onChange, label, display }) {
  const [open, setOpen, ref] = usePopover();
  const uid = useId();
  const listRef = useRef(null);
  const cur = options.find((o) => o.value === value);
  useEffect(() => { if (open) listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [open]);
  const move = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const n = options[Math.min(options.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (n) onChange(n.value);
    setOpen(true);
  };
  return (
    <div className="pick" ref={ref}>
      <button type="button" id={id} className="pick-btn" aria-haspopup="listbox" aria-expanded={open} aria-controls={uid} aria-label={label} onClick={() => setOpen(!open)} onKeyDown={move}>
        <span>{display || cur?.label || ''}</span><ChevronDown size={16} className="pick-chev" />
      </button>
      {open && (
        <ul className="pick-list" id={uid} role="listbox" ref={listRef}>
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span>{o.label}</span>{o.value === value && <Check size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINS = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n) => String(n).padStart(2, '0');
function split(v) {
  const [h, m] = (v || '09:00').split(':').map(Number);
  return { h12: h % 12 || 12, m: Number.isFinite(m) ? m : 0, pm: h >= 12 };
}
const join = (h12, m, pm) => `${pad((h12 % 12) + (pm ? 12 : 0))}:${pad(m)}`;
export const fmtTime = (v) => { const { h12, m, pm } = split(v); return `${pad(h12)}:${pad(m)} ${pm ? 'PM' : 'AM'}`; };

/** value and onChange use 24 hour "HH:MM", like <input type="time">. */
export function TimePicker({ id, value, onChange, label }) {
  const [open, setOpen, ref] = usePopover();
  const { h12, m, pm } = split(value);
  const set = (nh, nm, np) => onChange(join(nh, nm, np));
  useEffect(() => { if (open) ref.current?.querySelectorAll('.on').forEach((el) => el.scrollIntoView({ block: 'center' })); }, [open, ref]);
  return (
    <div className="pick" ref={ref}>
      <button type="button" id={id} className="pick-btn" aria-haspopup="dialog" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>
        <span>{fmtTime(value)}</span><Clock size={16} className="pick-chev" />
      </button>
      {open && (
        <div className="pick-time" role="dialog" aria-label={label}>
          <div className="pick-col">{HOURS.map((h) => <button type="button" key={h} className={h === h12 ? 'on' : ''} onClick={() => set(h, m, pm)}>{pad(h)}</button>)}</div>
          <div className="pick-col">{MINS.map((x) => <button type="button" key={x} className={x === m ? 'on' : ''} onClick={() => set(h12, x, pm)}>{pad(x)}</button>)}</div>
          <div className="pick-col ampm">{['AM', 'PM'].map((x) => <button type="button" key={x} className={(x === 'PM') === pm ? 'on' : ''} onClick={() => set(h12, m, x === 'PM')}>{x}</button>)}</div>
        </div>
      )}
    </div>
  );
}
