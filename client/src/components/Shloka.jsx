import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Verses are public-domain scripture, quoted in Devanagari with IAST transliteration and a plain English meaning.
export const SHLOKAS = [
  {
    src: 'Bhagavad Gita 2.47',
    dev: ['कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।', 'मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥'],
    iast: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
    en: 'Your right is to the work alone, never to its fruits. Let neither reward be your motive, nor idleness your refuge.',
  },
  {
    src: 'Bhagavad Gita 4.7',
    dev: ['यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।', 'अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥'],
    iast: 'yadā yadā hi dharmasya glānir bhavati bhārata',
    en: 'Whenever dharma declines and its opposite rises, O Bharata, then I bring myself forth.',
  },
  {
    src: 'Panchakshara mantra, praised in the Shiva Purana',
    dev: ['ॐ नमः शिवाय'],
    iast: 'oṃ namaḥ śivāya',
    en: 'Om, I bow to Shiva. Five syllables the Shiva Purana calls the heart of the Vedas.',
  },
  {
    src: 'Mantra of Avalokiteshvara, Karandavyuha Sutra',
    dev: ['ॐ मणि पद्मे हूँ'],
    iast: 'oṃ maṇi padme hūṃ',
    en: 'The jewel in the lotus. Carved on every prayer wheel at Swayambhu and Boudha.',
  },
];

/** One verse at a time, crossfading every few seconds; the dots let the reader pick. */
export function ShlokaRotator({ interval = 9000 }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % SHLOKAS.length), interval);
    return () => clearInterval(id);
  }, [paused, interval]);
  const s = SHLOKAS[i];
  return (
    <div className="shloka" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <motion.figure key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 0.9, 0.24, 1] }}>
          <blockquote lang="sa" className="shloka-dev">{s.dev.map((l) => <span key={l}>{l}</span>)}</blockquote>
          <p className="shloka-iast">{s.iast}</p>
          <p className="shloka-en">{s.en}</p>
          <figcaption>{s.src}</figcaption>
      </motion.figure>
      <div className="shloka-dots" role="tablist" aria-label="Choose a verse">
        {SHLOKAS.map((x, k) => <button key={x.src} role="tab" aria-selected={k === i} aria-label={x.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
      </div>
    </div>
  );
}

/** Continuous line of mantras for the footer. */
export const MANTRA_LINE = 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन · ॐ नमः शिवाय · ॐ मणि पद्मे हूँ · यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ·';
