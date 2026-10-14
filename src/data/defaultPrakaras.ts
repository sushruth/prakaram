import { Prakara } from '../types/mantra';

export const DEFAULT_PRAKARAS: Prakara[] = [
  {
    id: 'maha-prakaram',
    title: 'महापारायणम् (Maha Parayanam)',
    author: 'Compiled from Saswara Veda Mantrah (Sri Ramakrishna Math)',
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
    author: 'Compiled from Saswara Veda Mantrah (Sri Ramakrishna Math)',
    description: 'Traditional Purusha and Sri Sukta combination for abhishekam and archana',
    preferredBpm: 68,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'ps-combo-1',
        type: 'sukta_ref',
        suktaId: 'purusha-suktam',
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
        suktaId: 'sri-suktam',
        customTitle: 'Sri Suktam'
      }
    ]
  },
  {
    id: 'shanti-patha',
    title: 'शान्ति पाठः (Shanti Patha & Meditation)',
    author: 'Compiled from Saswara Veda Mantrah (Sri Ramakrishna Math)',
    description: 'Meditative peace chants for dhyana and daily start of study',
    preferredBpm: 50,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'sp-1',
        type: 'sukta_ref',
        suktaId: 'shanti-mantras',
        customTitle: 'Vedic Shanti Mantras'
      }
    ]
  },
  {
    id: 'rudram-ts',
    title: 'श्री रुद्रम् — तैत्तिरीय संहिता (Sri Rudram, from the Taittirīya Saṃhitā)',
    author: 'Taittirīya Saṃhitā, kāṇḍa 4 (Wikisource, CC BY-SA 4.0)',
    description: 'The Namakam (TS 4.5) and Chamakam (TS 4.7) described as ranges of the Taittirīya Saṃhitā source.',
    preferredBpm: 60,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'rts-1',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/48.1-58.16',
        customTitle: 'Namakam (TS 4.5)'
      },
      {
        id: 'rts-2',
        type: 'sukta_ref',
        suktaId: 'taittiriya-samhita-4',
        nirdesa: 'taittiriya-samhita-4/68.1-82.45',
        customTitle: 'Chamakam (TS 4.7)'
      }
    ]
  },
  {
    id: 'sri-rudram',
    title: 'श्री रुद्रम् (Sri Rudram · Namakam & Chamakam)',
    author: 'Taittiriya Samhita 4.5 (Krishna Yajurveda). Text from Vignanam, supplied by the maintainer.',
    description: 'The Namakam and the Chamakam, eleven anuvakas each with their concluding mantras, with swara.',
    preferredBpm: 60,
    createdTimestamp: Date.now(),
    items: [
      {
        id: 'sr-1',
        type: 'sukta_ref',
        suktaId: 'rudram-namakam',
        customTitle: 'Namakam'
      },
      {
        id: 'sr-2',
        type: 'sukta_ref',
        suktaId: 'rudram-chamakam',
        customTitle: 'Chamakam'
      }
    ]
  }
];
