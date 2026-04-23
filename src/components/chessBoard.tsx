"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import {
  deserializePieces,
  SavedGameState,
  saveGameState,
} from "@/webrtc/utils/GameStateSync";

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

/* ── Theme toggle (self-contained, used in game header) ─────────────────── */
function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const isDark = saved
      ? saved === "dark"
      : document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-circle btn-sm text-white/80 hover:text-white hover:bg-white/10"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64 13.01A9 9 0 1111 2.36 7 7 0 0021.64 13z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 4a1 1 0 011 1v1h-2v-1a1 1 0 011-1zm0-22a1 1 0 01-1-1V0h2v1a1 1 0 01-1 1zM0 13a1 1 0 011-1H1v2H1a1 1 0 01-1-1zm23 0a1 1 0 01-1 1h-1v-2h1a1 1 0 011 1zM4.22 4.22A1 1 0 015.64 2.8l.71.71-1.41 1.41-.72-.7zm13.43 13.43a1 1 0 011.41 1.41l-.71.71-1.41-1.41.71-.71zM4.22 19.78a1 1 0 01-1.41-1.41l.71-.71 1.41 1.41-.71.71zm15.56-15.56a1 1 0 01-1.41-1.41l.71-.71 1.41 1.41-.71.71z" />
        </svg>
      )}
    </button>
  );
}

/* ── Copy button ────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy match ID"
      className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

/* ── Main board component ───────────────────────────────────────────────── */
const ChessBoard = ({ matchId, isHost }: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  // Assigned after the connection resolves: host picks randomly, guest gets the opposite.
  const [playerSide, setPlayerSide] = useState<"WHITE" | "BLACK" | null>(null);
  const flipBoard = playerSide === "WHITE";

  const [turn, setTurn] = useState<"WHITE" | "BLACK">("WHITE");
  const [pieces, setPieces] = useState<ChessPiece[]>(chessPieces);
  const [enPassantTarget, setEnPassantTarget] = useState<number | null>(null);
  const [checkMate, setCheckMate] = useState(false);
  const [stalemate, setStalemate] = useState(false);
  const [promotionPopup, setPromotionPopup] = useState(false);
  const [promotingSide, setPromotingSide] = useState<"WHITE" | "BLACK">("WHITE");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [connectionVersion, setConnectionVersion] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const draggingIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pendingPromotionRef = useRef<{
    pieceId: number;
    to: number;
    enPassantCapturedId: number | null;
    castlingRookId: number | null;
    castlingRookTo: number | null;
  } | null>(null);

  // ── WebRTC setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setConnectionStatus("connecting");

    let isActive = true;

    const onConnected = () => {
      if (isActive) setConnectionStatus("connected");
    };
    const onDisconnected = () => {
      if (isActive) setConnectionStatus("disconnected");
    };

    function restoreGameState(saved: SavedGameState) {
      pendingPromotionRef.current = null;
      setPromotionPopup(false);
      setPieces(deserializePieces(saved.pieces));
      setTurn(saved.turn);
      setEnPassantTarget(saved.enPassantTarget);
      setCheckMate(saved.checkMate);
      setStalemate(saved.stalemate);
    }

    const init = async () => {
      try {
        if (isHost === "true") {
          const { cleanup, savedState, playerColor } = await createMatch(
            peerConnectionRef,
            dataChannelRef,
            matchId.toString(),
            setPieces,
            setTurn,
            setEnPassantTarget,
            setCheckMate,
            setStalemate,
            onConnected,
            onDisconnected
          );
          if (!isActive) { cleanup(); return; }
          cleanupRef.current = cleanup;
          setPlayerSide(playerColor);
          if (savedState) restoreGameState(savedState);
        } else {
          const onHostReconnect = () => setConnectionVersion((v) => v + 1);
          const { cleanup, savedState, playerColor } = await joinMatch(
            matchId.toString(),
            peerConnectionRef,
            dataChannelRef,
            setPieces,
            setTurn,
            setEnPassantTarget,
            setCheckMate,
            setStalemate,
            onConnected,
            onDisconnected,
            onHostReconnect
          );
          if (!isActive) { cleanup(); return; }
          cleanupRef.current = cleanup;
          setPlayerSide(playerColor);
          if (savedState) restoreGameState(savedState);
        }
      } catch (err) {
        console.error("Failed to connect:", err);
        if (isActive) setConnectionStatus("disconnected");
      }
    };

    init();

    return () => {
      isActive = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, matchId, connectionVersion]);

  // ── Host auto-restart on disconnect ───────────────────────────────────────
  // When the guest drops, the host's remoteDescSet closure is already true, so
  // it can never accept a fresh answer from a returning guest. Incrementing
  // connectionVersion re-runs createMatch — new peer connection, new sessionId,
  // remoteDescSet reset to false — and the guest's unsubHostWatch fires the
  // onHostReconnect callback so they re-join automatically.
  // The 3 s delay lets transient ICE "disconnected" states recover on their own
  // before we tear down and restart; the timer is cancelled if ICE recovers.
  useEffect(() => {
    if (isHost !== "true" || connectionStatus !== "disconnected") return;
    const t = setTimeout(() => setConnectionVersion((v) => v + 1), 3000);
    return () => clearTimeout(t);
  }, [connectionStatus, isHost]);

  // ── Pointer cancel cleanup ─────────────────────────────────────────────────
  useEffect(() => {
    function onCancel() { draggingIdRef.current = null; }
    window.addEventListener("pointercancel", onCancel, { passive: true });
    return () => window.removeEventListener("pointercancel", onCancel);
  }, []);

  // ── Move execution ─────────────────────────────────────────────────────────
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

      const captured = next.find((p) => p.position === to && p.id !== pieceId);
      if (captured) captured.position = -1;

      if (enPassantCapturedId !== null) {
        const epPiece = next.find((p) => p.id === enPassantCapturedId);
        if (epPiece) epPiece.position = -1;
      }

      piece.position = to;
      piece.hasMoved = true;

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

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function handleDragStart(id: number) {
    if (connectionStatus !== "connected" || !playerSide) return;
    if (promotionPopup || checkMate || stalemate) return;
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
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
      screenCol < 0 || screenCol >= BOARD_SIZE ||
      screenRow < 0 || screenRow >= BOARD_SIZE
    ) {
      draggingIdRef.current = null;
      return;
    }

    const to = flipBoard
      ? (BOARD_SIZE - 1 - screenRow) * BOARD_SIZE + (BOARD_SIZE - 1 - screenCol)
      : screenRow * BOARD_SIZE + screenCol;

    const piece = pieces.find((p) => p.id === draggingIdRef.current);
    if (!piece) { draggingIdRef.current = null; return; }
    if (to === piece.position) { draggingIdRef.current = null; return; }

    const pieceInToTile = pieces.find((p) => p.position === to && p.position >= 0);
    const isValidMovement = checkMovementForPiece(piece, to, pieceInToTile, pieces, enPassantTarget);
    if (!isValidMovement) { draggingIdRef.current = null; return; }

    let castlingRookId: number | null = null;
    let castlingRookTo: number | null = null;

    if (piece.type === "king" && Math.abs(to - piece.position) === 2) {
      if (isInCheck(turn, pieces)) { draggingIdRef.current = null; return; }

      const isKingside = to > piece.position;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      const kingRow = rowOf(piece.position);
      const rookFromPos = kingRow * 8 + rookFromCol;
      const rookToPos = kingRow * 8 + rookToCol;

      const rook = pieces.find(
        (p) => p.position === rookFromPos && p.type === "rook" && p.side === piece.side && !p.hasMoved
      );
      if (!rook) { draggingIdRef.current = null; return; }
      castlingRookId = rook.id;
      castlingRookTo = rookToPos;

      const passThroughSquare = piece.position + (isKingside ? 1 : -1);
      if (wouldLeaveInCheck(turn, pieces, piece.id, passThroughSquare, enPassantTarget)) {
        draggingIdRef.current = null;
        return;
      }
    }

    if (castlingRookId !== null) {
      const castleBoard = computePostMoveBoard(pieces, piece.id, to, enPassantTarget, castlingRookId, castlingRookTo);
      if (isInCheck(turn, castleBoard)) { draggingIdRef.current = null; return; }
    } else if (wouldLeaveInCheck(turn, pieces, piece.id, to, enPassantTarget)) {
      draggingIdRef.current = null;
      return;
    }

    let enPassantCapturedId: number | null = null;
    if (piece.type === "pawn" && to === enPassantTarget) {
      const dir = turn === "WHITE" ? 1 : -1;
      const capturedPawnPos = to - dir * 8;
      const capturedPawn = pieces.find((p) => p.position === capturedPawnPos && p.side !== turn);
      if (capturedPawn) enPassantCapturedId = capturedPawn.id;
    }

    let newEnPassantTarget: number | null = null;
    if (piece.type === "pawn" && Math.abs(to - piece.position) === 16) {
      const dir = turn === "WHITE" ? 1 : -1;
      newEnPassantTarget = piece.position + dir * 8;
    }

    const isPromotion = piece.type === "pawn" && (to < 8 || to >= 56);
    if (isPromotion) {
      applyMove(piece.id, to, null, enPassantCapturedId, castlingRookId, castlingRookTo, turn);
      pendingPromotionRef.current = { pieceId: piece.id, to, enPassantCapturedId, castlingRookId, castlingRookTo };
      setPromotingSide(turn);
      setPromotionPopup(true);
      draggingIdRef.current = null;
      return;
    }

    const postBoard = computePostMoveBoard(pieces, piece.id, to, enPassantTarget, castlingRookId, castlingRookTo);
    const nextTurn: "WHITE" | "BLACK" = turn === "WHITE" ? "BLACK" : "WHITE";
    const mateDetected = isInCheckMate(postBoard, turn, newEnPassantTarget);
    const stalemateDetected = !mateDetected && isInStalemate(postBoard, turn, newEnPassantTarget);

    applyMove(piece.id, to, newEnPassantTarget, enPassantCapturedId, castlingRookId, castlingRookTo, nextTurn);

    if (mateDetected) setCheckMate(true);
    if (stalemateDetected) setStalemate(true);
    draggingIdRef.current = null;

    saveGameState(String(matchId), postBoard, nextTurn, newEnPassantTarget, mateDetected, stalemateDetected).catch(console.warn);

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

  // ── Promotion ──────────────────────────────────────────────────────────────
  function promotePawn(selectedPiece: DefaultChessPiece) {
    const pending = pendingPromotionRef.current;
    if (!pending) return;

    const { pieceId, to, enPassantCapturedId, castlingRookId, castlingRookTo } = pending;
    const movedSide = promotingSide;
    const nextTurn: "WHITE" | "BLACK" = movedSide === "WHITE" ? "BLACK" : "WHITE";
    const promotionColor = movedSide === "WHITE" ? { color: "white" } : { color: "black" };

    const postPromotionBoard = pieces.map((p) =>
      p.id === pieceId ? { ...p, type: selectedPiece.type, image: selectedPiece.image } : p
    );

    const mateDetected = isInCheckMate(postPromotionBoard, movedSide, null);
    const stalemateDetected = !mateDetected && isInStalemate(postPromotionBoard, movedSide, null);
    const checkDetected = isInCheck(nextTurn, postPromotionBoard);

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

    saveGameState(String(matchId), postPromotionBoard, nextTurn, null, mateDetected, stalemateDetected).catch(console.warn);

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
      piecePromoted: { promotion: selectedPiece.type, promotingSide: movedSide },
    };
    sendMove(delta, dataChannelRef);
  }

  // ── Board squares ──────────────────────────────────────────────────────────
  const squares = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
    const boardPos = flipBoard ? 63 - idx : idx;
    const displayX = idx % BOARD_SIZE;
    const displayY = Math.floor(idx / BOARD_SIZE);
    const isLight = (displayX + displayY) % 2 === 0;

    const piece = pieces.find((p) => p.position === boardPos && p.position >= 0);
    const Icon = piece?.image;

    const isDraggable =
      !!piece && playerSide !== null && connectionStatus === "connected" &&
      piece.side === playerSide && piece.side === turn &&
      !checkMate && !stalemate && !promotionPopup;

    return (
      <div
        key={idx}
        className={`${
          isLight ? "bg-[var(--color-light-square)]" : "bg-[var(--color-dark-square)]"
        } flex justify-center items-center relative`}
      >
        {colOf(boardPos) === (flipBoard ? 7 : 0) && (
          <span className="absolute top-0.5 left-1 text-[0.55rem] font-bold opacity-50 select-none pointer-events-none">
            {8 - rowOf(boardPos)}
          </span>
        )}
        {rowOf(boardPos) === (flipBoard ? 0 : 7) && (
          <span className="absolute bottom-0.5 right-1 text-[0.55rem] font-bold opacity-50 select-none pointer-events-none">
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
              onDragStart={(_, info) => { if (info.point) handleDragStart(piece.id); }}
              onDragEnd={(e, info) => {
                if (draggingIdRef.current === piece.id && info.point)
                  handleDragEnd(e as MouseEvent | TouchEvent, info);
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="cursor-grab text-5xl select-none active:cursor-grabbing will-change-transform"
              style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
            >
              <Icon style={piece.style} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  // ── Status helpers ─────────────────────────────────────────────────────────
  const gameOverMessage = checkMate
    ? `${turn} is in checkmate — ${turn === "WHITE" ? "Black" : "White"} wins!`
    : stalemate
    ? "Stalemate — it's a draw!"
    : null;

  const isMyTurn = playerSide !== null && turn === playerSide;
  const statusDot =
    connectionStatus === "connected"
      ? "bg-green-400"
      : connectionStatus === "disconnected"
      ? "bg-red-500 animate-pulse"
      : "bg-yellow-400 animate-pulse";

  const statusLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "disconnected"
      ? isHost === "true"
        ? "Opponent disconnected"
        : "Reconnecting…"
      : "Connecting…";

  const matchIdStr = String(matchId).padStart(5, "0");

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">

      {/* ── Game header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[var(--color-dark-square)]/95 backdrop-blur-md text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition shrink-0"
            aria-label="Back to home"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 ring-1 ring-white/20 text-base">♞</span>
            <span className="hidden sm:inline">NextChess</span>
          </Link>

          {/* Match ID */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5">
            <span className="text-xs text-white/60 hidden sm:inline">Match</span>
            <code className="font-mono text-sm font-semibold tracking-widest">#{matchIdStr}</code>
            <CopyButton text={matchIdStr} />
          </div>

          {/* Status + theme */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className="hidden sm:inline">{statusLabel}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Board area ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 gap-4 px-4">

        {/* Turn / status bar — only shown once connected */}
        {connectionStatus === "connected" && !checkMate && !stalemate && (
          <div className={`
            flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium shadow-sm
            border transition-all
            ${isMyTurn
              ? "border-[var(--color-dark-square)] bg-[var(--color-dark-square)]/10 text-[var(--color-dark-square)] dark:text-[#d4a96a]"
              : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }
          `}>
            <span className={`w-3.5 h-3.5 rounded-full border-2 ${
              turn === "WHITE"
                ? "bg-white border-gray-300 dark:border-gray-500"
                : "bg-gray-900 border-gray-600 dark:bg-gray-100 dark:border-gray-400"
            }`} />
            {isMyTurn ? "Your turn" : "Opponent's turn"}
            <span className="opacity-50">·</span>
            <span className="opacity-70">{turn}</span>
          </div>
        )}

        {/* Board wrapper — wood frame */}
        <div
          className="relative rounded-xl"
          style={{ padding: "8px", background: "var(--color-dark-square)", boxShadow: "0 8px 40px rgba(0,0,0,0.35)" }}
        >
          <div
            ref={boardRef}
            className="w-[min(78vw,78vh)] sm:w-[min(82vw,82vh)] aspect-square grid grid-cols-8 grid-rows-8 relative overflow-hidden rounded-sm"
            style={{ touchAction: "none", userSelect: "none" }}
            onPointerDown={(e) => e.preventDefault()}
          >
            {squares}

            {/* Waiting / connecting overlay — blocks interaction until peer is connected */}
            {connectionStatus !== "connected" && !checkMate && !stalemate && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 z-50 backdrop-blur-[2px]">
                <div className="mx-4 rounded-2xl bg-white dark:bg-[var(--card)] px-8 py-7 text-center shadow-2xl max-w-xs w-full">
                  {connectionStatus === "connecting" ? (
                    <>
                      <div className="flex justify-center mb-4">
                        <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--color-dark-square)] animate-spin" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Waiting for opponent…
                      </h2>
                      <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                        Share match&nbsp;<strong>#{matchIdStr}</strong> with your friend to start
                      </p>
                    </>
                  ) : (
                    // disconnected
                    isHost === "true" ? (
                      <>
                        <div className="text-4xl mb-3">🔌</div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          Opponent disconnected
                        </h2>
                        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                          Generating a fresh connection in a moment…
                        </p>
                        <button
                          onClick={() => setConnectionVersion((v) => v + 1)}
                          className="
                            mt-4 inline-flex h-9 items-center justify-center rounded-full px-5
                            bg-[var(--color-dark-square)] text-white text-sm font-medium
                            shadow hover:brightness-95 transition
                          "
                        >
                          Reconnect now
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">⏳</div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          Host disconnected
                        </h2>
                        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                          You'll reconnect automatically when they return.
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          Match <strong>#{matchIdStr}</strong>
                        </p>
                      </>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Game-over overlay */}
            {(checkMate || stalemate) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                <div className="mx-4 rounded-2xl bg-white dark:bg-[var(--card)] px-8 py-7 text-center shadow-2xl max-w-xs w-full">
                  <div className="text-5xl mb-3">{checkMate ? "♔" : "🤝"}</div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                    {gameOverMessage}
                  </h2>
                  <Link
                    href="/"
                    className="
                      mt-5 inline-flex h-10 items-center justify-center rounded-full px-6
                      bg-[var(--color-dark-square)] text-white text-sm font-medium
                      shadow hover:brightness-95 transition
                    "
                  >
                    Play again →
                  </Link>
                </div>
              </div>
            )}

            {/* Promotion popup */}
            {promotionPopup && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
                <div className="rounded-2xl bg-white dark:bg-[var(--card)] px-6 py-5 shadow-2xl text-center">
                  <p className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                    Choose promotion piece
                  </p>
                  <div className="flex gap-3 justify-center">
                    {defaultPieces.map((piece, index) => {
                      const Icon = piece.image;
                      const iconStyle =
                        promotingSide === "WHITE" ? { color: "white" } : { color: "black" };
                      return (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          <motion.div
                            onClick={() => promotePawn(piece)}
                            className="
                              cursor-pointer text-4xl w-14 h-14 flex items-center justify-center
                              rounded-xl border-2 border-transparent
                              hover:border-[var(--color-dark-square)] hover:bg-[var(--secondary)]
                              transition
                            "
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.15 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Icon style={iconStyle} />
                          </motion.div>
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                            {piece.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player side label — only shown once color is assigned */}
        {playerSide && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span className={`inline-block w-3 h-3 rounded-full border ${
              playerSide === "WHITE"
                ? "bg-white border-gray-300 dark:border-gray-500"
                : "bg-gray-900 border-gray-600 dark:bg-gray-200 dark:border-gray-400"
            }`} />
            Playing as <strong className="text-[var(--foreground)]">{playerSide}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
