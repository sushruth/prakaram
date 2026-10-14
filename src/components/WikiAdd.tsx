import { useBasketStore } from '../stores/useBasketStore';

/** Text toggle: adds a piece to the basket, then reads "Added ✓ · remove". */
export function AddToPrakaram({ pieceIds }: { pieceIds: string[] }) {
  const added = useBasketStore((s) => pieceIds.length > 0 && pieceIds.every((p) => s.items.includes(p)));
  const { add, remove } = useBasketStore.getState();
  return added ? (
    <button type="button" className="wiki-link wiki-add" data-added onClick={() => pieceIds.forEach(remove)}>
      Added ✓ · remove
    </button>
  ) : (
    <button type="button" className="wiki-link wiki-add" onClick={() => pieceIds.forEach(add)}>
      Add to my prakaram
    </button>
  );
}
