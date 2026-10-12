/** Count the characters on each wrapped screen line of an element, by measuring where every character sits. */
export function measureLines(el: Element): number[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const counts: number[] = [];
  let top = -Infinity;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect || !rect.height) continue;
      // A new screen line starts when a character sits clearly below the previous one.
      if (rect.top > top + rect.height * 0.6) {
        counts.push(0);
        top = rect.top;
      }
      counts[counts.length - 1]++;
    }
  }
  return counts;
}
