import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

/** Photo gallery: a swipeable carousel with arched thumbnails; any photo opens full screen with its credit. */
export function Gallery({ photos, open, setOpen }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5200, stopOnInteraction: true })]);
  const [sel, setSel] = useState(0);
  const [lbOpen, setLbOpen] = useState(false);
  const isOpen = open ?? lbOpen;
  const setIsOpen = setOpen ?? setLbOpen;
  useEffect(() => {
    if (!embla) return undefined;
    const on = () => setSel(embla.selectedScrollSnap());
    embla.on('select', on);
    on();
    return () => embla.off('select', on);
  }, [embla]);
  const go = useCallback((i) => embla?.scrollTo(i), [embla]);
  if (!photos.length) return null;
  return (
    <div className="gal-wrap">
      <div className="gal-viewport" ref={emblaRef}>
        <div className="gal-container">
          {photos.map((p, i) => (
            <div className="gal-slide" key={p.url} onClick={() => { setSel(i); setIsOpen(true); }} role="button" tabIndex={0} aria-label={`Open photo ${i + 1} full screen`} onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}>
              <img src={p.url} alt={p.caption || ''} loading={i ? 'lazy' : 'eager'} />
              <div className="gal-cap"><span>{p.caption}</span><small>{[p.author, p.license].filter(Boolean).join(' · ').replace(/<[^>]+>/g, '')}</small></div>
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <button className="icon-btn gal-nav prev" onClick={() => embla?.scrollPrev()} aria-label="Previous photo"><ChevronLeft size={18} /></button>
          <button className="icon-btn gal-nav next" onClick={() => embla?.scrollNext()} aria-label="Next photo"><ChevronRight size={18} /></button>
        </>
      )}
      <span className="tag light gal-count"><Maximize2 size={11} /> {sel + 1} / {photos.length}</span>
      <div className="gal-thumbs thin-scroll">
        {photos.map((p, i) => <button key={p.url} className={`gal-thumb ${i === sel ? 'on' : ''}`} onClick={() => go(i)} aria-label={`Photo ${i + 1}`}><img src={p.url} alt="" loading="lazy" /></button>)}
      </div>
      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        index={sel}
        slides={photos.map((p) => ({ src: p.url, alt: p.caption || '', title: p.caption, description: [p.author, p.license].filter(Boolean).join(' · ') }))}
        on={{ view: ({ index }) => { setSel(index); embla?.scrollTo(index, true); } }}
      />
    </div>
  );
}
