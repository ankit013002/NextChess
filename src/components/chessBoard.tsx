"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChessPiece, chessPieces } from "@/utils/pieces";
import { checkMovementForPiece } from "@/utils/checkMovementForPiece";
import { createMatch } from "@/webrtc/utils/CreateMatch";
import { joinMatch } from "@/webrtc/utils/JoinMatch";
import { sendMove } from "@/webrtc/utils/SendMove";

const ChessBoard = ({ matchId, isHost }) => {
  const BOARD_SIZE = 8;
  const boardRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState<"WHITE" | "BLACK">("WHITE");
  const [pieces, setPieces] = useState(chessPieces);
  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);
  const [log, setLog] = useState<string[]>([]);
  const draggingIdRef = useRef<number | null>(null);

  useEffect(() => {
    function onCancel() {
      if (draggingIdRef.current !== null) {
        console.log("Pointer cancelled, resetting drag state");
        draggingIdRef.current = null;
      }
    }
    function onUp() {
      if (draggingIdRef.current !== null) {
        console.log("Pointer up detected");
      }
    }

    window.addEventListener("pointercancel", onCancel, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useEffect(() => {
    if (isHost === "true") {
      console.log("Creating match as host");
      createMatch(peerConnectionRef, dataChannelRef, matchId, setLog);
    } else {
      console.log("Joining match as guest");
      joinMatch(matchId, peerConnectionRef, dataChannelRef, setLog);
    }
  }, [isHost, matchId]);

  function movePiece(pieceId: number, to: number) {
    setPieces((prev) => {
      const next = [...prev];
      const piece = next.find((p) => p.id === pieceId);
      if (!piece) return prev;

      const capture = next.find((p) => p.position === to && p.id !== pieceId);
      if (capture) capture.position = -1;

      if (piece.position === to) return prev;
      piece.position = to;

      const nextTurn = turn === "WHITE" ? "BLACK" : "WHITE";
      setTurn(nextTurn);

      return next;
    });
  }

  function isInCheck(side: "WHITE" | "BLACK", board: ChessPiece[]): boolean {
    const king = board.find((p) => p.type === "king" && p.side === side);
    if (!king) return false;
    return board.some(
      (p) =>
        p.side !== side &&
        p.position >= 0 &&
        checkMovementForPiece(p, king.position, king, board)
    );
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent, info: PanInfo) {
    if (draggingIdRef.current == null || !boardRef.current) {
      console.warn("Drag end called but missing required refs");
      draggingIdRef.current = null;
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const size = rect.width / BOARD_SIZE;

    const col = Math.floor((info.point.x - rect.left) / size);
    const row = Math.floor((info.point.y - rect.top) / size);

    if (!(col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE)) {
      console.log("Drag ended outside board bounds");
      draggingIdRef.current = null;
      return;
    }

    const to = row * BOARD_SIZE + col;
    const piece = pieces.find((piece) => piece.id === draggingIdRef.current);

    if (!piece) {
      console.warn("Could not find dragged piece");
      draggingIdRef.current = null;
      return;
    }

    if (to === piece.position) {
      console.log("Piece dropped on same square");
      draggingIdRef.current = null;
      return;
    }

    const pieceInToTile = pieces.find((piece) => piece.position === to);
    const isValidMovement = checkMovementForPiece(
      piece,
      to,
      pieceInToTile,
      pieces
    );

    if (!isValidMovement) {
      console.log("Invalid movement according to piece rules");
      draggingIdRef.current = null;
      return;
    }

    const side = turn;
    const stillInCheck = wouldLeaveInCheck(
      side,
      pieces,
      draggingIdRef.current,
      to
    );

    if (stillInCheck) {
      console.log("Move would leave king in check");
      draggingIdRef.current = null;
      return;
    }

    console.log("Executing valid move");
    movePiece(draggingIdRef.current, to);
    draggingIdRef.current = null;
  }

  function wouldLeaveInCheck(
    currentSide: "WHITE" | "BLACK",
    board: ChessPiece[],
    movingId: number,
    to: number
  ): boolean {
    const sim = board.map((p) => ({ ...p }));
    const mover = sim.find((p) => p.id === movingId);
    if (!mover) return true; // fail safe: block
    const victim = sim.find((p) => p.position === to && p.id !== movingId);
    if (victim) victim.position = -1;
    mover.position = to;
    return isInCheck(currentSide, sim);
  }

  function handleDragStart(id: number) {
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
    if (piece.side !== turn) return;

    console.log(`Starting drag for piece ${id} (${piece.type})`);
    draggingIdRef.current = id;
  }

  function dragConstraint(piece: ChessPiece) {
    const allowed = piece.side === turn;
    console.log(
      `Drag constraint for piece ${piece.id}: ${allowed} (side: ${piece.side}, turn: ${turn})`
    );
    return allowed;
  }

  useEffect(() => {
    return () => {
      draggingIdRef.current = null;
    };
  }, []);

  const squares = Array.from({ length: BOARD_SIZE ** 2 }, (_, idx) => {
    const x = idx % BOARD_SIZE;
    const y = Math.floor(idx / BOARD_SIZE);
    const isLight = (x + y) % 2 === 0;
    const piece = pieces.find((p) => p.position === idx);
    const Icon = piece?.image;

    return (
      <div
        key={idx}
        className={`${
          isLight
            ? "bg-[var(--color-light-square)]"
            : "bg-[var(--color-dark-square)]"
        } flex justify-center items-center`}
      >
        <AnimatePresence>
          {Icon && piece && (
            <motion.div
              layout
              key={piece.id}
              drag={dragConstraint(piece)}
              dragSnapToOrigin
              dragMomentum={false}
              dragElastic={0.1}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
              whileDrag={{ scale: 1.5, zIndex: 1000 }}
              onDragStart={(_, info) => {
                if (info.point) {
                  handleDragStart(piece.id);
                }
              }}
              onDragEnd={(e, info) => {
                if (draggingIdRef.current === piece.id && info.point) {
                  handleDragEnd(e as MouseEvent | TouchEvent, info);
                }
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="cursor-grab text-5xl select-none active:cursor-grabbing will-change-transform backface-hidden"
              style={{
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
            >
              <Icon style={piece.style} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  return (
    <div className="h-full min-h-[95vh] flex flex-col items-center">
      <div
        ref={boardRef}
        className="w-[80vw] max-w-[1080px] aspect-square border-2 border-black bg-white grid grid-cols-8 grid-rows-8"
        style={{
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
        }}
      >
        {squares}
      </div>
      <div>
        {log?.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
        <button
          onClick={() => sendMove("MY MESSAGE", dataChannelRef, setLog)}
          className="btn"
        >
          Send Move
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;
