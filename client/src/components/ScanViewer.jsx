import { useState } from 'react';
import { ExternalLink, ScanLine } from 'lucide-react';
import { embedUrl, modelUrl } from '../data/scans.js';

/** Sketchfab's official player for one scan, with the author's credit underneath. */
export function ScanFrame({ scan, height = 460 }) {
  return (
    <figure className="scan-frame">
      <iframe
        title={`${scan.title} by ${scan.author} on Sketchfab`}
        src={embedUrl(scan.uid)}
        style={{ height }}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
      />
      <figcaption className="cap">
        <ScanLine size={13} /> <a href={modelUrl(scan.uid)} target="_blank" rel="noreferrer"><b>{scan.title}</b></a> by{' '}
        <a href={`https://sketchfab.com/${scan.user}`} target="_blank" rel="noreferrer">{scan.author}</a> on Sketchfab · {scan.license}
        <ExternalLink size={11} />
      </figcaption>
    </figure>
  );
}

/** Scanned details from the site (shrines, sculptures), opened one at a time. */
export function ScanDetails({ scans }) {
  const [open, setOpen] = useState(scans[0]?.uid);
  if (!scans.length) return null;
  const cur = scans.find((s) => s.uid === open) || scans[0];
  return (
    <div className="scan-details">
      <div className="chips-row">
        {scans.map((s) => <button key={s.uid} className={`chip ${s.uid === cur.uid ? 'on' : ''}`} onClick={() => setOpen(s.uid)}>{s.title}</button>)}
      </div>
      <ScanFrame key={cur.uid} scan={cur} height={380} />
    </div>
  );
}
