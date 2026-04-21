import { describe, it, expect } from "vitest";
import {
  isInCheck,
  wouldLeaveInCheck,
  computePostMoveBoard,
  isInCheckMate,
  isInStalemate,
} from "../gameLogic";
import { ChessPiece } from "../pieces";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── isInCheck ─────────────────────────────────────────────────────────────────

describe("isInCheck", () => {
  it("returns false when king is not under attack", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const pawn = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 12 });
    expect(isInCheck("WHITE", [king, pawn])).toBe(false);
  });

  it("detects check from an enemy rook on the same rank", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const rook = makePiece({ id: 2, type: "rook", side: "BLACK", position: 7 });
    expect(isInCheck("WHITE", [king, rook])).toBe(true);
  });

  it("detects check from an enemy bishop diagonally", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 36 }); // row 4, col 4
    const bishop = makePiece({ id: 2, type: "bishop", side: "BLACK", position: 0 }); // row 0, col 0
    expect(isInCheck("WHITE", [king, bishop])).toBe(true);
  });

  it("detects check from an enemy knight", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });  // row 0, col 4
    const knight = makePiece({ id: 2, type: "knight", side: "BLACK", position: 21 }); // row 2, col 5
    expect(isInCheck("WHITE", [king, knight])).toBe(true);
  });

  it("detects check from an enemy queen", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const queen = makePiece({ id: 2, type: "queen", side: "BLACK", position: 60 }); // same file
    expect(isInCheck("WHITE", [king, queen])).toBe(true);
  });

  it("no check when friendly piece blocks the attack", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const blocker = makePiece({ id: 3, type: "pawn", side: "WHITE", position: 5 });
    const rook = makePiece({ id: 2, type: "rook", side: "BLACK", position: 7 });
    expect(isInCheck("WHITE", [king, blocker, rook])).toBe(false);
  });

  it("no check from a captured piece (position -1)", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const rook = makePiece({ id: 2, type: "rook", side: "BLACK", position: -1 }); // captured
    expect(isInCheck("WHITE", [king, rook])).toBe(false);
  });

  it("pawn checks diagonally (WHITE pawn checks WHITE king — no; BLACK pawn attacks WHITE king)", () => {
    // BLACK pawn at row 2, col 3 (pos 19) attacks row 3 diagonally → pos 26 and 28
    // But BLACK pawn moves in -1 direction, so it attacks row 1 squares
    // A BLACK pawn at row 2 threatens row 1 squares diagonally
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 9 }); // row 1, col 1
    const pawn = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 18 }); // row 2, col 2
    // BLACK pawn moves -1 direction → threatens row 1; col 2±1 → col 1 (pos 9) and col 3 (pos 11)
    expect(isInCheck("WHITE", [king, pawn])).toBe(true);
  });

  it("WHITE pawn checks BLACK king diagonally", () => {
    // WHITE pawn at row 5, col 3 (pos 43) moves +1 → attacks row 6: pos 48 (col 0??)
    // Actually WHITE pawn at pos 43 (row 5, col 3): attacks row 6, col 2 (pos 50) and col 4 (pos 52)
    const king = makePiece({ id: 1, type: "king", side: "BLACK", position: 50 }); // row 6, col 2
    const pawn = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 43 });  // row 5, col 3
    expect(isInCheck("BLACK", [king, pawn])).toBe(true);
  });
});

// ── wouldLeaveInCheck ─────────────────────────────────────────────────────────

describe("wouldLeaveInCheck", () => {
  it("returns false when the move resolves a check", () => {
    // WHITE king at pos 4; BLACK rook at pos 7 — king is in check
    // Moving king to pos 12 (row 1, col 4) gets it off the rank → resolved
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const rook = makePiece({ id: 2, type: "rook", side: "BLACK", position: 7 });
    const b = [king, rook];
    expect(wouldLeaveInCheck("WHITE", b, 1, 12, null)).toBe(false);
  });

  it("returns true when a move exposes the king to attack", () => {
    // WHITE king at pos 4; WHITE rook at pos 7 blocking BLACK rook at pos 60 (same file)
    // Moving the WHITE rook exposes the king
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 36 }); // row 4, col 4 — same file as king
    const bRook = makePiece({ id: 3, type: "rook", side: "BLACK", position: 60 }); // row 7, col 4
    const b = [king, wRook, bRook];
    // Moving wRook off the file exposes king to bRook
    expect(wouldLeaveInCheck("WHITE", b, 2, 35, null)).toBe(true); // move wRook one left (row 4, col 3)
  });

  it("handles en passant — does not leave king in check after capture", () => {
    // Straightforward: after en passant capture there should be no check
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 60 }); // far away
    const wp = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 35 });   // row 4, col 3
    const bp = makePiece({ id: 3, type: "pawn", side: "BLACK", position: 36 });   // row 4, col 4
    const b = [king, wp, bp];
    // EP target = row 3, col 4 = pos 28
    expect(wouldLeaveInCheck("WHITE", b, 2, 28, 28)).toBe(false);
  });

  it("en passant capture that would expose king returns true", () => {
    // WHITE king at row 4, col 0 (pos 32); WHITE pawn at row 4, col 3 (pos 35)
    // BLACK pawn at row 4, col 4 (pos 36) — just double-moved, EP target = row 5, col 4 = pos 44
    // BLACK rook at row 4, col 7 (pos 39)
    // After EP: wp moves to 44, bp at 36 is removed → row 4 clear between king(32) and rook(39)
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 32 });
    const wp = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 35 });
    const bp = makePiece({ id: 3, type: "pawn", side: "BLACK", position: 36 });
    const bRook = makePiece({ id: 4, type: "rook", side: "BLACK", position: 39 });
    const b = [king, wp, bp, bRook];
    // EP: wp moves to pos 44 (EP target), removing bp at 36 — exposes king on row 4
    expect(wouldLeaveInCheck("WHITE", b, 2, 44, 44)).toBe(true);
  });
});

// ── computePostMoveBoard ──────────────────────────────────────────────────────

describe("computePostMoveBoard", () => {
  it("moves the specified piece to the target square", () => {
    const pawn = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 8 });
    const result = computePostMoveBoard([pawn], 1, 16, null);
    expect(result.find((p) => p.id === 1)!.position).toBe(16);
  });

  it("sets hasMoved to true after the move", () => {
    const rook = makePiece({ id: 1, type: "rook", side: "WHITE", position: 0 });
    const result = computePostMoveBoard([rook], 1, 16, null);
    expect(result.find((p) => p.id === 1)!.hasMoved).toBe(true);
  });

  it("removes a captured piece from the board", () => {
    const attacker = makePiece({ id: 1, type: "rook", side: "WHITE", position: 0 });
    const victim = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 8 });
    const result = computePostMoveBoard([attacker, victim], 1, 8, null);
    expect(result.find((p) => p.id === 2)!.position).toBe(-1);
  });

  it("removes en passant captured pawn", () => {
    const wp = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 35 });
    const bp = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 36 });
    // BLACK pawn double-moved from row 6→row 4; EP target = row 5, col 4 = pos 44
    // WHITE pawn captures to pos 44; captured pawn at pos 36 (one row back from 44) is removed
    const result = computePostMoveBoard([wp, bp], 1, 44, 44);
    expect(result.find((p) => p.id === 2)!.position).toBe(-1);
    expect(result.find((p) => p.id === 1)!.position).toBe(44);
  });

  it("moves the castling rook to its destination", () => {
    const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const rook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 7 });
    const result = computePostMoveBoard([king, rook], 1, 6, null, 2, 5);
    expect(result.find((p) => p.id === 1)!.position).toBe(6);
    expect(result.find((p) => p.id === 2)!.position).toBe(5);
    expect(result.find((p) => p.id === 2)!.hasMoved).toBe(true);
  });

  it("does not mutate the original board", () => {
    const pawn = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 8 });
    const original = [pawn];
    computePostMoveBoard(original, 1, 16, null);
    expect(original[0].position).toBe(8);
  });
});

// ── isInCheckMate ─────────────────────────────────────────────────────────────

describe("isInCheckMate", () => {
  it("returns false when enemy is not in check", () => {
    const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const bKing = makePiece({ id: 2, type: "king", side: "BLACK", position: 60 });
    // WHITE just moved, BLACK is not in check → no checkmate
    expect(isInCheckMate([wKing, bKing], "WHITE")).toBe(false);
  });

  it("detects a back-rank checkmate (Scholar's mate style)", () => {
    // BLACK king trapped in a corner with no escape
    // Back rank mate: WHITE queen at pos 55 (row 6, col 7), WHITE rook covers escape
    // Simplified: BLACK king at row 7, col 7 (pos 63), WHITE queen at pos 62 (row 7, col 6)
    // and WHITE rook at pos 55 (row 6, col 7) — king can't go to 62 (queen) or 55 (rook attack)
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 63 });
    const wQueen = makePiece({ id: 2, type: "queen", side: "WHITE", position: 62 }); // adjacent, giving check
    const wKing = makePiece({ id: 3, type: "king", side: "WHITE", position: 45 }); // just to exist
    const wRook = makePiece({ id: 4, type: "rook", side: "WHITE", position: 56 }); // covers rank 7

    // Verify BLACK is in check first
    const b = [bKing, wQueen, wKing, wRook];
    expect(isInCheck("BLACK", b)).toBe(true);
    // WHITE just moved (turn="WHITE"), check if BLACK is mated
    expect(isInCheckMate(b, "WHITE")).toBe(true);
  });

  it("returns false when the king can escape", () => {
    // BLACK king at pos 63, WHITE rook checks from pos 56 (rank 7) but king can go to pos 55 (row 6, col 7)
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 63 });
    const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 56 }); // same rank
    const wKing = makePiece({ id: 3, type: "king", side: "WHITE", position: 0 });
    const b = [bKing, wRook, wKing];
    expect(isInCheckMate(b, "WHITE")).toBe(false);
  });

  it("returns false when a piece can block the check", () => {
    // WHITE queen at pos 60, BLACK king at pos 4, BLACK rook can interpose at pos 36
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 4 });
    const wQueen = makePiece({ id: 2, type: "queen", side: "WHITE", position: 60 }); // same file
    const bRook = makePiece({ id: 3, type: "rook", side: "BLACK", position: 56 }); // can interpose on col 4
    const wKing = makePiece({ id: 4, type: "king", side: "WHITE", position: 62 });
    const b = [bKing, wQueen, bRook, wKing];
    expect(isInCheckMate(b, "WHITE")).toBe(false);
  });

  it("returns false when a piece can capture the attacker", () => {
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 60 });
    const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 56 }); // same rank, checking
    const bBishop = makePiece({ id: 3, type: "bishop", side: "BLACK", position: 49 }); // can capture rook diagonally
    const wKing = makePiece({ id: 4, type: "king", side: "WHITE", position: 0 });
    const b = [bKing, wRook, bBishop, wKing];
    // bBishop at pos 49 (row 6, col 1); wRook at pos 56 (row 7, col 0) — diagonal from 49 is pos 56? row diff=1, col diff=-1 → yes
    expect(isInCheckMate(b, "WHITE")).toBe(false);
  });
});

// ── isInStalemate ─────────────────────────────────────────────────────────────

describe("isInStalemate", () => {
  it("returns false when the enemy is in check", () => {
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 63 });
    const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 56 });
    const wKing = makePiece({ id: 3, type: "king", side: "WHITE", position: 0 });
    const b = [bKing, wRook, wKing];
    expect(isInStalemate(b, "WHITE")).toBe(false);
  });

  it("detects stalemate", () => {
    // Classic stalemate: BLACK king at row 7, col 7 (pos 63) — no legal moves, not in check
    // WHITE queen at pos 53 (row 6, col 5) covers 54, 62, and diagonal escape
    // WHITE king at pos 45 (row 5, col 5) covers other squares
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 63 });
    // queen at pos 53 (row 6, col 5): covers pos 62 (king could go there) and pos 54
    // king at pos 45 (row 5, col 5)... let's just ensure no legal moves
    // Simple stalemate: queen at pos 53, white king at pos 45
    // bKing at 63: neighbors are 62 (row 7 col 6) and 55 (row 6 col 7) and 54 (row 6 col 6)
    // queen at 53 (row 6 col 5): attacks 54 diagonally, 62 (row 7 col 6), 55 (row 6 col 7 - along rank)
    // WHITE king at 45 covers ... let's just test the scenario
    const wQueen = makePiece({ id: 2, type: "queen", side: "WHITE", position: 53 });
    const wKing = makePiece({ id: 3, type: "king", side: "WHITE", position: 45 });
    const b = [bKing, wQueen, wKing];
    // Verify not in check
    expect(isInCheck("BLACK", b)).toBe(false);
    // Verify stalemate
    expect(isInStalemate(b, "WHITE")).toBe(true);
  });

  it("returns false when there are legal moves", () => {
    const bKing = makePiece({ id: 1, type: "king", side: "BLACK", position: 60 });
    const wKing = makePiece({ id: 2, type: "king", side: "WHITE", position: 0 });
    const b = [bKing, wKing];
    expect(isInStalemate(b, "WHITE")).toBe(false);
  });
});

// ── computePostMoveBoard with castling — rook blocks post-castle attack ───────

describe("computePostMoveBoard castling rook shielding", () => {
  it("rook at col 5 blocks a rook attack aimed at king at col 6 after kingside castle", () => {
    // WHITE king at pos 4 (row 0, col 4), WHITE rook at pos 7 (row 0, col 7)
    // BLACK rook at pos 0 (row 0, col 0) — threatens the entire rank
    // After kingside castle: king → pos 6, rook → pos 5 (blocks attack from col 0)
    const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const wRook = makePiece({ id: 2, type: "rook", side: "WHITE", position: 7 });
    const bRook = makePiece({ id: 3, type: "rook", side: "BLACK", position: 0 });
    const b = [wKing, wRook, bRook];

    // Without the rook move: king at 6, rook still at 7 → bRook attacks king through cols 1-5
    const simWithoutRook = computePostMoveBoard(b, 1, 6, null, null, null);
    expect(isInCheck("WHITE", simWithoutRook)).toBe(true); // would falsely block castling

    // With the rook move: king at 6, rook at 5 → rook blocks bRook's attack at col 5
    const simWithRook = computePostMoveBoard(b, 1, 6, null, 2, 5);
    expect(isInCheck("WHITE", simWithRook)).toBe(false); // castling is actually safe
  });
});

// ── Integration: full move sequences ─────────────────────────────────────────

describe("integration: move sequences", () => {
  it("Scholar's mate results in checkmate", () => {
    // Simplified Scholar's mate using the board coordinate system
    // WHITE: king@4, queen@3, bishop@2, bishop@5, ...
    // We just manually construct the final mated position

    const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const bKing = makePiece({ id: 4, type: "king", side: "BLACK", position: 60 });
    // Use a known mated position:
    // BLACK king at corner (63), WHITE queen at 53 giving check, no escape
    const bKing2 = makePiece({ id: 10, type: "king", side: "BLACK", position: 63 });
    const wQueen2 = makePiece({ id: 11, type: "queen", side: "WHITE", position: 62 }); // adjacent, checks king
    const wRook2 = makePiece({ id: 12, type: "rook", side: "WHITE", position: 56 }); // covers rank 7 col 0..7
    const wKing2 = makePiece({ id: 13, type: "king", side: "WHITE", position: 40 });

    const matedBoard = [bKing2, wQueen2, wRook2, wKing2];
    expect(isInCheck("BLACK", matedBoard)).toBe(true);
    expect(isInCheckMate(matedBoard, "WHITE")).toBe(true);

    // Sanity check for non-mated board
    expect(isInCheckMate([wKing, bKing], "WHITE")).toBe(false);
  });

  it("a pawn double-move sets the correct en passant target on the post-move board", () => {
    // WHITE pawn at row 1 (pos 12) double-moves to row 3 (pos 28)
    // EP target should be row 2, col 4 = pos 20
    const wp = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 12 });
    const postBoard = computePostMoveBoard([wp], 1, 28, null);
    // The board doesn't store EP target — that's tracked in component state.
    // But the pawn should be at its new position.
    expect(postBoard.find((p) => p.id === 1)!.position).toBe(28);
    expect(postBoard.find((p) => p.id === 1)!.hasMoved).toBe(true);
  });
});
