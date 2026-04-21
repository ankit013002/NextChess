import { describe, it, expect } from "vitest";
import { checkMovementForPiece } from "../checkMovementForPiece";
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

/** Build a board with just the supplied pieces (all others absent). */
function board(...pieces: ChessPiece[]): ChessPiece[] {
  return pieces;
}

function pieceAt(b: ChessPiece[], pos: number) {
  return b.find((p) => p.position === pos);
}

// ── PAWN ──────────────────────────────────────────────────────────────────────

describe("pawn movement", () => {
  // Board layout: WHITE at rows 0-1, moves +1 (downward toward row 7)
  //               BLACK at rows 6-7, moves -1 (upward toward row 0)

  const whitePawn = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 8 }); // row 1, col 0
  const blackPawn = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 48 }); // row 6, col 0

  it("WHITE pawn moves one step forward", () => {
    const b = board(whitePawn);
    expect(checkMovementForPiece(whitePawn, 16, undefined, b)).toBe(true); // row 2
  });

  it("WHITE pawn moves two steps from start rank", () => {
    const b = board(whitePawn);
    expect(checkMovementForPiece(whitePawn, 24, undefined, b)).toBe(true); // row 3
  });

  it("WHITE pawn cannot move two steps if intermediate square is occupied", () => {
    const blocker = makePiece({ id: 99, type: "pawn", side: "BLACK", position: 16 });
    const b = board(whitePawn, blocker);
    expect(checkMovementForPiece(whitePawn, 24, undefined, b)).toBe(false);
  });

  it("WHITE pawn cannot move two steps from non-start rank", () => {
    const pawn = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 16 }); // row 2
    const b = board(pawn);
    expect(checkMovementForPiece(pawn, 32, undefined, b)).toBe(false);
  });

  it("WHITE pawn cannot move backwards", () => {
    const b = board(whitePawn);
    expect(checkMovementForPiece(whitePawn, 0, undefined, b)).toBe(false);
  });

  it("WHITE pawn cannot capture forward", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 16 });
    const b = board(whitePawn, enemy);
    expect(checkMovementForPiece(whitePawn, 16, enemy, b)).toBe(false);
  });

  it("WHITE pawn captures diagonally", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 17 }); // row 2, col 1
    const b = board(whitePawn, enemy);
    expect(checkMovementForPiece(whitePawn, 17, enemy, b)).toBe(true);
  });

  it("WHITE pawn cannot capture own piece diagonally", () => {
    const friendly = makePiece({ id: 3, type: "pawn", side: "WHITE", position: 17 });
    const b = board(whitePawn, friendly);
    expect(checkMovementForPiece(whitePawn, 17, friendly, b)).toBe(false);
  });

  it("BLACK pawn moves one step forward (toward row 0)", () => {
    const b = board(blackPawn);
    expect(checkMovementForPiece(blackPawn, 40, undefined, b)).toBe(true); // row 5
  });

  it("BLACK pawn moves two steps from start rank", () => {
    const b = board(blackPawn);
    expect(checkMovementForPiece(blackPawn, 32, undefined, b)).toBe(true); // row 4
  });

  it("BLACK pawn cannot move two steps if path blocked", () => {
    const blocker = makePiece({ id: 99, type: "pawn", side: "WHITE", position: 40 });
    const b = board(blackPawn, blocker);
    expect(checkMovementForPiece(blackPawn, 32, undefined, b)).toBe(false);
  });

  it("BLACK pawn captures diagonally", () => {
    const enemy = makePiece({ id: 3, type: "pawn", side: "WHITE", position: 41 }); // row 5, col 1
    const b = board(blackPawn, enemy);
    expect(checkMovementForPiece(blackPawn, 41, enemy, b)).toBe(true);
  });

  it("en passant capture by WHITE pawn", () => {
    // WHITE pawn at row 4, col 3 (pos 35)
    // BLACK pawn double-moved from row 6 (pos 52) to row 4 (pos 36), passing through row 5 (pos 44)
    // enPassantTarget = row 5, col 4 = pos 44
    // WHITE pawn moves diagonally forward (+1 row) to pos 44
    const wp = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 35 });
    const bp = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 36 });
    const b = board(wp, bp);
    expect(checkMovementForPiece(wp, 44, undefined, b, 44)).toBe(true);
  });

  it("en passant capture by BLACK pawn", () => {
    // BLACK pawn at row 3, col 3 (pos 27)
    // WHITE pawn double-moved from row 1 (pos 12) to row 3 (pos 28), passing through row 2 (pos 20)
    // enPassantTarget = row 2, col 4 = pos 20
    // BLACK pawn moves diagonally forward (-1 row) to pos 20
    const bp = makePiece({ id: 1, type: "pawn", side: "BLACK", position: 27 });
    const wp = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 28 });
    const b = board(bp, wp);
    expect(checkMovementForPiece(bp, 20, undefined, b, 20)).toBe(true);
  });

  it("en passant not valid when target does not match", () => {
    const wp = makePiece({ id: 1, type: "pawn", side: "WHITE", position: 35 });
    const b = board(wp);
    // Square 44 is empty; enPassantTarget is 45 (different column) — should not be valid
    expect(checkMovementForPiece(wp, 44, undefined, b, 45)).toBe(false);
  });
});

// ── ROOK ──────────────────────────────────────────────────────────────────────

describe("rook movement", () => {
  const rook = makePiece({ id: 1, type: "rook", side: "WHITE", position: 27 }); // row 3, col 3

  it("moves along a rank", () => {
    const b = board(rook);
    expect(checkMovementForPiece(rook, 24, undefined, b)).toBe(true); // row 3, col 0
    expect(checkMovementForPiece(rook, 31, undefined, b)).toBe(true); // row 3, col 7
  });

  it("moves along a file", () => {
    const b = board(rook);
    expect(checkMovementForPiece(rook, 3, undefined, b)).toBe(true);  // row 0, col 3
    expect(checkMovementForPiece(rook, 59, undefined, b)).toBe(true); // row 7, col 3
  });

  it("cannot move diagonally", () => {
    const b = board(rook);
    expect(checkMovementForPiece(rook, 18, undefined, b)).toBe(false);
  });

  it("cannot jump over pieces", () => {
    const blocker = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 29 }); // col 5
    const b = board(rook, blocker);
    expect(checkMovementForPiece(rook, 31, undefined, b)).toBe(false); // blocked by col 5
  });

  it("can capture an enemy piece", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 31 });
    const b = board(rook, enemy);
    expect(checkMovementForPiece(rook, 31, enemy, b)).toBe(true);
  });

  it("cannot capture a friendly piece", () => {
    const friendly = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 31 });
    const b = board(rook, friendly);
    expect(checkMovementForPiece(rook, 31, friendly, b)).toBe(false);
  });
});

// ── KNIGHT ────────────────────────────────────────────────────────────────────

describe("knight movement", () => {
  const knight = makePiece({ id: 1, type: "knight", side: "WHITE", position: 27 }); // row 3, col 3

  // From pos 27 (row 3, col 3): valid L-shapes are row±1/col±2 and row±2/col±1
  // (1,2)=10, (1,4)=12, (2,1)=17, (2,5)=21, (4,1)=33, (4,5)=37, (5,2)=42, (5,4)=44
  it.each([
    [10], [12], [17], [21], [33], [37], [42], [44],
  ])("can jump to valid L-shape square %i", (to) => {
    const b = board(knight);
    expect(checkMovementForPiece(knight, to, undefined, b)).toBe(true);
  });

  it("cannot move to a non-L-shape square", () => {
    const b = board(knight);
    expect(checkMovementForPiece(knight, 28, undefined, b)).toBe(false);
    expect(checkMovementForPiece(knight, 19, undefined, b)).toBe(false);
  });

  it("jumps over intervening pieces", () => {
    const blockers = [26, 28, 18, 19, 35, 36].map((pos, i) =>
      makePiece({ id: 10 + i, type: "pawn", side: "BLACK", position: pos })
    );
    const b = board(knight, ...blockers);
    expect(checkMovementForPiece(knight, 42, undefined, b)).toBe(true);
  });

  it("cannot capture a friendly piece", () => {
    const friendly = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 42 });
    const b = board(knight, friendly);
    expect(checkMovementForPiece(knight, 42, friendly, b)).toBe(false);
  });

  it("can capture an enemy piece", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 42 });
    const b = board(knight, enemy);
    expect(checkMovementForPiece(knight, 42, enemy, b)).toBe(true);
  });

  it("cannot move off the board edge with wrap-around", () => {
    // Knight at col 0 (pos 16); L-shape to the left would wrap around
    const kn = makePiece({ id: 1, type: "knight", side: "WHITE", position: 16 }); // row 2, col 0
    const b = board(kn);
    // row 3, col -1 would be pos 31 due to wrap — that's actually valid geometry but wrong column
    // (row 3, col 7 is 31 but col diff is 7, not 1 — should be rejected)
    expect(checkMovementForPiece(kn, 31, undefined, b)).toBe(false);
  });
});

// ── BISHOP ────────────────────────────────────────────────────────────────────

describe("bishop movement", () => {
  const bishop = makePiece({ id: 1, type: "bishop", side: "WHITE", position: 27 }); // row 3, col 3

  it("moves diagonally", () => {
    const b = board(bishop);
    expect(checkMovementForPiece(bishop, 0, undefined, b)).toBe(true);  // top-left diagonal
    expect(checkMovementForPiece(bishop, 63, undefined, b)).toBe(true); // bottom-right diagonal
    expect(checkMovementForPiece(bishop, 6, undefined, b)).toBe(true);  // top-right (row0 col6)
    expect(checkMovementForPiece(bishop, 48, undefined, b)).toBe(true); // bottom-left (row6 col0)
  });

  it("cannot move along a rank or file", () => {
    const b = board(bishop);
    expect(checkMovementForPiece(bishop, 24, undefined, b)).toBe(false);
    expect(checkMovementForPiece(bishop, 3, undefined, b)).toBe(false);
  });

  it("cannot jump over pieces", () => {
    const blocker = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 18 }); // row 2, col 2
    const b = board(bishop, blocker);
    expect(checkMovementForPiece(bishop, 9, undefined, b)).toBe(false); // blocked by row 2
  });

  it("can capture an enemy piece", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 18 });
    const b = board(bishop, enemy);
    expect(checkMovementForPiece(bishop, 18, enemy, b)).toBe(true);
  });

  it("cannot capture a friendly piece", () => {
    const friendly = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 18 });
    const b = board(bishop, friendly);
    expect(checkMovementForPiece(bishop, 18, friendly, b)).toBe(false);
  });
});

// ── QUEEN ─────────────────────────────────────────────────────────────────────

describe("queen movement", () => {
  const queen = makePiece({ id: 1, type: "queen", side: "WHITE", position: 27 }); // row 3, col 3

  it("moves diagonally", () => {
    const b = board(queen);
    expect(checkMovementForPiece(queen, 0, undefined, b)).toBe(true);
    expect(checkMovementForPiece(queen, 63, undefined, b)).toBe(true);
  });

  it("moves along a rank", () => {
    const b = board(queen);
    expect(checkMovementForPiece(queen, 24, undefined, b)).toBe(true);
    expect(checkMovementForPiece(queen, 31, undefined, b)).toBe(true);
  });

  it("moves along a file", () => {
    const b = board(queen);
    expect(checkMovementForPiece(queen, 3, undefined, b)).toBe(true);
    expect(checkMovementForPiece(queen, 59, undefined, b)).toBe(true);
  });

  it("cannot move in an L-shape", () => {
    const b = board(queen);
    expect(checkMovementForPiece(queen, 42, undefined, b)).toBe(false);
  });

  it("cannot jump over pieces on a rank", () => {
    const blocker = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 25 });
    const b = board(queen, blocker);
    expect(checkMovementForPiece(queen, 24, undefined, b)).toBe(false);
  });

  it("can capture an enemy piece", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 25 });
    const b = board(queen, enemy);
    expect(checkMovementForPiece(queen, 25, enemy, b)).toBe(true);
  });
});

// ── KING ──────────────────────────────────────────────────────────────────────

describe("king movement", () => {
  const king = makePiece({ id: 1, type: "king", side: "WHITE", position: 27 }); // row 3, col 3

  it.each([18, 19, 20, 26, 28, 34, 35, 36])(
    "moves one square in all directions to %i",
    (to) => {
      const b = board(king);
      expect(checkMovementForPiece(king, to, undefined, b)).toBe(true);
    }
  );

  it("cannot move two squares normally", () => {
    const b = board(king);
    expect(checkMovementForPiece(king, 29, undefined, b)).toBe(false);
  });

  it("cannot capture a friendly piece", () => {
    const friendly = makePiece({ id: 2, type: "pawn", side: "WHITE", position: 28 });
    const b = board(king, friendly);
    expect(checkMovementForPiece(king, 28, friendly, b)).toBe(false);
  });

  it("can capture an enemy piece", () => {
    const enemy = makePiece({ id: 2, type: "pawn", side: "BLACK", position: 28 });
    const b = board(king, enemy);
    expect(checkMovementForPiece(king, 28, enemy, b)).toBe(true);
  });

  describe("castling", () => {
    // WHITE king at position 4 (row 0, col 4), rooks at 0 and 7
    const wKing = makePiece({ id: 1, type: "king", side: "WHITE", position: 4 });
    const wRookK = makePiece({ id: 2, type: "rook", side: "WHITE", position: 7 }); // kingside
    const wRookQ = makePiece({ id: 3, type: "rook", side: "WHITE", position: 0 }); // queenside

    it("WHITE can castle kingside when path is clear", () => {
      const b = board(wKing, wRookK, wRookQ);
      expect(checkMovementForPiece(wKing, 6, undefined, b)).toBe(true);
    });

    it("WHITE can castle queenside when path is clear", () => {
      const b = board(wKing, wRookK, wRookQ);
      expect(checkMovementForPiece(wKing, 2, undefined, b)).toBe(true);
    });

    it("cannot castle kingside if path is blocked", () => {
      const blocker = makePiece({ id: 5, type: "knight", side: "WHITE", position: 6 });
      const b = board(wKing, wRookK, wRookQ, blocker);
      expect(checkMovementForPiece(wKing, 6, undefined, b)).toBe(false);
    });

    it("cannot castle queenside if path is blocked", () => {
      const blocker = makePiece({ id: 5, type: "bishop", side: "WHITE", position: 3 });
      const b = board(wKing, wRookK, wRookQ, blocker);
      expect(checkMovementForPiece(wKing, 2, undefined, b)).toBe(false);
    });

    it("cannot castle if king has moved", () => {
      const movedKing = { ...wKing, hasMoved: true };
      const b = board(movedKing, wRookK, wRookQ);
      expect(checkMovementForPiece(movedKing, 6, undefined, b)).toBe(false);
    });

    it("cannot castle if rook has moved", () => {
      const movedRook = { ...wRookK, hasMoved: true };
      const b = board(wKing, movedRook, wRookQ);
      expect(checkMovementForPiece(wKing, 6, undefined, b)).toBe(false);
    });

    it("cannot castle if rook is not present", () => {
      const b = board(wKing); // no rooks
      expect(checkMovementForPiece(wKing, 6, undefined, b)).toBe(false);
    });

    it("BLACK can castle kingside", () => {
      const bKing = makePiece({ id: 10, type: "king", side: "BLACK", position: 60 });
      const bRookK = makePiece({ id: 11, type: "rook", side: "BLACK", position: 63 });
      const bRookQ = makePiece({ id: 12, type: "rook", side: "BLACK", position: 56 });
      const b = board(bKing, bRookK, bRookQ);
      expect(checkMovementForPiece(bKing, 62, undefined, b)).toBe(true);
    });

    it("BLACK can castle queenside", () => {
      const bKing = makePiece({ id: 10, type: "king", side: "BLACK", position: 60 });
      const bRookK = makePiece({ id: 11, type: "rook", side: "BLACK", position: 63 });
      const bRookQ = makePiece({ id: 12, type: "rook", side: "BLACK", position: 56 });
      const b = board(bKing, bRookK, bRookQ);
      expect(checkMovementForPiece(bKing, 58, undefined, b)).toBe(true);
    });
  });
});
