import { ChessPiece } from "./pieces";

function row(pos: number) {
  return Math.floor(pos / 8);
}

function col(pos: number) {
  return pos % 8;
}

function isPathClear(from: number, to: number, pieces: ChessPiece[]) {
  const dr = row(to) - row(from);
  const dc = col(to) - col(from);
  const stepRow = Math.sign(dr);
  const stepCol = Math.sign(dc);
  if (
    !(
      (stepRow === 0 && stepCol !== 0) ||
      (stepCol === 0 && stepRow !== 0) ||
      Math.abs(dr) === Math.abs(dc)
    )
  ) {
    return false;
  }
  let currentRow = row(from) + stepRow;
  let currentCol = col(from) + stepCol;
  while (currentRow !== row(to) || currentCol !== col(to)) {
    const pos = currentRow * 8 + currentCol;
    if (pieces.some((p) => p.position === pos)) return false;
    currentRow += stepRow;
    currentCol += stepCol;
  }
  return true;
}

export function checkMovementForPiece(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined,
  pieces: ChessPiece[]
): boolean {
  switch (piece.type) {
    case "pawn":
      return checkPawnMovement(piece, to, pieces);
    case "rook":
      return checkRookMovement(piece, to, pieceInToTile, pieces);

    case "knight":
      return checkKnightMovement(piece, to, pieceInToTile);

    case "bishop":
      return checkBishopMovement(piece, to, pieceInToTile, pieces);

    case "queen":
      return checkQueenMovement(piece, to, pieceInToTile, pieces);

    case "king":
      return checkKingMovement(piece, to, pieceInToTile);

    default:
      return false;
  }
}

function checkPawnMovement(
  piece: ChessPiece,
  to: number,
  pieces: ChessPiece[]
): boolean {
  const dir = piece.side === "WHITE" ? 1 : -1; // forward direction
  const startRank = piece.side === "WHITE" ? 1 : 6; // rank index (0–7)
  const dr = row(to) - row(piece.position);
  const dc = col(to) - col(piece.position);
  const target = pieces.find((p) => p.position === to);

  if (dc === 0 && dr === dir && !target) {
    return true;
  }

  if (
    dc === 0 &&
    dr === 2 * dir &&
    row(piece.position) === startRank &&
    !target &&
    !pieces.some((p) => p.position === piece.position + 8 * dir)
  ) {
    return true;
  }

  if (
    Math.abs(dc) === 1 &&
    dr === dir &&
    target &&
    target.side !== piece.side
  ) {
    return true;
  }

  return false;
}

function checkRookMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined,
  pieces: ChessPiece[]
): boolean {
  if (row(to) !== row(piece.position) && col(to) !== col(piece.position)) {
    return false;
  }
  if (!isPathClear(piece.position, to, pieces)) return false;
  return !pieceInToTile || pieceInToTile.side !== piece.side;
}

function checkKnightMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined
): boolean {
  const dr = Math.abs(row(to) - row(piece.position));
  const dc = Math.abs(col(to) - col(piece.position));
  const isL = (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
  return isL && (!pieceInToTile || pieceInToTile.side !== piece.side);
}

function checkBishopMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined,
  pieces: ChessPiece[]
): boolean {
  if (
    Math.abs(row(to) - row(piece.position)) !==
    Math.abs(col(to) - col(piece.position))
  ) {
    return false;
  }
  if (!isPathClear(piece.position, to, pieces)) return false;
  return !pieceInToTile || pieceInToTile.side !== piece.side;
}

function checkQueenMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined,
  pieces: ChessPiece[]
): boolean {
  const sameLine =
    row(to) === row(piece.position) || col(to) === col(piece.position);
  const diagonal =
    Math.abs(row(to) - row(piece.position)) ===
    Math.abs(col(to) - col(piece.position));
  if (!sameLine && !diagonal) return false;
  if (!isPathClear(piece.position, to, pieces)) return false;
  return !pieceInToTile || pieceInToTile.side !== piece.side;
}

function checkKingMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile: ChessPiece | undefined
): boolean {
  const dr = Math.abs(row(to) - row(piece.position));
  const dc = Math.abs(col(to) - col(piece.position));
  const canMove = dr <= 1 && dc <= 1 && dr + dc > 0;
  return canMove && (!pieceInToTile || pieceInToTile.side !== piece.side);
}
