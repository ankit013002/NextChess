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
  pieces: ChessPiece[],
  enPassantTarget: number | null = null
): boolean {
  switch (piece.type) {
    case "pawn":
      return checkPawnMovement(piece, to, pieces, enPassantTarget);
    case "rook":
      return checkRookMovement(piece, to, pieceInToTile, pieces);
    case "knight":
      return checkKnightMovement(piece, to, pieceInToTile);
    case "bishop":
      return checkBishopMovement(piece, to, pieceInToTile, pieces);
    case "queen":
      return checkQueenMovement(piece, to, pieceInToTile, pieces);
    case "king":
      return checkKingMovement(piece, to, pieceInToTile, pieces);
    default:
      return false;
  }
}

function checkPawnMovement(
  piece: ChessPiece,
  to: number,
  pieces: ChessPiece[],
  enPassantTarget: number | null
): boolean {
  // Board layout: WHITE at rows 0-1, moves toward row 7 (+1 dir)
  //               BLACK at rows 6-7, moves toward row 0 (-1 dir)
  const dir = piece.side === "WHITE" ? 1 : -1;
  const startRank = piece.side === "WHITE" ? 1 : 6;
  const dr = row(to) - row(piece.position);
  const dc = col(to) - col(piece.position);
  const target = pieces.find((p) => p.position === to && p.position >= 0);

  // One step forward into empty square
  if (dc === 0 && dr === dir && !target) {
    return true;
  }

  // Two steps forward from starting rank through empty squares
  if (
    dc === 0 &&
    dr === 2 * dir &&
    row(piece.position) === startRank &&
    !target &&
    !pieces.some((p) => p.position === piece.position + 8 * dir)
  ) {
    return true;
  }

  // Diagonal capture (normal or en passant)
  if (Math.abs(dc) === 1 && dr === dir) {
    if (target && target.side !== piece.side) return true;
    if (to === enPassantTarget) return true;
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
  pieceInToTile: ChessPiece | undefined,
  pieces: ChessPiece[]
): boolean {
  const dr = Math.abs(row(to) - row(piece.position));
  const dcSigned = col(to) - col(piece.position);
  const dcAbs = Math.abs(dcSigned);

  // Normal one-square king move
  if (dr <= 1 && dcAbs <= 1 && dr + dcAbs > 0) {
    return !pieceInToTile || pieceInToTile.side !== piece.side;
  }

  // Castling: king slides exactly 2 squares horizontally on its starting rank
  if (dr === 0 && dcAbs === 2 && !piece.hasMoved) {
    const isKingside = dcSigned > 0;
    const rookCol = isKingside ? 7 : 0;
    const kingRow = row(piece.position);
    const rookPos = kingRow * 8 + rookCol;
    const rook = pieces.find(
      (p) =>
        p.position === rookPos &&
        p.type === "rook" &&
        p.side === piece.side &&
        !p.hasMoved
    );
    if (!rook) return false;

    // All squares between king and rook must be empty
    const minCol = Math.min(col(piece.position), rookCol) + 1;
    const maxCol = Math.max(col(piece.position), rookCol) - 1;
    for (let c = minCol; c <= maxCol; c++) {
      if (pieces.some((p) => p.position === kingRow * 8 + c && p.position >= 0)) {
        return false;
      }
    }

    return true;
  }

  return false;
}
