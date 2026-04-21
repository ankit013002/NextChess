import { ChessPiece } from "./pieces";
import { checkMovementForPiece } from "./checkMovementForPiece";

export function isInCheck(side: "WHITE" | "BLACK", board: ChessPiece[]): boolean {
  const king = board.find(
    (p) => p.type === "king" && p.side === side && p.position >= 0
  );
  if (!king) return false;
  return board.some(
    (p) =>
      p.side !== side &&
      p.position >= 0 &&
      checkMovementForPiece(p, king.position, king, board, null)
  );
}

export function wouldLeaveInCheck(
  currentSide: "WHITE" | "BLACK",
  board: ChessPiece[],
  movingId: number,
  to: number,
  enPassantTarget: number | null
): boolean {
  const sim = board.map((p) => ({ ...p }));
  const mover = sim.find((p) => p.id === movingId);
  if (!mover) return true;

  const victim = sim.find((p) => p.position === to && p.id !== movingId);
  if (victim) victim.position = -1;

  // En passant: the captured pawn is not on `to` but one rank behind it
  if (mover.type === "pawn" && to === enPassantTarget) {
    const dir = currentSide === "WHITE" ? 1 : -1;
    const capturedPawnPos = to - dir * 8;
    const capturedPawn = sim.find(
      (p) => p.position === capturedPawnPos && p.side !== currentSide
    );
    if (capturedPawn) capturedPawn.position = -1;
  }

  mover.position = to;
  return isInCheck(currentSide, sim);
}

export function computePostMoveBoard(
  board: ChessPiece[],
  movingId: number,
  to: number,
  enPassantTarget: number | null,
  castlingRookId: number | null = null,
  castlingRookTo: number | null = null
): ChessPiece[] {
  const sim = board.map((p) => ({ ...p }));
  const mover = sim.find((p) => p.id === movingId);
  if (!mover) return sim;

  const victim = sim.find((p) => p.position === to && p.id !== movingId);
  if (victim) victim.position = -1;

  if (mover.type === "pawn" && to === enPassantTarget) {
    const dir = mover.side === "WHITE" ? 1 : -1;
    const capturedPawnPos = to - dir * 8;
    const capturedPawn = sim.find(
      (p) => p.position === capturedPawnPos && p.side !== mover.side
    );
    if (capturedPawn) capturedPawn.position = -1;
  }

  mover.position = to;
  mover.hasMoved = true;

  if (castlingRookId !== null && castlingRookTo !== null) {
    const rook = sim.find((p) => p.id === castlingRookId);
    if (rook) {
      rook.position = castlingRookTo;
      rook.hasMoved = true;
    }
  }

  return sim;
}

export function isInCheckMate(
  board: ChessPiece[],
  currentTurn: "WHITE" | "BLACK",
  enPassantTarget: number | null = null
): boolean {
  // The side that just moved is `currentTurn`; check if the OPPONENT is mated
  const enemySide = currentTurn === "WHITE" ? "BLACK" : "WHITE";

  if (!isInCheck(enemySide, board)) return false;

  const enemyPieces = board.filter(
    (p) => p.side === enemySide && p.position >= 0
  );

  for (const piece of enemyPieces) {
    for (let i = 0; i < 64; i++) {
      // Castling from check is illegal — skip 2-square king moves when in check
      if (piece.type === "king" && Math.abs(i - piece.position) === 2) continue;

      const targetPiece = board.find((p) => p.position === i && p.position >= 0);
      if (checkMovementForPiece(piece, i, targetPiece, board, enPassantTarget)) {
        if (!wouldLeaveInCheck(enemySide, board, piece.id, i, enPassantTarget)) {
          return false; // Found a legal escape — not checkmate
        }
      }
    }
  }

  return true;
}

export function isInStalemate(
  board: ChessPiece[],
  currentTurn: "WHITE" | "BLACK",
  enPassantTarget: number | null = null
): boolean {
  const enemySide = currentTurn === "WHITE" ? "BLACK" : "WHITE";

  if (isInCheck(enemySide, board)) return false; // check ≠ stalemate

  const enemyPieces = board.filter(
    (p) => p.side === enemySide && p.position >= 0
  );

  for (const piece of enemyPieces) {
    for (let i = 0; i < 64; i++) {
      const targetPiece = board.find((p) => p.position === i && p.position >= 0);
      if (!checkMovementForPiece(piece, i, targetPiece, board, enPassantTarget)) {
        continue;
      }

      // Castling requires a full simulation: move both king and rook, and verify
      // the king does not pass through a square under attack.
      if (piece.type === "king" && Math.abs(i - piece.position) === 2) {
        const isKingside = i > piece.position;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        const kingRow = Math.floor(piece.position / 8);
        const rookFromPos = kingRow * 8 + rookFromCol;
        const rookToPos = kingRow * 8 + rookToCol;
        const rook = board.find(
          (p) =>
            p.position === rookFromPos &&
            p.type === "rook" &&
            p.side === enemySide &&
            !p.hasMoved
        );
        if (!rook) continue;

        const passThroughSquare = piece.position + (isKingside ? 1 : -1);
        if (wouldLeaveInCheck(enemySide, board, piece.id, passThroughSquare, enPassantTarget)) {
          continue;
        }

        const castleBoard = computePostMoveBoard(board, piece.id, i, enPassantTarget, rook.id, rookToPos);
        if (!isInCheck(enemySide, castleBoard)) return false;
        continue;
      }

      if (!wouldLeaveInCheck(enemySide, board, piece.id, i, enPassantTarget)) {
        return false;
      }
    }
  }

  return true;
}
