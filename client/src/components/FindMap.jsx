// Map for the Find game: a draggable guess pin that bounces in, an animated line to the real place, and a review mode.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MapView, { NEPAL, VALLEY } from './MapView.jsx';

const PIN_SVG = '<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 2 24.5 2 14.5a13 13 0 0 1 26 0C28 24.5 15 39 15 39z" fill="#27187E" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="14.5" r="4.6" fill="#fff"/></svg>';
const FLAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const SRC = 'fm-lines';

/** Run fn once the style accepts sources; retry on styledata until it does. */
function whenReady(m, fn) {
  const go = () => { try { fn(); return true; } catch { return false; } };
  if (go()) return () => {};
  const h = () => { if (go()) m.off('styledata', h); };
  m.on('styledata', h);
  return () => m.off('styledata', h);
}

function setLines(m, feats) {
  const data = { type: 'FeatureCollection', features: feats };
  if (m.getSource(SRC)) { m.getSource(SRC).setData(data); return; }
  m.addSource(SRC, { type: 'geojson', data });
  m.addLayer({ id: `${SRC}-casing`, type: 'line', source: SRC, paint: { 'line-color': '#fff3e6', 'line-width': 8, 'line-opacity': 0.92 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
  m.addLayer({ id: `${SRC}-line`, type: 'line', source: SRC, paint: { 'line-color': '#81021f', 'line-width': 4, 'line-dasharray': [1.4, 1.6] }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
}
const feat = (a, b) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [a, b] } });

/**
 * Props: scope 'valley'|'nepal', pin {lat,lng}|null, onPin(p), locked, answer {lat,lng}|null, distText,
 * pairs [{guess,answer,n}] (review mode), reduce (reduced motion), pinLabel, padding (camera padding for fit).
 */
const FindMap = forwardRef(function FindMap({ scope, pin, onPin, locked, answer, distText, pairs, reduce, pinLabel, padding }, ref) {
  const base = useRef(null);
  const state = useRef({});
  state.current = { onPin, locked, pinLabel, reduce, padding };
  const pinMk = useRef(null);
  const extras = useRef([]); // answer, distance and review markers
  const anim = useRef(0);
  const getMap = () => base.current?.get();

  useImperativeHandle(ref, () => ({
    center: () => { const c = getMap()?.getCenter(); return c ? { lat: c.lat, lng: c.lng } : null; },
    reset: () => base.current?.reset(),
    fit: (pts) => base.current?.fit(pts, state.current.padding || 90),
  }));

  // the guess pin: created once per placement, moved (not recreated) when it is dragged or nudged
  useEffect(() => {
    const m = getMap();
    if (!m) return undefined;
    if (!pin) { pinMk.current?.remove(); pinMk.current = null; return undefined; }
    if (pinMk.current) {
      pinMk.current.setLngLat([pin.lng, pin.lat]);
      pinMk.current.setDraggable(!locked);
      const el0 = pinMk.current.getElement();
      el0.classList.toggle('locked', !!locked);
      if ((pin.how === 'click' || pin.how === 'center') && !state.current.reduce) { el0.classList.remove('drop'); void el0.offsetWidth; el0.classList.add('drop'); }
      return undefined;
    }
    const el = document.createElement('div');
    el.className = `fm-pin ${state.current.reduce ? '' : 'drop'}`;
    el.innerHTML = `<div class="fm-pin-body">${PIN_SVG}</div>`;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', state.current.pinLabel || 'Your guess. Use the arrow keys to move it.');
    const mk = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable: !locked }).setLngLat([pin.lng, pin.lat]).addTo(m);
    mk.on('dragend', () => { const p = mk.getLngLat(); state.current.onPin?.({ lat: p.lat, lng: p.lng }, 'drag'); });
    el.addEventListener('click', (e) => e.stopPropagation());
    el.addEventListener('keydown', (e) => {
      const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (!d || state.current.locked) return;
      e.preventDefault(); e.stopPropagation();
      const step = e.shiftKey ? 60 : 12; // pixels at the current zoom
      const px = m.project(mk.getLngLat());
      const p = m.unproject([px.x + d[0] * step, px.y + d[1] * step]);
      state.current.onPin?.({ lat: p.lat, lng: p.lng }, 'key');
    });
    pinMk.current = mk;
    return undefined;
  }, [pin, locked]);

  useEffect(() => () => { pinMk.current?.remove(); pinMk.current = null; }, []);

  // reveal: draw the line from guess to answer, then drop the answer marker and the distance badge
  useEffect(() => {
    const m = getMap();
    if (!m) return undefined;
    extras.current.forEach((x) => x.remove());
    extras.current = [];
    cancelAnimationFrame(anim.current);
    if (pairs?.length) {
      // review mode: every guess against its answer
      const stop = whenReady(m, () => setLines(m, pairs.filter((p) => p.guess).map((p) => feat([p.guess.lng, p.guess.lat], [p.answer.lng, p.answer.lat]))));
      pairs.forEach((p) => {
        const mk = (cls, pt, label) => {
          const el = document.createElement('div');
          el.innerHTML = `<div class="fm-num ${cls}">${p.n}</div>`; el.title = label;
          extras.current.push(new maplibregl.Marker({ element: el }).setLngLat([pt.lng, pt.lat]).addTo(m));
        };
        mk('answer', p.answer, p.name || '');
        if (p.guess) mk('guess', p.guess, '');
      });
      return () => { stop(); };
    }
    if (!answer) {
      const stop = whenReady(m, () => { if (m.getSource(SRC)) setLines(m, []); });
      return () => { stop(); };
    }
    const b = [answer.lng, answer.lat];
    const a = pin ? [pin.lng, pin.lat] : b;
    const finish = () => {
      const el = document.createElement('div');
      el.innerHTML = `<div class="fm-answer">${FLAG_SVG}</div>`;
      extras.current.push(new maplibregl.Marker({ element: el }).setLngLat(b).addTo(m));
      if (pin && distText) {
        const d = document.createElement('div');
        const bd = document.createElement('div'); bd.className = 'fm-dist'; bd.textContent = distText; d.append(bd);
        extras.current.push(new maplibregl.Marker({ element: d }).setLngLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]).addTo(m));
      }
    };
    let stop = () => {};
    if (!pin) {
      finish(); // time ran out with no pin: show only where it was
    } else if (state.current.reduce) {
      stop = whenReady(m, () => setLines(m, [feat(a, b)]));
      finish();
    } else {
      const t0 = performance.now(); const dur = 900;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur); const e = 1 - (1 - k) ** 3;
        try { setLines(m, [feat(a, [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e])]); } catch { /* style still loading */ }
        if (k < 1) anim.current = requestAnimationFrame(tick); else finish();
      };
      anim.current = requestAnimationFrame(tick);
    }
    return () => { stop(); cancelAnimationFrame(anim.current); };
  }, [answer, pairs, distText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { extras.current.forEach((x) => x.remove()); cancelAnimationFrame(anim.current); }, []);

  return <MapView ref={base} initial={scope === 'nepal' ? NEPAL : VALLEY} pitch={0} bearing={0} popup={false} show3d={false} onMapClick={(p) => { if (!state.current.locked) state.current.onPin?.(p, 'click'); }} />;
});

export default FindMap;
