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
import { createMatch } from "@/webrtc/utils/CreateMatch";
import { joinMatch } from "@/webrtc/utils/JoinMatch";
import { PiecesStateDeltaType, sendMove } from "@/webrtc/utils/SendMove";

const goodColor = "color:green; font-size:20px;";
const badColor = "color:red; font-size:20px;";

interface ChessBoardProps {
  matchId: number;
  isHost: string;
}

const ChessBoard = ({ matchId, isHost }: ChessBoardProps) => {
  const BOARD_SIZE = 8;
  const boardRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState<"WHITE" | "BLACK">("WHITE");
  const [pieces, setPieces] = useState(chessPieces);
  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);
  const draggingIdRef = useRef<number | null>(null);
  const [checkMate, setCheckMate] = useState(false);
  const [promotionPopup, setPromotionPopup] = useState(false);

  useEffect(() => {
    function onCancel() {
      if (draggingIdRef.current !== null) {
        console.log("Pointer cancelled, resetting drag state");
        draggingIdRef.current = null;
      }
    }
    function onUp() {
      if (draggingIdRef.current !== null) {
        // console.log("Pointer up detected");
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
      createMatch(
        peerConnectionRef,
        dataChannelRef,
        matchId.toString(),
        setPieces,
        setTurn
      );
    } else {
      console.log("Joining match as guest");
      joinMatch(
        matchId.toString(),
        peerConnectionRef,
        dataChannelRef,
        setPieces,
        setTurn
      );
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
    if (draggingIdRef.current == null || !boardRef.current || !dataChannelRef) {
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

    console.log("PIECE: ", piece);
    console.log("to: ", to);
    console.log("pieces: ", pieces);
    console.log("pieceInToTile: ", pieceInToTile);

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
    console.log("BEFORE PROMOTION: ", draggingIdRef.current);
    if (
      piece.type == "pawn" &&
      ((piece.position >= 0 && piece.position < 8) ||
        (piece.position >= 56 && piece.position < 64))
    ) {
      setPromotionPopup(true);
    }

    if (isInCheckMate()) {
      setCheckMate(true);
      console.log("%c CHECKMATE", badColor);
    } else {
      console.log("%c YOU'RE GOOD", goodColor);
    }

    const piecesStateDelta: PiecesStateDeltaType = {
      pieceId: piece.id,
      moveTo: to,
      turn: turn === "WHITE" ? "BLACK" : "WHITE",
      promotion: piece.type,
      check: isInCheck(turn, pieces),
      checkMate: checkMate,
    };

    sendMove(piecesStateDelta, dataChannelRef);

    // sendMove(pieces, dataChannelRef);

    if (
      !(
        piece.type == "pawn" &&
        ((piece.position >= 0 && piece.position < 8) ||
          (piece.position >= 56 && piece.position < 64))
      )
    )
      draggingIdRef.current = null;
  }

  // Need to fix issue where one promotion after another doesn't work
  function promotePawn(selectedPiece: DefaultChessPiece) {
    const pawnId = draggingIdRef.current;
    if (pawnId == null) {
      return;
    }
    setPieces((prevPieces) =>
      prevPieces.map((piece) =>
        piece.id === pawnId
          ? {
              ...piece,
              type: selectedPiece.type,
              image: selectedPiece.image,
            }
          : piece
      )
    );

    setPromotionPopup(false);
    draggingIdRef.current = null;
  }

  function isInCheckMate() {
    const enemyTurn = turn === "WHITE" ? "BLACK" : "WHITE";
    if (isInCheck(enemyTurn, pieces)) {
      console.log("HERE");
      const piecesOnSingleSide = pieces.filter(
        (piece) => piece.side === enemyTurn && piece.position !== -1
      );
      let isItCheckMate = false;
      piecesOnSingleSide.some((piece) => {
        Array.from({ length: 64 }).some((_, i: number) => {
          const pieceInToTile = pieces.find((piece) => piece.position === i);
          if (
            !isItCheckMate &&
            checkMovementForPiece(piece, i, pieceInToTile, pieces)
          ) {
            isItCheckMate = !wouldLeaveInCheck(enemyTurn, pieces, piece.id, i);
          }
          return isItCheckMate;
        });
      });
      return !isItCheckMate;
    } else {
      return false;
    }
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

    // console.log(`Starting drag for piece ${id} (${piece.type})`);
    draggingIdRef.current = id;
  }

  function dragConstraint(piece: ChessPiece) {
    const allowed = piece.side === turn;
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
        {idx}
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
                if (info.point && !checkMate) {
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
        {checkMate ? (
          <>
            <div className="absolute flex items-center justify-center left-[35%] top-[40%] w-[30%] h-[20%] bg-[var(--primary)] ">
              <div className="text-3xl">{turn} LOST!</div>
            </div>
            {squares}
          </>
        ) : (
          <>
            {promotionPopup && (
              <div className="absolute flex items-center justify-center left-[35%] top-[40%] w-[30%] h-[20%] bg-[var(--primary)] ">
                <div className="flex justify-around w-full">
                  {defaultPieces.map((piece, index) => {
                    const Icon = piece?.image;
                    return (
                      <div key={index} className="flex flex-col items-center">
                        {piece.type}
                        <motion.div
                          onClick={() => promotePawn(piece)}
                          className="text-3xl mt-3 cursor-pointer"
                          transition={{ type: "spring" }}
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 2 }}
                        >
                          <Icon style={piece.style} />
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {squares}
          </>
        )}
      </div>
      <div>
        {/* {log?.map((log, index) => (
          <div key={index}>{log}</div>
        ))} */}
        <button
          onClick={() => sendMove({ pieceId: 8, moveTo: 16 }, dataChannelRef)}
          className="btn"
        >
          Send Move
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;
