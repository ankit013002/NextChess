import { ChessPiece } from "@/utils/pieces";
import { PiecesStateDeltaType } from "./SendMove";
import { GetImageFromType } from "@/utils/GetImageFromType";

export const setupDataChannel = (
  dataChannel: RTCDataChannel,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>,
  setTurn: React.Dispatch<React.SetStateAction<"WHITE" | "BLACK">>,
  setEnPassantTarget: React.Dispatch<React.SetStateAction<number | null>>,
  setCheckMate: React.Dispatch<React.SetStateAction<boolean>>,
  setStalemate: React.Dispatch<React.SetStateAction<boolean>>
) => {
  dataChannel.onmessage = (e) => {
    try {
      const incoming = JSON.parse(e.data as string) as PiecesStateDeltaType;
      console.log("Received move:", incoming);

      const { pieceId, pieceMoved, piecePromoted } = incoming;

      // Atomic promotion: both fields set → apply move + promotion in one step.
      if (pieceMoved && piecePromoted) {
        const {
          moveTo,
          turn,
          checkMate,
          stalemate,
          newEnPassantTarget,
          enPassantCapturedId,
          castlingRookId,
          castlingRookTo,
        } = pieceMoved;
        const { promotion, promotingSide } = piecePromoted;
        const promotionColor = promotingSide === "WHITE" ? { color: "white" } : { color: "black" };

        setPieces((prevState) => {
          const newState = prevState.map((p) => ({ ...p }));
          const piece = newState.find((p) => p.id === pieceId);
          if (!piece) return prevState;

          const captured = newState.find((p) => p.position === moveTo && p.id !== pieceId);
          if (captured) captured.position = -1;

          if (enPassantCapturedId != null) {
            const epPiece = newState.find((p) => p.id === enPassantCapturedId);
            if (epPiece) epPiece.position = -1;
          }

          piece.position = moveTo;
          piece.hasMoved = true;
          piece.type = promotion;
          piece.image = GetImageFromType(promotion);
          piece.style = promotionColor;

          if (castlingRookId != null && castlingRookTo != null) {
            const rook = newState.find((p) => p.id === castlingRookId);
            if (rook) { rook.position = castlingRookTo; rook.hasMoved = true; }
          }

          return newState;
        });

        setTurn(turn);
        setEnPassantTarget(newEnPassantTarget ?? null);
        if (checkMate) setCheckMate(true);
        if (stalemate) setStalemate(true);
        return;
      }

      // Legacy path: standalone promotion update (no longer sent by current client,
      // but kept for backward compatibility with older peers).
      if (piecePromoted && !pieceMoved) {
        setPieces((prevState) => {
          const newState = prevState.map((p) => ({ ...p }));
          const piece = newState.find((p) => p.id === pieceId);
          if (!piece) return prevState;
          piece.type = piecePromoted.promotion;
          piece.image = GetImageFromType(piecePromoted.promotion);
          return newState;
        });
        return;
      }

      if (pieceMoved) {
        const {
          moveTo,
          turn,
          checkMate,
          stalemate,
          newEnPassantTarget,
          enPassantCapturedId,
          castlingRookId,
          castlingRookTo,
        } = pieceMoved;

        setPieces((prevState) => {
          const newState = prevState.map((p) => ({ ...p }));
          const piece = newState.find((p) => p.id === pieceId);
          if (!piece) return prevState;

          // Remove any piece on the destination square (normal capture)
          const captured = newState.find(
            (p) => p.position === moveTo && p.id !== pieceId
          );
          if (captured) captured.position = -1;

          // En passant capture: remove the pawn that was bypassed
          if (enPassantCapturedId != null) {
            const epPiece = newState.find((p) => p.id === enPassantCapturedId);
            if (epPiece) epPiece.position = -1;
          }

          piece.position = moveTo;
          piece.hasMoved = true;

          // Castling: also move the rook
          if (castlingRookId != null && castlingRookTo != null) {
            const rook = newState.find((p) => p.id === castlingRookId);
            if (rook) {
              rook.position = castlingRookTo;
              rook.hasMoved = true;
            }
          }

          return newState;
        });

        setTurn(turn);
        setEnPassantTarget(newEnPassantTarget ?? null);
        if (checkMate) setCheckMate(true);
        if (stalemate) setStalemate(true);
      }
    } catch (error) {
      console.error("Failed to parse incoming message:", error);
    }
  };
};
