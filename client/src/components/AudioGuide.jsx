import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Dropdown } from './Pickers.jsx';
import { useT } from '../lib/prefs.jsx';
import '../styles/audio-guide.css';

/** Animated bars shown while a voice is audible. */
export function Equalizer({ active }) {
  return <span className={`eq ${active ? 'on' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>;
}

/** The audio guide card: transport controls, chapters, voice and speed pickers, and honest messages when there is no voice. */
export default function AudioGuide({ narrator, chapters }) {
  const t = useT();
  const n = narrator;
  const audible = n.speaking && !n.paused;
  const options = n.voices.map((v) => ({ value: v.voiceURI, label: `${v.name.replace(/^Microsoft\s+/i, '')} · ${v.lang}` }));

  return (
    <div className="card pad-l audio-card">
      <div className="row between">
        <div className="row">
          <Equalizer active={audible} />
          <div>
            <h4 style={{ margin: 0 }}>{t('Audio guide', 'अडियो गाइड')}</h4>
            <span className="cap">{t(`${chapters.length} short chapters · read aloud by your device`, `${t.n(chapters.length)} छोटा भाग · तपाईंको फोनले पढेर सुनाउँछ`)}</span>
          </div>
        </div>
        {n.supported && !n.noVoice ? (
          <div className="row">
            {n.playing && !n.paused
              ? <button className="btn sm" onClick={n.pause}><Pause size={15} /> {t('Pause', 'रोक्नुहोस्')}</button>
              : <button className="btn sm diyo" onClick={() => (n.paused ? n.resume() : n.play(n.progress >= 1 ? 0 : n.chapter || 0))} disabled={!n.ready}><Play size={15} /> {n.paused ? t('Resume', 'जारी राख्नुहोस्') : t('Listen', 'सुन्नुहोस्')}</button>}
            {(n.playing || n.testing) && <button className="icon-btn" onClick={n.stop} aria-label={t('Stop', 'बन्द गर्नुहोस्')}><Square size={14} /></button>}
          </div>
        ) : null}
      </div>

      <div className="chapters">
        {chapters.map((c, i) => (
          <button key={c.title} className={`chapter ${n.playing && n.chapter === i ? 'on' : ''}`} onClick={() => n.play(i)} disabled={!n.supported || n.noVoice || !n.ready}>
            <span>{c.title}</span>
            <i style={{ width: n.chapter === i ? `${Math.round((n.progress || 0) * 100)}%` : n.chapter > i && n.playing ? '100%' : 0 }} />
          </button>
        ))}
      </div>

      {!n.supported && <p className="cap" style={{ marginTop: '0.6rem' }}>{t('This browser cannot read aloud. Please read the story below.', 'यो ब्राउजरले पढेर सुनाउन सक्दैन। तल कथा पढ्नुहोस्।')}</p>}
      {n.supported && n.noVoice && (
        <p className="cap error-text" style={{ marginTop: '0.6rem' }} role="alert">
          {t.nepali
            ? 'यो उपकरणमा नेपाली वा हिन्दी आवाज राखिएको छैन, त्यसैले नेपालीमा पढेर सुनाउन सकिँदैन। अंग्रेजी भाषा छान्नुहोस्, वा फोनको स्पीच सेटिङमा नेपाली वा हिन्दी आवाज थप्नुहोस्।'
            : 'This device has no voice installed for this language, so it cannot read aloud. Switch the site language, or add a voice in your system speech settings.'}
        </p>
      )}
      {n.supported && !n.ready && <p className="cap" style={{ marginTop: '0.6rem' }}>{t('Loading voices…', 'आवाज खोज्दै…')}</p>}
      {n.failed && <p className="cap error-text" style={{ marginTop: '0.6rem' }} role="alert">{t('The voice did not start. Pick another voice below and try the test.', 'आवाज सुरु भएन। तल अर्को आवाज छानेर जाँच गर्नुहोस्।')}</p>}
      {n.hindiFallback && <p className="cap" style={{ marginTop: '0.6rem' }}>{t('No Nepali voice found, so a Hindi voice reads the Devanagari text.', 'नेपाली आवाज भेटिएन, त्यसैले हिन्दी आवाजले पढ्दैछ।')}</p>}

      {n.supported && n.voice && (
        <div className="voice-tools">
          <div className="voice-pick">
            <span className="cap" id="voice-label">{t('Voice', 'आवाज')}</span>
            <Dropdown id="voice-pick" label={t('Voice', 'आवाज')} value={n.voice.voiceURI} options={options} onChange={n.setVoiceURI} />
          </div>
          <label className="voice-speed cap">
            <span>{t('Speed', 'गति')}</span>
            <input type="range" min="0.7" max="1.3" step="0.05" value={n.rate} onChange={(e) => n.setRate(Number(e.target.value))} aria-label={t('Reading speed', 'पढ्ने गति')} />
            <b>{n.rate.toFixed(2)}×</b>
          </label>
          <button className="btn ghost sm" onClick={n.testing ? n.stop : n.test}>
            {n.testing ? <><Square size={13} /> {t('Stop', 'बन्द गर्नुहोस्')}</> : <><Volume2 size={14} /> {t('Test voice', 'आवाज जाँच्नुहोस्')}</>}
          </button>
        </div>
      )}
    </div>
  );
}
