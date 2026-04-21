export type PiecesStateDeltaType = {
  pieceId: number;
  pieceMoved: {
    moveTo: number;
    turn: "WHITE" | "BLACK";
    check: boolean;
    checkMate: boolean;
    stalemate: boolean;
    newEnPassantTarget: number | null;
    enPassantCapturedId: number | null;
    castlingRookId: number | null;
    castlingRookTo: number | null;
  } | null;
  piecePromoted: {
    promotion: "rook" | "knight" | "bishop" | "queen";
    promotingSide: "WHITE" | "BLACK";
  } | null;
};

export const sendMove = (
  piecesDelta: PiecesStateDeltaType,
  dataChannelRef: React.RefObject<RTCDataChannel | null>
) => {
  if (dataChannelRef.current?.readyState === "open") {
    dataChannelRef.current.send(JSON.stringify(piecesDelta));
  }
};
