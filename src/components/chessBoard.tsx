"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { chessPieces } from "@/utils/pieces";
import { checkMovementForPiece } from "@/utils/checkMovementForPiece";
import { createMatch } from "@/webrtc/utils/CreateMatch";
import { joinMatch } from "@/webrtc/utils/JoinMatch";
import { sendMove } from "@/webrtc/utils/SendMove";

const ChessBoard = ({ matchId, isHost }) => {
  const BOARD_SIZE = 8;
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>();
  const [turn, setTurn] = useState<string>("WHITE");
  const [pieces, setPieces] = useState(chessPieces);

  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (isHost === "true") {
      console.log("IT IS TRUE");
      createMatch(peerConnectionRef, dataChannelRef, matchId, setLog);
    } else {
      joinMatch(matchId, peerConnectionRef, dataChannelRef, setLog);
      console.log("HEREEEE");
    }
  }, [isHost]);

  function movePiece(pieceId: number, to: number) {
    setPieces((prevState) => {
      const newState = [...prevState];
      const piece = newState.find((piece) => piece.id == draggingId);
      const existingPiece = newState.find(
        (piece) => piece.position == to && piece.id != pieceId
      );
      if (existingPiece) {
        existingPiece.position = -1;
      }
      if (piece && piece.position !== to) {
        piece.position = to;
      } else if (piece) {
        return [...prevState];
      }
      setTurn((prevTurn) => {
        if (prevTurn === "WHITE") {
          return "BLACK";
        } else {
          return "WHITE";
        }
      });
      return newState;
    });
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent, info: PanInfo) {
    if (draggingId == null || !boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const size = rect.width / BOARD_SIZE;

    const col = Math.floor((info.point.x - rect.left) / size);
    const row = Math.floor((info.point.y - rect.top) / size);

    if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE) {
      const to = row * BOARD_SIZE + col;

      const piece = pieces.find((piece) => piece.id === draggingId);
      if (!piece) return;
      const pieceInToTile = pieces.find((piece) => piece.position == to);
      const isValidMovement = checkMovementForPiece(
        piece,
        to,
        pieceInToTile,
        pieces
      );
      console.log(isValidMovement);
      if (isValidMovement) movePiece(draggingId, to);
    }
    setDraggingId(null);
  }

  function handleDragStart(dragId: number) {
    const piece = pieces.find((p) => p.id === dragId);
    if (!piece) return;
    setDraggingId(dragId);
  }

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
              drag={piece.side === turn}
              dragSnapToOrigin
              dragMomentum={false}
              onDragStart={() => handleDragStart(piece.id)}
              onDragEnd={(e, info) =>
                handleDragEnd(e as MouseEvent | TouchEvent, info)
              }
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="cursor-grab text-5xl"
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
