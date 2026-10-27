// MapLibre GL map with free OpenFreeMap vector tiles, a tilted 3D camera and heritage pins.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { createElement, Suspense as ReactSuspense } from 'react';
import { createRoot } from 'react-dom/client';

export const VALLEY = { center: [85.345, 27.69], zoom: 11.6 };
export const NEPAL = { center: [84.15, 28.25], zoom: 6.3 };
const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const ICONS = {
  stupa: '<path d="M12 3v3M8 10a4 4 0 0 1 8 0M5 20v-4a7 7 0 0 1 14 0v4M3 20h18M10 13h4" />',
  shikhara: '<path d="M12 2l3 7v4H9V9zM7 13h10v7H7zM4 20h16" />',
  palace: '<path d="M3 21h18M5 21V11l7-5 7 5v10M9 21v-5h6v5M9 11h.01M15 11h.01" />',
  square: '<path d="M3 21h18M5 21V11l7-5 7 5v10M9 21v-5h6v5" />',
  default: '<path d="M12 3l6 5H6zM4 12l8-4 8 4zM6 12v4h12v-4M3 20l9-4 9 4zM12 2v1" />',
};
const iconFor = (t) => ICONS[t] || (['courtyard', 'museum', 'gate', 'window'].includes(t) ? ICONS.palace : ICONS.default);

function pinEl(m) {
  const el = document.createElement('div');
  el.className = `map-pin ${m.unesco ? 'unesco' : ''} ${m.type === 'stupa' ? 'stupa' : ''} ${m.type === 'shikhara' ? 'shikhara' : ''} ${m.stamped ? 'stamped' : ''} ${m.pulse ? 'pulse' : ''}`;
  el.innerHTML = `<div class="pin-core"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconFor(m.type)}</svg></div>`;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', m.name);
  el.tabIndex = 0;
  return el;
}

/**
 * Props: markers [{id,lat,lng,type,name,unesco,stamped,pulse}], numbered (show 1..n badges instead of pins),
 * route [[lng,lat],...], routeColor, onSelect(marker), onMapClick({lat,lng}), extra [{lat,lng,color,label}] (guess pins),
 * lines [{from:[lng,lat], to:[lng,lat], color}], pitch, bearing, start {lat,lng}, fitOnChange
 */
const MapView = forwardRef(function MapView({
  markers = [], numbered = false, route = null, routeColor = '#81021f', onSelect, onMapClick, extra = [], lines = [],
  pitch = 55, bearing = -12, start = null, fitOnChange = false, interactive = true, initial = VALLEY, popup = true, show3d = true, padding = null, cluster = false, model3d = null,
}, ref) {
  const el = useRef(null);
  const map = useRef(null);
  const live = useRef([]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [zoomStep, setZoomStep] = useState(Math.floor(initial.zoom * 2) / 2);
  const cb = useRef({ onSelect, onMapClick });
  cb.current = { onSelect, onMapClick };

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom = 17, opts = {}) => map.current?.flyTo({ center: [lng, lat], zoom, pitch: opts.pitch ?? 62, bearing: opts.bearing ?? map.current.getBearing() + 20, speed: 0.9, curve: 1.5, essential: true }),
    fit: (pts, pad = 70) => fitPoints(map.current, pts, pad),
    reset: () => map.current?.flyTo({ center: initial.center, zoom: initial.zoom, pitch, bearing, speed: 1.2 }),
    get: () => map.current,
  }));

  useEffect(() => {
    let m;
    try {
      m = new maplibregl.Map({
        container: el.current, style: STYLE, center: initial.center, zoom: initial.zoom, pitch, bearing,
        maxPitch: 75, attributionControl: { compact: true }, interactive, dragRotate: true,
      });
    } catch (e) { setFailed(true); return undefined; }
    map.current = m;
    if (interactive) m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    const t = setTimeout(() => { if (!m.isStyleLoaded()) setFailed(true); }, 12000);
    m.on('load', () => {
      clearTimeout(t);
      setLoaded(true);
      // warm golden-hour feel: tint 3D buildings with brick and timber
      const layers = m.getStyle().layers || [];
      for (const l of layers) {
        if (l.type === 'fill-extrusion') {
          m.setPaintProperty(l.id, 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#ead6c2', 12, '#c08a7a', 30, '#81021f']);
          m.setPaintProperty(l.id, 'fill-extrusion-opacity', 0.85);
          if (!show3d) m.setLayoutProperty(l.id, 'visibility', 'none');
        }
      }
      if (m.getLayer('background')) m.setPaintProperty('background', 'background-color', '#f6ebcf');
    });
    m.on('error', (e) => { if (String(e?.error?.message || '').includes('style')) setFailed(true); });
    m.on('click', (e) => cb.current.onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    m.on('zoomend', () => setZoomStep(Math.floor(m.getZoom() * 2) / 2));
    // keep the canvas matched to its box (panels, page transitions and rotation change it)
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(el.current);
    return () => { clearTimeout(t); ro.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the camera centred in the part of the map that is not covered by side panels
  useEffect(() => {
    if (map.current && padding) map.current.easeTo({ padding, duration: 400 });
  }, [padding]);

  // markers
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    live.current.forEach((x) => x.remove());
    live.current = [];
    // below city zoom, nearby pins merge into a counted bubble; clicking it zooms to its members
    const groups = [];
    if (cluster && !numbered && zoomStep < 11) {
      // greedy: each pin joins the first group whose centre is within ~80 px at this zoom
      const reach = (80 * 360) / (256 * 2 ** zoomStep);
      markers.forEach((mk) => {
        const g = groups.find((x) => Math.abs(x.lng - mk.lng) < reach && Math.abs(x.lat - mk.lat) < reach * 0.9);
        if (g) { g.push(mk); g.lng = g.reduce((s, x) => s + x.lng, 0) / g.length; g.lat = g.reduce((s, x) => s + x.lat, 0) / g.length; } else { const n = [mk]; n.lng = mk.lng; n.lat = mk.lat; groups.push(n); }
      });
    } else markers.forEach((mk) => groups.push([mk]));
    groups.filter((g) => g.length > 1).forEach((g) => {
      const node = document.createElement('div');
      node.className = 'map-cluster';
      node.textContent = String(g.length);
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `${g.length} heritage sites here. Zoom in`);
      const lng = g.reduce((a, x) => a + x.lng, 0) / g.length;
      const lat = g.reduce((a, x) => a + x.lat, 0) / g.length;
      node.addEventListener('click', (e) => { e.stopPropagation(); fitPoints(m, g.map((x) => [x.lng, x.lat]), 90); });
      live.current.push(new maplibregl.Marker({ element: node }).setLngLat([lng, lat]).addTo(m));
    });
    groups.filter((g) => g.length === 1).map((g) => g[0]).forEach((mk, i) => {
      let node;
      if (numbered) {
        node = document.createElement('div');
        node.className = 'map-num';
        node.textContent = String(i + 1);
      } else node = pinEl(mk);
      const marker = new maplibregl.Marker({ element: node, anchor: numbered ? 'center' : 'bottom-left' }).setLngLat([mk.lng, mk.lat]).addTo(m);
      if (popup && mk.name) {
        const html = `<div class="popup">${mk.image ? `<img src="${mk.image}" alt="" />` : ''}<div><h5>${escape(mk.name)}</h5>${mk.name_np ? `<div class="np">${escape(mk.name_np)}</div>` : ''}${mk.short ? `<div class="small muted">${escape(mk.short)}</div>` : ''}</div></div>`;
        marker.setPopup(new maplibregl.Popup({ offset: 24, closeButton: false, maxWidth: '260px' }).setHTML(html));
      }
      node.addEventListener('click', (e) => { e.stopPropagation(); cb.current.onSelect?.(mk); });
      node.addEventListener('keydown', (e) => { if (e.key === 'Enter') cb.current.onSelect?.(mk); });
      live.current.push(marker);
    });
    if (start) {
      const s = document.createElement('div'); s.className = 'map-start'; s.title = 'Start';
      live.current.push(new maplibregl.Marker({ element: s }).setLngLat([start.lng, start.lat]).addTo(m));
    }
    extra.forEach((x) => {
      const g = document.createElement('div'); g.className = 'map-guess'; g.style.background = x.color || '#27187e'; if (x.label) g.title = x.label;
      live.current.push(new maplibregl.Marker({ element: g }).setLngLat([x.lng, x.lat]).addTo(m));
    });
    if (fitOnChange) {
      const pts = [...markers, ...(start ? [start] : []), ...extra].map((p) => [p.lng, p.lat]);
      if (pts.length) fitPoints(m, pts, 80);
    }
  }, [markers, numbered, start, extra, fitOnChange, popup, cluster, zoomStep]);

  // the selected site's own 3D model, standing above its pin
  useEffect(() => {
    const m = map.current;
    if (!m || !model3d) return undefined;
    const node = document.createElement('div');
    node.className = 'map-model';
    const label = document.createElement('span');
    label.textContent = model3d.name || '';
    const stage = document.createElement('div');
    stage.className = 'map-model-stage';
    node.append(stage, label);
    const marker = new maplibregl.Marker({ element: node, anchor: 'bottom', offset: [0, -44] }).setLngLat([model3d.lng, model3d.lat]).addTo(m);
    const root = createRoot(stage);
    let alive = true;
    import('../three/site.jsx').then(({ SiteMini }) => {
      if (alive) root.render(createElement(ReactSuspense, { fallback: null }, createElement(SiteMini, { spec: model3d.spec, type: model3d.type, slug: model3d.slug })));
    });
    return () => { alive = false; marker.remove(); setTimeout(() => root.unmount(), 0); };
  }, [model3d]);

  // route + lines
  useEffect(() => {
    const m = map.current;
    if (!m) return undefined;
    const draw = () => {
      const data = {
        type: 'FeatureCollection',
        features: [
          ...(route && route.length > 1 ? [{ type: 'Feature', properties: { color: routeColor, w: 5 }, geometry: { type: 'LineString', coordinates: route } }] : []),
          ...lines.map((l) => ({ type: 'Feature', properties: { color: l.color || '#27187e', w: 3 }, geometry: { type: 'LineString', coordinates: [l.from, l.to] } })),
        ],
      };
      if (m.getSource('route')) m.getSource('route').setData(data);
      else {
        m.addSource('route', { type: 'geojson', data });
        m.addLayer({ id: 'route-casing', type: 'line', source: 'route', paint: { 'line-color': '#fff3e6', 'line-width': ['+', ['get', 'w'], 4], 'line-opacity': 0.9 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        m.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': ['get', 'color'], 'line-width': ['get', 'w'], 'line-dasharray': [1, 1.6] }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      }
    };
    if (m.isStyleLoaded()) draw(); else m.once('load', draw);
    return undefined;
  }, [route, routeColor, lines, loaded]);

  return (
    <div className="map-wrap">
      <div ref={el} className="map-el" />
      {failed && (
        <div className="map-fallback">
          <div><b>The map could not load.</b><p className="small muted">Map tiles come from OpenFreeMap over the internet. Check your connection; everything else still works.</p></div>
        </div>
      )}
    </div>
  );
});

function fitPoints(m, pts, pad) {
  if (!m || !pts.length) return;
  if (pts.length === 1) { m.flyTo({ center: pts[0], zoom: 16 }); return; }
  const b = pts.reduce((bb, p) => bb.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
  m.fitBounds(b, { padding: pad, maxZoom: 16.5, duration: 900 });
}

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default MapView;
