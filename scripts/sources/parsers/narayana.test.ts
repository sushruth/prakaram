import { describe, expect, it } from 'bun:test';
import { parseNarayana } from './narayana';

const page = (body: string) => `<pre id="content">title\nॐ सह नाववतु ।\n${body}\nशान्ताकारं भुजगशयनं ॥\nEncoded by someone</pre>`;
const khanda = (n: string) => `(${n} खण्डः\nheading)`;

describe('parseNarayana', () => {
  const doc = parseNarayana(page(`${khanda('प्रथमः')}\nअथ पुरुषः । (एतदृग्वेदशिरोऽधीते ।)\n${khanda('द्वितीयः')}\nनित्यः ॥\n${khanda('तृतीयः')}\nओम् । var  ओम्\n${khanda('चतुर्थः')}\nविद्याऽध्ययनफलम् ।\nइत्युपनिषत् ॥`));

  it('makes one section per khaṇḍa, with the opening śānti in the first', () => {
    expect(doc.sections.map((s) => s.chunks.length)).toEqual([2, 1, 1, 1]);
  });

  it('leaves out headings, bracketed notes, variant readings, the dhyāna verse and the credit', () => {
    const text = doc.sections.flatMap((s) => s.chunks.map((c) => c.sanskrit)).join(' ');
    for (const gone of ['heading', 'एतदृग्वेद', 'var', 'विद्याऽध्ययनफलम्', 'शान्ताकारं', 'Encoded']) expect(text).not.toContain(gone);
  });
});
