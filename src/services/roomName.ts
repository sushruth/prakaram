// Names for a parāyaṇam (a casual group recitation, not a prakaram's rite). The terms are the kind a
// Sanskrit class teaches, and each name joins two different domains that read well together
// (loka + nakṣatra: Bhū-Kṛttikā). The id is the ASCII slugs plus a short random code, because rooms
// are peer-to-peer by name over public trackers: two people who rolled the same words must not meet.
// The room name is not private: anyone who has the id can join.

export interface Term {
  /** Lower-case ASCII, no hyphen; unique across all domains so an id can be read back. */
  slug: string;
  /** Devanagari, shown through Sanskrit.tsx in the selected script. */
  sa: string;
  /** English transliteration, shown muted. */
  en: string;
}

const t = (slug: string, sa: string, en: string): Term => ({ slug, sa, en });

export const LOKAS: Term[] = [
  t('bhu', 'भू', 'Bhū'), t('bhuvah', 'भुवः', 'Bhuvaḥ'), t('svah', 'स्वः', 'Svaḥ'), t('mahah', 'महः', 'Mahaḥ'),
  t('janah', 'जनः', 'Janaḥ'), t('tapah', 'तपः', 'Tapaḥ'), t('satya', 'सत्य', 'Satya'),
  t('atala', 'अतल', 'Atala'), t('vitala', 'वितल', 'Vitala'), t('sutala', 'सुतल', 'Sutala'),
  t('talatala', 'तलातल', 'Talātala'), t('mahatala', 'महातल', 'Mahātala'), t('rasatala', 'रसातल', 'Rasātala'),
  t('paataala', 'पाताल', 'Pātāla'),
];

export const NAKSHATRAS: Term[] = [
  t('ashvini', 'अश्विनी', 'Aśvinī'), t('bharani', 'भरणी', 'Bharaṇī'), t('krittika', 'कृत्तिका', 'Kṛttikā'),
  t('rohini', 'रोहिणी', 'Rohiṇī'), t('mrigashira', 'मृगशिरा', 'Mṛgaśirā'), t('ardra', 'आर्द्रा', 'Ārdrā'),
  t('punarvasu', 'पुनर्वसु', 'Punarvasu'), t('pushya', 'पुष्य', 'Puṣya'), t('ashlesha', 'आश्लेषा', 'Āśleṣā'),
  t('magha', 'मघा', 'Maghā'), t('purvaphalguni', 'पूर्वफल्गुनी', 'Pūrva Phalgunī'),
  t('uttaraphalguni', 'उत्तरफल्गुनी', 'Uttara Phalgunī'), t('hasta', 'हस्त', 'Hasta'), t('chitra', 'चित्रा', 'Citrā'),
  t('svati', 'स्वाती', 'Svātī'), t('vishakha', 'विशाखा', 'Viśākhā'), t('anuradha', 'अनुराधा', 'Anurādhā'),
  t('jyeshtha', 'ज्येष्ठा', 'Jyeṣṭhā'), t('mula', 'मूल', 'Mūla'), t('purvashadha', 'पूर्वाषाढा', 'Pūrvāṣāḍhā'),
  t('uttarashadha', 'उत्तराषाढा', 'Uttarāṣāḍhā'), t('shravana', 'श्रवण', 'Śravaṇa'),
  t('dhanishtha', 'धनिष्ठा', 'Dhaniṣṭhā'), t('shatabhisha', 'शतभिषा', 'Śatabhiṣā'),
  t('purvabhadrapada', 'पूर्वभाद्रपदा', 'Pūrva Bhādrapadā'), t('uttarabhadrapada', 'उत्तरभाद्रपदा', 'Uttara Bhādrapadā'),
  t('revati', 'रेवती', 'Revatī'),
];

export const MASAS: Term[] = [
  t('chaitra', 'चैत्र', 'Caitra'), t('vaishakha', 'वैशाख', 'Vaiśākha'), t('jyaishtha', 'ज्यैष्ठ', 'Jyaiṣṭha'),
  t('ashadha', 'आषाढ', 'Āṣāḍha'), t('shraavana', 'श्रावण', 'Śrāvaṇa'), t('bhadrapada', 'भाद्रपद', 'Bhādrapada'),
  t('ashvina', 'आश्विन', 'Āśvina'), t('kartika', 'कार्तिक', 'Kārtika'), t('margashirsha', 'मार्गशीर्ष', 'Mārgaśīrṣa'),
  t('pausha', 'पौष', 'Pauṣa'), t('maagha', 'माघ', 'Māgha'), t('phalguna', 'फाल्गुन', 'Phālguna'),
];

export const RTUS: Term[] = [
  t('vasanta', 'वसन्त', 'Vasanta'), t('grishma', 'ग्रीष्म', 'Grīṣma'), t('varsha', 'वर्षा', 'Varṣā'),
  t('sharad', 'शरद', 'Śarad'), t('hemanta', 'हेमन्त', 'Hemanta'), t('shishira', 'शिशिर', 'Śiśira'),
];

export const GRAHAS: Term[] = [
  t('surya', 'सूर्य', 'Sūrya'), t('chandra', 'चन्द्र', 'Candra'), t('mangala', 'मङ्गल', 'Maṅgala'),
  t('budha', 'बुध', 'Budha'), t('guru', 'गुरु', 'Guru'), t('shukra', 'शुक्र', 'Śukra'), t('shani', 'शनि', 'Śani'),
  t('rahu', 'राहु', 'Rāhu'), t('ketu', 'केतु', 'Ketu'),
];

export const DISHAS: Term[] = [
  t('purva', 'पूर्व', 'Pūrva'), t('agneya', 'आग्नेय', 'Āgneya'), t('dakshina', 'दक्षिण', 'Dakṣiṇa'),
  t('nairritya', 'नैर्ऋत्य', 'Nairṛtya'), t('paschima', 'पश्चिम', 'Paścima'), t('vayavya', 'वायव्य', 'Vāyavya'),
  t('uttara', 'उत्तर', 'Uttara'), t('ishana', 'ईशान', 'Īśāna'), t('urdhva', 'ऊर्ध्व', 'Ūrdhva'),
  t('adhah', 'अधः', 'Adhaḥ'),
];

export const NADIS: Term[] = [
  t('ganga', 'गङ्गा', 'Gaṅgā'), t('yamuna', 'यमुना', 'Yamunā'), t('sarasvati', 'सरस्वती', 'Sarasvatī'),
  t('godavari', 'गोदावरी', 'Godāvarī'), t('narmada', 'नर्मदा', 'Narmadā'), t('sindhu', 'सिन्धु', 'Sindhu'),
  t('kaveri', 'कावेरी', 'Kāverī'), t('krishna', 'कृष्णा', 'Kṛṣṇā'), t('tungabhadra', 'तुङ्गभद्रा', 'Tuṅgabhadrā'),
  t('shipra', 'शिप्रा', 'Śiprā'), t('gomati', 'गोमती', 'Gomatī'), t('tamraparni', 'ताम्रपर्णी', 'Tāmraparṇī'),
];

export const VASARAS: Term[] = [
  t('ravivasara', 'रविवासरः', 'Ravivāsaraḥ'), t('somavasara', 'सोमवासरः', 'Somavāsaraḥ'),
  t('mangalavasara', 'मङ्गलवासरः', 'Maṅgalavāsaraḥ'), t('budhavasara', 'बुधवासरः', 'Budhavāsaraḥ'),
  t('guruvasara', 'गुरुवासरः', 'Guruvāsaraḥ'), t('shukravasara', 'शुक्रवासरः', 'Śukravāsaraḥ'),
  t('shanivasara', 'शनिवासरः', 'Śanivāsaraḥ'),
];

export const DOMAINS = { loka: LOKAS, nakshatra: NAKSHATRAS, masa: MASAS, rtu: RTUS, graha: GRAHAS, disha: DISHAS, nadi: NADIS, vasara: VASARAS };
export type Domain = keyof typeof DOMAINS;

/** Ordered pairs that read well together; the two domains of a pair always differ. */
export const PAIRS: [Domain, Domain][] = [
  ['loka', 'nakshatra'], ['masa', 'nakshatra'], ['rtu', 'graha'], ['rtu', 'nakshatra'],
  ['disha', 'nadi'], ['vasara', 'nakshatra'], ['masa', 'disha'],
];

/** No 0/o, 1/l/i: a code read aloud or from a screen cannot be mistaken. */
export const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const CODE_LENGTH = 3;

export type Random = () => number;
const secureRandom: Random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const pick = <T,>(xs: readonly T[], rand: Random): T => xs[Math.floor(rand() * xs.length)];

export interface RoomName {
  id: string;
  a: Term;
  b: Term;
  code: string;
}

export function generateRoomName(rand: Random = secureRandom): RoomName {
  const [da, db] = pick(PAIRS, rand);
  const a = pick(DOMAINS[da], rand);
  const b = pick(DOMAINS[db], rand);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += pick([...CODE_ALPHABET], rand);
  return { id: `${a.slug}-${b.slug}-${code}`, a, b, code };
}

const BY_SLUG = new Map(Object.values(DOMAINS).flat().map((x) => [x.slug, x]));

/** Reads a generated id back into its terms; null for a name someone typed themselves. */
export function describeRoom(id: string): RoomName | null {
  const [sa, sb, code, ...rest] = id.split('-');
  const a = BY_SLUG.get(sa);
  const b = BY_SLUG.get(sb);
  if (!a || !b || rest.length || code?.length !== CODE_LENGTH || [...code].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return { id, a, b, code };
}
