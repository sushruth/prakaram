import { describe, it, expect } from 'bun:test';
import { transliterateVedic } from './transliteration';

describe('Vedic Indic Transliteration', () => {
  const gayatri = 'ॐ भूर्भुवः॒ स्वः॑ । तत्स॑वि॒तुर्वरे॑ण्यं॒ भर्गो॑ दे॒वस्य॑ धीमहि ।';

  it('preserves master Devanagari untouched', () => {
    expect(transliterateVedic(gayatri, 'devanagari')).toBe(gayatri);
  });

  it('transliterates correctly into Telugu with Vedic swaras intact', () => {
    const telugu = transliterateVedic(gayatri, 'telugu');
    expect(telugu).toContain('ఓం');
    expect(telugu).toContain('\u0951'); // Svarita
    expect(telugu).toContain('\u0952'); // Anudatta
    expect(telugu).toContain('భూర్భువః॒');
  });

  it('transliterates correctly into Kannada with Vedic swaras intact', () => {
    const kannada = transliterateVedic(gayatri, 'kannada');
    expect(kannada).toContain('ಓಂ');
    expect(kannada).toContain('\u0951');
    expect(kannada).toContain('\u0952');
    expect(kannada).toContain('ಭೂರ್ಭುವಃ॒');
  });

  it('transliterates correctly into Tamil with subscripted numerals', () => {
    const tamil = transliterateVedic(gayatri, 'tamil');
    expect(tamil).toContain('ௐ');
    expect(tamil).toContain('பூ₄ர்பு₄வஃ॒');
  });

  it('transliterates correctly into IAST Roman with combining Vedic accents', () => {
    const iast = transliterateVedic(gayatri, 'iast');
    expect(iast).toContain('oṃ');
    expect(iast).toContain('|');
    expect(iast).toContain('bhūrbhuvaḥ');
  });
});
