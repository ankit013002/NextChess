import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/webrtc/ChessClient";
import { ChessPiece } from "@/utils/pieces";
import { GetImageFromType } from "@/utils/GetImageFromType";

export interface SerializedPiece {
  id: number;
  type: ChessPiece["type"];
  position: number;
  style: { color: string };
  side: "WHITE" | "BLACK";
  hasMoved: boolean;
}

export interface SavedGameState {
  pieces: SerializedPiece[];
  turn: "WHITE" | "BLACK";
  enPassantTarget: number | null;
  checkMate: boolean;
  stalemate: boolean;
}

/** Returned by createMatch/joinMatch — call cleanup() to tear down the session. */
export interface MatchConnection {
  cleanup: () => void;
  savedState: SavedGameState | null;
}

export function serializePieces(pieces: ChessPiece[]): SerializedPiece[] {
  return pieces.map(({ id, type, position, style, side, hasMoved }) => ({
    id,
    type,
    position,
    style: style as { color: string },
    side,
    hasMoved,
  }));
}

export function deserializePieces(serialized: SerializedPiece[]): ChessPiece[] {
  return serialized.map((p) => ({
    ...p,
    image: GetImageFromType(p.type),
  }));
}

export async function saveGameState(
  matchId: string,
  pieces: ChessPiece[],
  turn: "WHITE" | "BLACK",
  enPassantTarget: number | null,
  checkMate: boolean,
  stalemate: boolean
): Promise<void> {
  try {
    const matchDocument = doc(db, "matches", matchId);
    const gameState: SavedGameState = {
      pieces: serializePieces(pieces),
      turn,
      enPassantTarget: enPassantTarget ?? null,
      checkMate,
      stalemate,
    };
    await updateDoc(matchDocument, { gameState });
  } catch (err) {
    console.warn("Failed to save game state:", err);
  }
}

export async function loadGameState(
  matchId: string
): Promise<SavedGameState | null> {
  try {
    const matchDocument = doc(db, "matches", matchId);
    const snapshot = await getDoc(matchDocument);
    if (!snapshot.exists()) return null;
    return (snapshot.data()?.gameState as SavedGameState) ?? null;
  } catch (err) {
    console.warn("Failed to load game state:", err);
    return null;
  }
}
