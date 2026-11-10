import { describe, expect, it } from 'bun:test';
import { expandBlock, parseExpansions } from './expansions';

const marker = (n: number) => `<span class="expansion-marker"><a href="#expansion-${n}" class="expansion-link">§${n}</a></span>`;
const entry = (n: number, inner: string, text: string) =>
  `<div class="expansion-entry" id="expansion-${n}">${inner}<div class="expansion-content"><span class="script-text"><span class="script-devanagari">${text}</span></span></div></div>`;

describe('expandBlock', () => {
  const page = entry(63, '', 'विष्णो॒र्नुक॑व्ँवी॒र्या॑णि॒ प्र वो॑चम्॥') + entry(66, '<span id="expansion-67"></span>', 'विच॑क्रमे पृथि॒वीम्॥ त्रिर्दे॒वः पृ॑थि॒वीम्॥');
  const expansions = parseExpansions(page);

  it('replaces a pratīka with its appendix text across sandhi, on a new line', () => {
    expect(expandBlock(`आ॒दौ विष्णो॒र्नु कं॒ ${marker(63)}`, expansions)).toBe('आ॒दौ\nविष्णो॒र्नुक॑व्ँवी॒र्या॑णि॒ प्र वो॑चम्॥');
  });

  it('inserts an entry shared by two markers once', () => {
    expect(expandBlock(`विच॑क्रमे॒ ${marker(66)} त्रिर्दे॒वः ${marker(67)}॥`, expansions)).toBe('\nविच॑क्रमे पृथि॒वीम्॥ त्रिर्दे॒वः पृ॑थि॒वीम्॥ ॥');
  });

  it('drops a marker it cannot resolve and keeps the text', () => {
    expect(expandBlock(`अ॒ग्निः ${marker(99)}`, expansions)).toBe('अ॒ग्निः');
  });
});
