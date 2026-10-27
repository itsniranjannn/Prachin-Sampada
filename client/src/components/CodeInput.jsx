import { useRef } from 'react';

/** Six single-digit boxes that behave like one field: auto-advance, backspace, arrow keys and paste of the whole code. */
export function CodeInput({ value, onChange, onComplete, disabled, label = 'Code' }) {
  const refs = useRef([]);
  const digits = String(value || '').padEnd(6, ' ').slice(0, 6).split('');
  const set = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
  };
  const focus = (i) => refs.current[Math.max(0, Math.min(5, i))]?.focus();
  return (
    <div className="code-boxes" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="code-box"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={d.trim()}
          aria-label={`${label} digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            const cur = String(value || '').split('');
            if (!v) { cur[i] = ''; set(cur.join('')); return; }
            cur[i] = v.slice(-1);
            set(cur.join('').padEnd(i + 1, ' ').replace(/ /g, ''));
            focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim()) { e.preventDefault(); focus(i - 1); }
            if (e.key === 'ArrowLeft') focus(i - 1);
            if (e.key === 'ArrowRight') focus(i + 1);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/\d/.test(text)) { e.preventDefault(); set(text); focus(Math.min(5, text.replace(/\D/g, '').length)); }
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
