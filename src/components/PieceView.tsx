interface PieceViewProps {
  pieceId: string;
  /** Leave the piece page and go back to the player. */
  onClose: () => void;
}

// Filled in by the piece page task.
export function PieceView({ pieceId }: PieceViewProps) {
  return <main className="piece-view">{pieceId}</main>;
}
