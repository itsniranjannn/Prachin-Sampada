import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Public-domain scripture in Devanagari, with an IAST transliteration of the opening line, a plain English meaning and
// its source. `faith` lets a page pick a verse for a Shiva, Vishnu, Devi, Ganesha or Buddhist shrine.
export const SHLOKAS = [
  { faith: 'general', src: 'Brihadaranyaka Upanishad 1.3.28', dev: ['असतो मा सद्गमय ।', 'तमसो मा ज्योतिर्गमय ।', 'मृत्योर्मा अमृतं गमय ॥'], iast: 'asato mā sad gamaya', en: 'Lead me from the unreal to the real, from darkness to light, from death to immortality.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 2.47', dev: ['कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।', 'मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥'], iast: 'karmaṇy evādhikāras te mā phaleṣu kadācana', en: 'Your right is to the work alone, never to its fruits. Let neither reward be your motive, nor idleness your refuge.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 4.7', dev: ['यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।', 'अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥'], iast: 'yadā yadā hi dharmasya glānir bhavati bhārata', en: 'Whenever dharma declines and its opposite rises, O Bharata, then I bring myself forth.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 4.8', dev: ['परित्राणाय साधूनां विनाशाय च दुष्कृताम् ।', 'धर्मसंस्थापनार्थाय सम्भवामि युगे युगे ॥'], iast: 'paritrāṇāya sādhūnāṃ vināśāya ca duṣkṛtām', en: 'To protect the good, to end the wicked and to establish dharma, I am born age after age.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 9.26', dev: ['पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति ।', 'तदहं भक्त्युपहृतमश्नामि प्रयतात्मनः ॥'], iast: 'patraṃ puṣpaṃ phalaṃ toyaṃ yo me bhaktyā prayacchati', en: 'A leaf, a flower, a fruit or a little water, offered to me with devotion, I accept from the pure of heart.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 2.20', dev: ['न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।', 'अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥'], iast: 'na jāyate mriyate vā kadācin', en: 'The self is never born and never dies. Unborn, eternal and ancient, it is not slain when the body is slain.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 6.5', dev: ['उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।', 'आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥'], iast: 'uddhared ātmanātmānaṃ nātmānam avasādayet', en: 'Lift yourself by your own self and never let yourself fall; the self alone is your friend, and the self alone your foe.' },
  { faith: 'vishnu', src: 'Bhagavad Gita 18.66', dev: ['सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।', 'अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥'], iast: 'sarva-dharmān parityajya mām ekaṃ śaraṇaṃ vraja', en: 'Set aside every other duty and take refuge in me alone. I will free you from all wrong; do not grieve.' },
  { faith: 'general', src: 'Gayatri mantra, Rigveda 3.62.10', dev: ['ॐ भूर्भुवः स्वः ।', 'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।', 'धियो यो नः प्रचोदयात् ॥'], iast: 'tat savitur vareṇyaṃ bhargo devasya dhīmahi', en: 'We meditate on the glorious light of the divine Savitr; may it awaken our understanding.' },
  { faith: 'shiva', src: 'Mahamrityunjaya mantra, Rigveda 7.59.12', dev: ['ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।', 'उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ॥'], iast: 'tryambakaṃ yajāmahe sugandhiṃ puṣṭi-vardhanam', en: 'We worship the three-eyed one, fragrant, who nourishes all. As a ripe cucumber leaves its vine, may he free us from death, not from immortality.' },
  { faith: 'shiva', src: 'Panchakshara mantra, praised in the Shiva Purana', dev: ['ॐ नमः शिवाय'], iast: 'oṃ namaḥ śivāya', en: 'Om, I bow to Shiva. Five syllables the Shiva Purana calls the heart of the Vedas.' },
  { faith: 'shiva', src: 'Shiva Panchakshara Stotram 1, Adi Shankaracharya', dev: ['नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय ।', 'नित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय ॥'], iast: 'nāgendra-hārāya trilocanāya', en: 'To the great lord garlanded with the serpent king, three-eyed, smeared with ash, eternal, pure, clothed by the sky: to the syllable Na, salutation to Shiva.' },
  { faith: 'shiva', src: 'Karpuragauram, sung at the evening aarti', dev: ['कर्पूरगौरं करुणावतारं संसारसारं भुजगेन्द्रहारम् ।', 'सदा वसन्तं हृदयारविन्दे भवं भवानीसहितं नमामि ॥'], iast: 'karpūra-gauraṃ karuṇāvatāraṃ', en: 'White as camphor, compassion embodied, the essence of the world, garlanded with the serpent king: I bow to Shiva and Bhavani, ever dwelling in the lotus of the heart.' },
  { faith: 'devi', src: 'Devi Mahatmya, chapter 5', dev: ['या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता ।', 'नमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥'], iast: 'yā devī sarva-bhūteṣu śakti-rūpeṇa saṃsthitā', en: 'To the Goddess who dwells in every being as power: salutation to her, salutation to her, salutation again and again.' },
  { faith: 'ganesh', src: 'Traditional prayer to Ganesha', dev: ['वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।', 'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥'], iast: 'vakra-tuṇḍa mahā-kāya sūrya-koṭi sama-prabha', en: 'O curved-trunked lord of mighty form, bright as a million suns: remove every obstacle from all my work, always.' },
  { faith: 'general', src: 'Isha Upanishad, invocation', dev: ['ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।', 'पूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥'], iast: 'oṃ pūrṇam adaḥ pūrṇam idaṃ', en: 'That is whole, this is whole; from the whole the whole arises. Take the whole from the whole, and the whole remains.' },
  { faith: 'general', src: 'Shanti mantra', dev: ['सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ।', 'सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥'], iast: 'sarve bhavantu sukhinaḥ', en: 'May all be happy, may all be free from illness, may all see what is good, and may no one suffer.' },
  { faith: 'buddha', src: 'Mantra of Avalokiteshvara, Karandavyuha Sutra', dev: ['ॐ मणि पद्मे हूँ'], iast: 'oṃ maṇi padme hūṃ', en: 'The jewel in the lotus. Carved on every prayer wheel at Swayambhu and Boudha.' },
  { faith: 'buddha', src: 'Dhammapada 5 (Pali)', dev: ['न हि वेरेन वेरानि सम्मन्तीध कुदाचनं ।', 'अवेरेन च सम्मन्ति एस धम्मो सनन्तनो ॥'], iast: 'na hi verena verāni sammantīdha kudācanaṃ', en: 'Hatred is never ended by hatred; it is ended by love alone. This is an eternal law.' },
];

/** A verse for a shrine of this tradition (faith from the API: shiva, vishnu, devi, ganesh, buddha, other). */
export function verseFor(faith, seed = 0) {
  const pool = SHLOKAS.filter((s) => s.faith === faith);
  const list = pool.length ? pool : SHLOKAS.filter((s) => s.faith === 'general');
  return list[Math.abs(seed) % list.length];
}

function Verse({ s, compact = false }) {
  return (
    <figure className={`verse ${compact ? 'compact' : ''}`}>
      <blockquote lang="sa" className="shloka-dev">{s.dev.map((l) => <span key={l}>{l}</span>)}</blockquote>
      <p className="shloka-iast">{s.iast}</p>
      <p className="shloka-en">{s.en}</p>
      <figcaption>{s.src}</figcaption>
    </figure>
  );
}

/** Every verse in turn, crossfading; arrows and a counter let the reader browse. Pauses on hover. */
export function ShlokaRotator({ interval = 10000 }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % SHLOKAS.length), interval);
    return () => clearInterval(id);
  }, [paused, interval]);
  const go = (d) => setI((x) => (x + d + SHLOKAS.length) % SHLOKAS.length);
  return (
    <div className="shloka" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 0.9, 0.24, 1] }}>
          <Verse s={SHLOKAS[i]} />
        </motion.div>
      </AnimatePresence>
      <div className="shloka-nav">
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous verse"><ChevronLeft size={18} /></button>
        <span className="num">{String(i + 1).padStart(2, '0')} <i>/</i> {SHLOKAS.length}</span>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Next verse"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

/** A single short verse placed under a section heading. */
export function Epigraph({ index = 0, faith }) {
  const s = useMemo(() => (faith ? verseFor(faith, index) : SHLOKAS[index % SHLOKAS.length]), [faith, index]);
  return (
    <p className="epigraph" lang="sa" title={s.en}>
      <span>{s.dev[0].replace(/[।॥]\s*$/, '')}</span>
      <small>{s.src}</small>
    </p>
  );
}

/** A verse card for a shrine, chosen by its tradition. */
export function ShrineVerse({ faith, seed = 0 }) {
  const s = verseFor(faith, seed);
  return <div className="shrine-verse"><Verse s={s} compact /></div>;
}
