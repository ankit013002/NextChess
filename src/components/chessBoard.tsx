"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ChessPiece,
  chessPieces,
  DefaultChessPiece,
  defaultPieces,
} from "@/utils/pieces";
import { checkMovementForPiece } from "@/utils/checkMovementForPiece";
import {
  isInCheck,
  wouldLeaveInCheck,
  computePostMoveBoard,
  isInCheckMate,
  isInStalemate,
} from "@/utils/gameLogic";
import { createMatch } from "@/webrtc/utils/CreateMatch";
import { joinMatch } from "@/webrtc/utils/JoinMatch";
import { PiecesStateDeltaType, sendMove } from "@/webrtc/utils/SendMove";

interface ChessBoardProps {
  matchId: number;
  isHost: string;
}

const BOARD_SIZE = 8;

function rowOf(pos: number) {
  return Math.floor(pos / 8);
}
function colOf(pos: number) {
  return pos % 8;
}

const ChessBoard = ({ matchId, isHost }: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const playerSide: "WHITE" | "BLACK" = isHost === "true" ? "WHITE" : "BLACK";
  const flipBoard = playerSide === "WHITE";

  const [turn, setTurn] = useState<"WHITE" | "BLACK">("WHITE");
  const [pieces, setPieces] = useState<ChessPiece[]>(chessPieces);
  const [enPassantTarget, setEnPassantTarget] = useState<number | null>(null);
  const [checkMate, setCheckMate] = useState(false);
  const [stalemate, setStalemate] = useState(false);
  const [promotionPopup, setPromotionPopup] = useState(false);
  const [promotingSide, setPromotingSide] = useState<"WHITE" | "BLACK">("WHITE");

  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);
  const draggingIdRef = useRef<number | null>(null);
  const pendingPromotionRef = useRef<{
    pieceId: number;
    to: number;
    enPassantCapturedId: number | null;
    castlingRookId: number | null;
    castlingRookTo: number | null;
  } | null>(null);

  // ── WebRTC setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isHost === "true") {
      createMatch(
        peerConnectionRef,
        dataChannelRef,
        matchId.toString(),
        setPieces,
        setTurn,
        setEnPassantTarget,
        setCheckMate,
        setStalemate
      );
    } else {
      joinMatch(
        matchId.toString(),
        peerConnectionRef,
        dataChannelRef,
        setPieces,
        setTurn,
        setEnPassantTarget,
        setCheckMate,
        setStalemate
      );
    }
  }, [isHost, matchId]);

  // ── Pointer cancel cleanup ─────────────────────────────────────────────────
  useEffect(() => {
    function onCancel() {
      draggingIdRef.current = null;
    }
    window.addEventListener("pointercancel", onCancel, { passive: true });
    return () => window.removeEventListener("pointercancel", onCancel);
  }, []);

  // ── Move execution ────────────────────────────────────────────────────────
  function applyMove(
    pieceId: number,
    to: number,
    newEnPassantTarget: number | null,
    enPassantCapturedId: number | null,
    castlingRookId: number | null,
    castlingRookTo: number | null,
    nextTurn: "WHITE" | "BLACK"
  ) {
    setPieces((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const piece = next.find((p) => p.id === pieceId);
      if (!piece) return prev;

      // Normal capture
      const captured = next.find((p) => p.position === to && p.id !== pieceId);
      if (captured) captured.position = -1;

      // En passant capture
      if (enPassantCapturedId !== null) {
        const epPiece = next.find((p) => p.id === enPassantCapturedId);
        if (epPiece) epPiece.position = -1;
      }

      piece.position = to;
      piece.hasMoved = true;

      // Castling: move the rook alongside the king
      if (castlingRookId !== null && castlingRookTo !== null) {
        const rook = next.find((p) => p.id === castlingRookId);
        if (rook) {
          rook.position = castlingRookTo;
          rook.hasMoved = true;
        }
      }

      return next;
    });

    setTurn(nextTurn);
    setEnPassantTarget(newEnPassantTarget);
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleDragStart(id: number) {
    if (promotionPopup || checkMate || stalemate) return;
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
    // Only allow the correct player to drag their own pieces on their turn
    if (piece.side !== playerSide) return;
    if (piece.side !== turn) return;
    draggingIdRef.current = id;
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent, info: PanInfo) {
    if (draggingIdRef.current == null || !boardRef.current) {
      draggingIdRef.current = null;
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const size = rect.width / BOARD_SIZE;

    const screenCol = Math.floor((info.point.x - rect.left) / size);
    const screenRow = Math.floor((info.point.y - rect.top) / size);

    if (
      screenCol < 0 ||
      screenCol >= BOARD_SIZE ||
      screenRow < 0 ||
      screenRow >= BOARD_SIZE
    ) {
      draggingIdRef.current = null;
      return;
    }

    // Map screen coordinates to board position (accounting for board flip)
    const to = flipBoard
      ? (BOARD_SIZE - 1 - screenRow) * BOARD_SIZE + (BOARD_SIZE - 1 - screenCol)
      : screenRow * BOARD_SIZE + screenCol;

    const piece = pieces.find((p) => p.id === draggingIdRef.current);
    if (!piece) {
      draggingIdRef.current = null;
      return;
    }

    if (to === piece.position) {
      draggingIdRef.current = null;
      return;
    }

    const pieceInToTile = pieces.find(
      (p) => p.position === to && p.position >= 0
    );
    const isValidMovement = checkMovementForPiece(
      piece,
      to,
      pieceInToTile,
      pieces,
      enPassantTarget
    );

    if (!isValidMovement) {
      draggingIdRef.current = null;
      return;
    }

    // ── Castling extra checks ────────────────────────────────────────────────
    let castlingRookId: number | null = null;
    let castlingRookTo: number | null = null;

    if (piece.type === "king" && Math.abs(to - piece.position) === 2) {
      // Cannot castle while in check
      if (isInCheck(turn, pieces)) {
        draggingIdRef.current = null;
        return;
      }

      const isKingside = to > piece.position;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      const kingRow = rowOf(piece.position);
      const rookFromPos = kingRow * 8 + rookFromCol;
      const rookToPos = kingRow * 8 + rookToCol;

      const rook = pieces.find(
        (p) =>
          p.position === rookFromPos &&
          p.type === "rook" &&
          p.side === piece.side &&
          !p.hasMoved
      );
      if (!rook) {
        draggingIdRef.current = null;
        return;
      }
      castlingRookId = rook.id;
      castlingRookTo = rookToPos;

      // King must not pass through a square that is under attack
      const passThroughSquare = piece.position + (isKingside ? 1 : -1);
      if (
        wouldLeaveInCheck(turn, pieces, piece.id, passThroughSquare, enPassantTarget)
      ) {
        draggingIdRef.current = null;
        return;
      }
    }

    // ── Check that this move doesn't leave own king in check ─────────────────
    // For castling, include the rook in the simulation so it can block attacks
    // on the king's destination square (wouldLeaveInCheck only moves the king).
    if (castlingRookId !== null) {
      const castleBoard = computePostMoveBoard(
        pieces,
        piece.id,
        to,
        enPassantTarget,
        castlingRookId,
        castlingRookTo
      );
      if (isInCheck(turn, castleBoard)) {
        draggingIdRef.current = null;
        return;
      }
    } else if (wouldLeaveInCheck(turn, pieces, piece.id, to, enPassantTarget)) {
      draggingIdRef.current = null;
      return;
    }

    // ── Identify en passant capture ───────────────────────────────────────────
    let enPassantCapturedId: number | null = null;
    if (piece.type === "pawn" && to === enPassantTarget) {
      const dir = turn === "WHITE" ? 1 : -1;
      const capturedPawnPos = to - dir * 8;
      const capturedPawn = pieces.find(
        (p) => p.position === capturedPawnPos && p.side !== turn
      );
      if (capturedPawn) enPassantCapturedId = capturedPawn.id;
    }

    // ── Calculate new en passant target ───────────────────────────────────────
    let newEnPassantTarget: number | null = null;
    if (piece.type === "pawn" && Math.abs(to - piece.position) === 16) {
      const dir = turn === "WHITE" ? 1 : -1;
      newEnPassantTarget = piece.position + dir * 8;
    }

    // ── Pawn promotion — apply move but defer turn flip and peer notification ──
    const isPromotion = piece.type === "pawn" && (to < 8 || to >= 56);
    if (isPromotion) {
      // Move the pawn but keep the turn unchanged so the opponent cannot move
      // while the promoting player chooses their piece.
      applyMove(
        piece.id,
        to,
        null, // promotion resets en passant
        enPassantCapturedId,
        castlingRookId,
        castlingRookTo,
        turn // intentionally keep turn — promotePawn will flip it
      );
      pendingPromotionRef.current = {
        pieceId: piece.id,
        to,
        enPassantCapturedId,
        castlingRookId,
        castlingRookTo,
      };
      setPromotingSide(turn);
      setPromotionPopup(true);
      draggingIdRef.current = null;
      return;
    }

    // ── Compute post-move board for checkmate/stalemate detection ─────────────
    const postBoard = computePostMoveBoard(
      pieces,
      piece.id,
      to,
      enPassantTarget,
      castlingRookId,
      castlingRookTo
    );
    const nextTurn: "WHITE" | "BLACK" = turn === "WHITE" ? "BLACK" : "WHITE";
    const mateDetected = isInCheckMate(postBoard, turn, newEnPassantTarget);
    const stalemateDetected =
      !mateDetected && isInStalemate(postBoard, turn, newEnPassantTarget);

    // ── Apply the move ────────────────────────────────────────────────────────
    applyMove(
      piece.id,
      to,
      newEnPassantTarget,
      enPassantCapturedId,
      castlingRookId,
      castlingRookTo,
      nextTurn
    );

    if (mateDetected) setCheckMate(true);
    if (stalemateDetected) setStalemate(true);
    draggingIdRef.current = null;

    // ── Send move to peer ─────────────────────────────────────────────────────
    const delta: PiecesStateDeltaType = {
      pieceId: piece.id,
      pieceMoved: {
        moveTo: to,
        turn: nextTurn,
        check: isInCheck(nextTurn, postBoard),
        checkMate: mateDetected,
        stalemate: stalemateDetected,
        newEnPassantTarget,
        enPassantCapturedId,
        castlingRookId,
        castlingRookTo,
      },
      piecePromoted: null,
    };
    sendMove(delta, dataChannelRef);
  }

  // ── Promotion ─────────────────────────────────────────────────────────────
  function promotePawn(selectedPiece: DefaultChessPiece) {
    const pending = pendingPromotionRef.current;
    if (!pending) return;

    const { pieceId, to, enPassantCapturedId, castlingRookId, castlingRookTo } = pending;
    const movedSide = promotingSide;
    const nextTurn: "WHITE" | "BLACK" = movedSide === "WHITE" ? "BLACK" : "WHITE";
    const promotionColor = movedSide === "WHITE" ? { color: "white" } : { color: "black" };

    // pieces state here already has the pawn at `to` (moved in handleDragEnd).
    // Build the fully-promoted board to detect check/mate/stalemate correctly.
    const postPromotionBoard = pieces.map((p) =>
      p.id === pieceId
        ? { ...p, type: selectedPiece.type, image: selectedPiece.image }
        : p
    );

    const mateDetected = isInCheckMate(postPromotionBoard, movedSide, null);
    const stalemateDetected = !mateDetected && isInStalemate(postPromotionBoard, movedSide, null);
    const checkDetected = isInCheck(nextTurn, postPromotionBoard);

    // Apply the promotion, then flip the turn.
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? { ...p, type: selectedPiece.type, image: selectedPiece.image, style: promotionColor }
          : p
      )
    );
    setTurn(nextTurn);
    if (mateDetected) setCheckMate(true);
    if (stalemateDetected) setStalemate(true);

    setPromotionPopup(false);
    pendingPromotionRef.current = null;

    // Send a single atomic delta with both pieceMoved and piecePromoted so the
    // peer applies the full promotion in one step.
    const delta: PiecesStateDeltaType = {
      pieceId,
      pieceMoved: {
        moveTo: to,
        turn: nextTurn,
        check: checkDetected,
        checkMate: mateDetected,
        stalemate: stalemateDetected,
        newEnPassantTarget: null,
        enPassantCapturedId,
        castlingRookId,
        castlingRookTo,
      },
      piecePromoted: {
        promotion: selectedPiece.type,
        promotingSide: movedSide,
      },
    };
    sendMove(delta, dataChannelRef);
  }

  // ── Board rendering ───────────────────────────────────────────────────────
  const squares = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
    // Map display index to board position (flip for BLACK player)
    const boardPos = flipBoard ? 63 - idx : idx;

    const displayX = idx % BOARD_SIZE;
    const displayY = Math.floor(idx / BOARD_SIZE);
    const isLight = (displayX + displayY) % 2 === 0;

    const piece = pieces.find((p) => p.position === boardPos && p.position >= 0);
    const Icon = piece?.image;

    // Only the current player's pieces on their turn are draggable
    const isDraggable =
      !!piece &&
      piece.side === playerSide &&
      piece.side === turn &&
      !checkMate &&
      !stalemate &&
      !promotionPopup;

    return (
      <div
        key={idx}
        className={`${
          isLight
            ? "bg-[var(--color-light-square)]"
            : "bg-[var(--color-dark-square)]"
        } flex justify-center items-center relative`}
      >
        {/* Rank/file labels on the edge squares */}
        {colOf(boardPos) === (flipBoard ? 7 : 0) && (
          <span className="absolute top-0.5 left-1 text-[0.55rem] font-bold opacity-60 select-none pointer-events-none">
            {8 - rowOf(boardPos)}
          </span>
        )}
        {rowOf(boardPos) === (flipBoard ? 0 : 7) && (
          <span className="absolute bottom-0.5 right-1 text-[0.55rem] font-bold opacity-60 select-none pointer-events-none">
            {String.fromCharCode(97 + colOf(boardPos))}
          </span>
        )}

        <AnimatePresence>
          {Icon && piece && (
            <motion.div
              layout
              key={piece.id}
              drag={isDraggable}
              dragSnapToOrigin
              dragMomentum={false}
              dragElastic={0.1}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
              whileDrag={{ scale: 1.5, zIndex: 1000 }}
              onDragStart={(_, info) => {
                if (info.point) handleDragStart(piece.id);
              }}
              onDragEnd={(e, info) => {
                if (draggingIdRef.current === piece.id && info.point) {
                  handleDragEnd(e as MouseEvent | TouchEvent, info);
                }
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="cursor-grab text-5xl select-none active:cursor-grabbing will-change-transform"
              style={{
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <Icon style={piece.style} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  // ── Game-over overlay ─────────────────────────────────────────────────────
  const gameOverMessage = checkMate
    ? `${turn} is in checkmate — ${turn === "WHITE" ? "BLACK" : "WHITE"} wins!`
    : stalemate
    ? "Stalemate — it's a draw!"
    : null;

  return (
    <div className="h-full min-h-[95vh] flex flex-col items-center gap-4 pt-4">
      {/* Turn indicator */}
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span
          className={`w-4 h-4 rounded-full border border-gray-400 ${
            turn === "WHITE" ? "bg-white" : "bg-gray-900"
          }`}
        />
        {checkMate || stalemate ? (
          <span>{gameOverMessage}</span>
        ) : (
          <span>
            {turn === playerSide ? "Your turn" : "Opponent's turn"} ({turn})
          </span>
        )}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="w-[min(80vw,80vh)] aspect-square border-2 border-gray-700 grid grid-cols-8 grid-rows-8 relative"
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerDown={(e) => e.preventDefault()}
      >
        {squares}

        {/* Checkmate / stalemate overlay */}
        {(checkMate || stalemate) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-[var(--primary)] rounded-xl px-8 py-6 text-center shadow-2xl">
              <div className="text-2xl font-bold">{gameOverMessage}</div>
            </div>
          </div>
        )}

        {/* Promotion popup */}
        {promotionPopup && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-[var(--primary)] rounded-xl px-6 py-4 shadow-2xl">
              <p className="text-center font-semibold mb-3">Choose promotion piece</p>
              <div className="flex gap-4 justify-around">
                {defaultPieces.map((piece, index) => {
                  const Icon = piece.image;
                  const iconStyle =
                    promotingSide === "WHITE"
                      ? { color: "white" }
                      : { color: "black" };
                  return (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <span className="text-xs capitalize">{piece.type}</span>
                      <motion.div
                        onClick={() => promotePawn(piece)}
                        className="text-4xl cursor-pointer"
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.4 }}
                        transition={{ type: "spring" }}
                      >
                        <Icon style={iconStyle} />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player indicator */}
      <div className="text-sm opacity-60">
        You are playing as <strong>{playerSide}</strong>
      </div>
    </div>
  );
};

export default ChessBoard;
