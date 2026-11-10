import { Prakara } from '../types/mantra';

export const DEFAULT_PRAKARAS: Prakara[] = [
  {
    id: 'sri-krishna-vrundavana-prayanam',
    title: 'Śrī Kṛṣṇa Vṛndāvana Prayāṇam',
    author: 'Ṛgveda (Saswara Rigveda Samhita) · Taittirīya Saṃhitā, Brāhmaṇa and Āraṇyaka (taittiriya.com) · Nārāyaṇa Upaniṣad, Śrī Sūkta and namaste astu bhagavan (sanskritdocuments.org)',
    description: 'As in the Saswara Veda Mantraḥ book.',
    preferredBpm: 60,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'ns-1',
        section: 'Gaṇeśa Sūktam',
        type: 'sukta_ref',
        suktaId: 'saswara-rigveda-8',
        nirdesa: 'saswara-rigveda-8/81',
        customTitle: 'Ganesha Suktam · ā tū na indra'
      },
      {
        id: 'ns-2',
        type: 'sukta_ref',
        suktaId: 'saswara-rigveda-2',
        nirdesa: 'saswara-rigveda-2/23.p1',
        customTitle: 'Ganesha Suktam · gaṇānāṃ tvā'
      },
      {
        id: 'ns-3',
        type: 'sukta_ref',
        suktaId: 'saswara-rigveda-10',
        nirdesa: 'saswara-rigveda-10/112.p9-p10',
        customTitle: 'Ganesha Suktam · ni ṣu sīda'
      },
      {
        id: 'ns-4',
        section: 'Rudra Praśnaḥ',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/48',
        customTitle: 'Rudra Praśna · Namakam · anuvāka 1'
      },
      {
        id: 'ns-namaste',
        type: 'sukta_ref',
        suktaId: 'namaste-astu-bhagavan',
        nirdesa: 'namaste-astu-bhagavan/1',
        customTitle: 'namaste astu bhagavan',
        note: 'Not in the Taittirīya Saṃhitā and has no svara. The Śivarahasya sets it after the first anuvāka; Nīlakaṇṭha Dīkṣita (17th century) calls its names known from śruti. Text from sanskritdocuments.org.'
      },
      {
        id: 'ns-namakam-2',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/49.1-58.13',
        customTitle: 'Rudra Praśna · Namakam'
      },
      {
        id: 'ns-5',
        section: 'Camaka Praśnaḥ',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/68.1-82.24',
        customTitle: 'Rudra Praśna · Chamakam'
      },
      {
        id: 'ns-6',
        section: 'Śivopāsana Mantrāḥ',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/16.1-25.3',
        customTitle: 'Śivopāsana Mantrāḥ'
      },
      {
        id: 'ns-7',
        section: 'Durgā Sūktam',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/2',
        customTitle: 'Durga Suktam'
      },
      {
        id: 'ns-8',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/1.103-104',
        customTitle: 'Durga Gāyatrī'
      },
      {
        id: 'ns-9',
        section: 'Puruṣa Sūktam',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-3',
        nirdesa: 'taittiriya-aranyaka-3/12.1-13.26',
        customTitle: 'Purusha Suktam'
      },
      {
        id: 'ns-10',
        section: 'Nārāyaṇa Sūktam',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/13',
        customTitle: 'Narayana Suktam'
      },
      {
        id: 'ns-11',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/23',
        customTitle: 'Narayana Suktam · ṛtaṃ satyam'
      },
      {
        id: 'ns-12',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/1.96-97',
        customTitle: 'Narayana Gāyatrī'
      },
      {
        id: 'ns-v1',
        section: 'Viṣṇu Sūktam',
        type: 'sukta_ref',
        suktaId: 'taittiriya-brahmana-2-8',
        nirdesa: 'taittiriya-brahmana-2-8/3.18-3.38',
        customTitle: 'Vishnu Suktam'
      },
      {
        id: 'ns-v2',
        type: 'sukta_ref',
        suktaId: 'saswara-rigveda-1',
        nirdesa: 'saswara-rigveda-1/22.p16-p21',
        customTitle: 'Vishnu Suktam · ato devā',
        note: 'From the Ṛgveda (1.22.16–21): no Taittirīya source in the library has these verses, so the accents follow the Ṛgveda.'
      },
      {
        id: 'ns-v3',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-5',
        nirdesa: 'taittiriya-samhita-5/47.3',
        customTitle: 'Vishnu Suktam · paryāptyā',
        note: 'Saswara Veda Mantrāḥ and vignanam start at “paryāptyā”. This line of the Saṃhitā (5.4.12) has 27 more words of aśvamedha prose before it, from “yata īśvaro” to “sarvatvāya”.'
      },
      {
        id: 'ns-nu',
        section: 'Nārāyaṇopaniṣat',
        type: 'sukta_ref',
        suktaId: 'narayana-upanishad',
        customTitle: 'Nārāyaṇopaniṣat',
        note: 'From sanskritdocuments.org, which prints no swara marks. In khaṇḍa 2 it has a bare “nārāyaṇaḥ” where Saswara Veda Mantrāḥ reads “kālaś ca nārāyaṇaḥ”.'
      },
      {
        id: 'ns-13',
        section: 'Śrī Sūktam',
        type: 'sukta_ref',
        suktaId: 'rigveda-khila-sri',
        nirdesa: 'rigveda-khila-sri/1',
        customTitle: 'Sri Suktam'
      }
    ]
  },
  {
    id: 'maha-prakaram',
    title: 'महापारायणम् (Maha Parayanam)',
    author: 'Ṛgveda (DharmicData, ODbL) · Taittirīya Āraṇyaka (taittiriya.com) · Śrī Sūkta (sanskritdocuments.org)',
    description: 'Complete sacred sequence: Ganapati -> Purusha -> Sri -> Durga -> Narayana',
    preferredBpm: 72,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'item-1',
        type: 'sukta_ref',
        suktaId: 'rigveda-2',
        nirdesa: 'rigveda-2/23',
        customTitle: '1. Ganapati Prarthana'
      },
      {
        id: 'item-2',
        type: 'vakya',
        customTitle: 'Dhyanam & Sankalpam Vakya',
        customText: 'शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् । प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥',
        customTranslation: 'Meditation on the all-pervading auspicious Lord for the removal of all impediments.'
      },
      {
        id: 'item-3',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-3',
        nirdesa: 'taittiriya-aranyaka-3/12',
        customTitle: '2. Purusha Suktam'
      },
      {
        id: 'item-4',
        type: 'vakya',
        customTitle: 'Devi Avahana Vakya',
        customText: 'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके । शरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥',
        customTranslation: 'Salutations to the Divine Mother, the auspiciousness of all that is auspicious.'
      },
      {
        id: 'item-5',
        type: 'sukta_ref',
        suktaId: 'rigveda-khila-sri',
        nirdesa: 'rigveda-khila-sri/1',
        customTitle: '3. Sri Suktam'
      },
      {
        id: 'item-6',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/2',
        customTitle: '4. Durga Suktam'
      },
      {
        id: 'item-7',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/13',
        customTitle: '5. Narayana Suktam'
      },
      {
        id: 'item-8',
        type: 'vakya',
        customTitle: 'Samarpanam (Offering)',
        customText: 'कायेन वाचा मनसेन्द्रियैर्वा बुद्ध्याऽऽत्मना वा प्रकृतेः स्वभावात् । करोमि यद्यत् सकलं परस्मै नारायणायेति समर्पयामि ॥',
        customTranslation: 'Whatever I perform with body, speech, mind, senses, intellect or soul, I surrender all to the Supreme Lord Narayana.'
      }
    ]
  },
  {
    id: 'purusha-sri-combo',
    title: 'पुरुष-श्री सूक्तम् (Purusha & Sri Suktam Combo)',
    author: 'Taittirīya Āraṇyaka (taittiriya.com) · Śrī Sūkta (sanskritdocuments.org)',
    description: 'Traditional Purusha and Sri Sukta combination for abhishekam and archana',
    preferredBpm: 68,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'ps-combo-1',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-3',
        nirdesa: 'taittiriya-aranyaka-3/12',
        customTitle: 'Purusha Suktam'
      },
      {
        id: 'ps-combo-2',
        type: 'vakya',
        customTitle: 'Sri Suktam Dhyanam',
        customText: 'पद्मानने पद्मविपद्मपत्रे पद्मप्रिये पद्मदलायताक्षि । विश्वप्रिये विश्वमनोऽनुकूले त्वत्पादपद्मं मयि सन्निधत्स्व ॥',
        customTranslation: 'O Lotus-faced Mother, lover of lotuses, place Thy sacred lotus feet within my heart.'
      },
      {
        id: 'ps-combo-3',
        type: 'sukta_ref',
        suktaId: 'rigveda-khila-sri',
        nirdesa: 'rigveda-khila-sri/1',
        customTitle: 'Sri Suktam'
      }
    ]
  },
  {
    id: 'shanti-patha',
    title: 'शान्ति पाठः (Shanti Patha & Meditation)',
    author: 'Ṛgveda (DharmicData, ODbL) · Taittirīya Āraṇyaka (taittiriya.com)',
    description: 'Meditative peace chants for dhyana and daily start of study',
    preferredBpm: 50,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'sp-1',
        type: 'sukta_ref',
        suktaId: 'rigveda-1',
        nirdesa: 'rigveda-1/90',
        customTitle: 'Śānti (Peace)'
      },
      {
        id: 'sp-2',
        type: 'sukta_ref',
        suktaId: 'taittiriya-aranyaka-10',
        nirdesa: 'taittiriya-aranyaka-10/13',
        customTitle: 'Saha Nāvavatu'
      }
    ]
  },
  {
    id: 'rudram-ts',
    title: 'श्री रुद्रम् — तैत्तिरीय संहिता (Sri Rudram, from the Taittirīya Saṃhitā)',
    author: 'Taittirīya Saṃhitā, kāṇḍa 4 (taittiriya.com) · namaste astu bhagavan (sanskritdocuments.org)',
    description: 'The Namakam (TS 4.5) and Chamakam (TS 4.7) described as ranges of the Taittirīya Saṃhitā source.',
    preferredBpm: 60,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'rts-1',
        section: 'Rudra Praśnaḥ',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/48',
        customTitle: 'Namakam (TS 4.5) · anuvāka 1'
      },
      {
        id: 'rts-namaste',
        type: 'sukta_ref',
        suktaId: 'namaste-astu-bhagavan',
        nirdesa: 'namaste-astu-bhagavan/1',
        customTitle: 'namaste astu bhagavan',
        note: 'Not in the Taittirīya Saṃhitā and has no svara. The Śivarahasya sets it after the first anuvāka; Nīlakaṇṭha Dīkṣita (17th century) calls its names known from śruti. Text from sanskritdocuments.org.'
      },
      {
        id: 'rts-namakam-2',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/49.1-58.13',
        customTitle: 'Namakam (TS 4.5)'
      },
      {
        id: 'rts-2',
        section: 'Camaka Praśnaḥ',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/68.1-82.24',
        customTitle: 'Chamakam (TS 4.7)'
      }
    ]
  }
];
