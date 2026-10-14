import { adapterFor, hasDocument } from './sourceAdapter';
import type { RequiredSourcePart } from './wiki';

/**
 * The live source parts a screen still has to fetch: a live adapter owns them, they are not registered
 * (in whole, or for the sections asked), and they have not already failed this session. Empty means the
 * screen can render now. Shared by the composition and player routes so both agree on "still loading".
 */
export function pendingSourceParts(parts: RequiredSourcePart[], failed: ReadonlySet<string>): RequiredSourcePart[] {
  return parts.filter((part) => adapterFor(part.id) && !hasDocument(part.id, part.sections) && !failed.has(part.id));
}
