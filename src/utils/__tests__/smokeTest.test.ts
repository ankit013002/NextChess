/**
 * Smoke tests for NextChess pure game logic.
 *
 * Board coordinate system (row 0 = WHITE back rank, row 7 = BLACK back rank):
 *   pos = row * 8 + col
 *   WHITE moves in +row direction (+1), BLACK moves in -row direction (-1).
 */

import { describe, it, expect } from "vitest";
import { checkMovementForPiece } from "../checkMovementForPiece";
import {
  computePostMoveBoard,
  isInCheck,
  wouldLeaveInCheck,
  isInStalemate,
} from "../gameLogic";
import { ChessPiece } from "../pieces";

// ── Helper ────────────────────────────────────────────────────────────────────

function makePiece(
  overrides: Partial<ChessPiece> & Pick<ChessPiece, "id" | "type" | "side" | "position">
): ChessPiece {
  return {
    style: {},
    image: (() => null) as never,
    hasMoved: false,
    ...overrides,
  };
}

// ── Test 1: En passant end-to-end ─────────────────────────────────────────────

describe("Smoke Test 1 — en passant end-to-end", () => {
  /**
   * Setup:
   *   WHITE pawn at pos 35 (row 4, col 3).
   *   BLACK pawn just double-moved from pos 52 (row 6, col 4) to pos 36 (row 4, col 4).
   *   EP target = pos 44 (row 5, col 4) — the square BLACK's pawn skipped over.
   *
   * WHITE captures en passant: pawn 35 → 44.
   *   dr = row(44)-row(35) = 5-4 = +1  (WHITE direction ✓)
   *   dc = col(44)-col(35) = 4-3 = +1  (diagonal ✓)
   *   to === EP target (44) → valid.
   *
   * After the capture:
   *   WHITE pawn at 44.
   *   BLACK pawn at 36 removed (44 - 1*8 = 36 ✓).
   */

  const wp = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 35 });
  const bp = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 36 });
  const b = [wp, bp];

  it("checkMovementForPiece allows WHITE pawn to capture en passant to pos 44", () => {
    expect(checkMovementForPiece(wp, 44, undefined, b, 44)).toBe(true);
  });

  it("en passant is rejected when EP target does not match the destination", () => {
    // EP target is 43 (different square) — move to 44 should be invalid
    expect(checkMovementForPiece(wp, 44, undefined, b, 43)).toBe(false);
  });

  it("after computePostMoveBoard with EP the WHITE pawn lands on pos 44", () => {
    const result = computePostMoveBoard(b, 1, 44, 44);
    expect(result.find((p) => p.id === 1)!.position).toBe(44);
  });

  it("after computePostMoveBoard with EP the BLACK pawn at pos 36 is removed (position = -1)", () => {
    const result = computePostMoveBoard(b, 1, 44, 44);
    expect(result.find((p) => p.id === 2)!.position).toBe(-1);
  });
});

// ── Test 2: Castling end-to-end (WHITE kingside) ──────────────────────────────

describe("Smoke Test 2 — WHITE kingside castling end-to-end", () => {
  /**
   * Setup:
   *   WHITE king at pos 4 (row 0, col 4) — hasMoved: false.
   *   WHITE rook at pos 7 (row 0, col 7) — hasMoved: false.
   *   Squares 5 and 6 are empty.
   *
   * King slides two squares kingside: pos 4 → pos 6.
   * Rook jumps to pos 5.
   */

  const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
  const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 7 });
  const b = [wKing, wRook];

  it("checkMovementForPiece allows king to castle kingside (pos 4 → 6)", () => {
    expect(checkMovementForPiece(wKing, 6, undefined, b)).toBe(true);
  });

  it("castling is blocked when a piece sits on the path (pos 5 occupied)", () => {
    const blocker = makePiece({ id: 99, type: "knight", side: "WHITE", position: 5 });
    expect(checkMovementForPiece(wKing, 6, undefined, [wKing, wRook, blocker])).toBe(false);
  });

  it("castling is blocked when a piece sits on the path (pos 6 occupied)", () => {
    const blocker = makePiece({ id: 99, type: "bishop", side: "WHITE", position: 6 });
    expect(checkMovementForPiece(wKing, 6, undefined, [wKing, wRook, blocker])).toBe(false);
  });

  it("after computePostMoveBoard king is at pos 6", () => {
    const result = computePostMoveBoard(b, 1, 6, null, 2, 5);
    expect(result.find((p) => p.id === 1)!.position).toBe(6);
  });

  it("after computePostMoveBoard rook is at pos 5", () => {
    const result = computePostMoveBoard(b, 1, 6, null, 2, 5);
    expect(result.find((p) => p.id === 2)!.position).toBe(5);
  });

  it("after computePostMoveBoard both king and rook have hasMoved = true", () => {
    const result = computePostMoveBoard(b, 1, 6, null, 2, 5);
    expect(result.find((p) => p.id === 1)!.hasMoved).toBe(true);
    expect(result.find((p) => p.id === 2)!.hasMoved).toBe(true);
  });
});

// ── Test 3: Check detection chain ─────────────────────────────────────────────

describe("Smoke Test 3 — check detection chain", () => {
  /**
   * Setup:
   *   WHITE king at pos  4 (row 0, col 4).
   *   WHITE rook at pos 36 (row 4, col 4) — on the same file as king, shields it.
   *   BLACK rook at pos 60 (row 7, col 4) — attacks down file 4.
   *
   * White rook at 36 blocks the BLACK rook's line of sight to the WHITE king.
   * If the WHITE rook moves laterally to pos 37 (row 4, col 5) the file opens
   * and the BLACK rook now has a clear path to the king.
   */

  const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
  const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 36 });
  const bRook = makePiece({ id: 3, type: "rook", side: "BLACK", position: 60 });
  const b = [wKing, wRook, bRook];

  it("isInCheck is false before the rook moves (WHITE rook shields king on file 4)", () => {
    expect(isInCheck("WHITE", b)).toBe(false);
  });

  it("isInCheck is true after WHITE rook moves off file 4 to pos 37", () => {
    const afterMove = computePostMoveBoard(b, 2, 37, null);
    expect(isInCheck("WHITE", afterMove)).toBe(true);
  });

  it("wouldLeaveInCheck returns true for WHITE rook moving to pos 37", () => {
    expect(wouldLeaveInCheck("WHITE", b, 2, 37, null)).toBe(true);
  });

  it("wouldLeaveInCheck returns false for WHITE rook moving along file 4 (pos 28) keeping shield", () => {
    // Moving rook to pos 28 (row 3, col 4) — still on file 4, still blocks
    expect(wouldLeaveInCheck("WHITE", b, 2, 28, null)).toBe(false);
  });
});

// ── Test 4: Stalemate ─────────────────────────────────────────────────────────

describe("Smoke Test 4 — stalemate detection", () => {
  /**
   * Setup:
   *   BLACK king at pos 63 (row 7, col 7).
   *   WHITE queen at pos 53 (row 6, col 5).
   *   WHITE king at pos 45 (row 5, col 5).
   *
   * BLACK king's only adjacent squares: 54 (row 6, col 6), 62 (row 7, col 6), 55 (row 6, col 7).
   *
   * Queen at pos 53 (row 6, col 5) attacks:
   *   • pos 54 (row 6, col 6) — same rank, 1 step right  ✓
   *   • pos 62 (row 7, col 6) — diagonal dr=+1, dc=+1     ✓
   *   • pos 55 (row 6, col 7) — same rank, 2 steps right, path through 54 (empty) ✓
   *
   * None of those squares are occupied, so the BLACK king has zero legal moves
   * and is NOT in check → stalemate.
   *
   * WHITE just moved (currentTurn="WHITE"), so isInStalemate checks BLACK.
   */

  const bKing  = makePiece({ id: 1, type: "king",  side: "BLACK", position: 63 });
  const wQueen = makePiece({ id: 2, type: "queen", side: "WHITE", position: 53 });
  const wKing  = makePiece({ id: 3, type: "king",  side: "WHITE", position: 45 });
  const b = [bKing, wQueen, wKing];

  it("BLACK king is NOT in check (precondition for stalemate)", () => {
    expect(isInCheck("BLACK", b)).toBe(false);
  });

  it("WHITE queen at pos 53 attacks pos 54 (same rank)", () => {
    // If a BLACK piece were at 54 the queen could move there
    const dummy = makePiece({ id: 99, type: "pawn", side: "BLACK", position: 54 });
    expect(checkMovementForPiece(wQueen, 54, dummy, [wQueen, dummy])).toBe(true);
  });

  it("WHITE queen at pos 53 attacks pos 62 diagonally", () => {
    const dummy = makePiece({ id: 99, type: "pawn", side: "BLACK", position: 62 });
    expect(checkMovementForPiece(wQueen, 62, dummy, [wQueen, dummy])).toBe(true);
  });

  it("WHITE queen at pos 53 attacks pos 55 along the rank", () => {
    const dummy = makePiece({ id: 99, type: "pawn", side: "BLACK", position: 55 });
    expect(checkMovementForPiece(wQueen, 55, dummy, [wQueen, dummy])).toBe(true);
  });

  it("isInStalemate returns true (WHITE just moved, BLACK has no legal moves)", () => {
    expect(isInStalemate(b, "WHITE")).toBe(true);
  });

  it("isInStalemate returns false when BLACK king has room to escape", () => {
    // Remove the queen — BLACK king can freely move
    const openBoard = [bKing, wKing];
    expect(isInStalemate(openBoard, "WHITE")).toBe(false);
  });
});
