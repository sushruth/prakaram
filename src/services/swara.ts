const SWARA_MARKS = /[॒॑᳚]/;

export function hasSwara(text: string): boolean {
  return SWARA_MARKS.test(text);
}
