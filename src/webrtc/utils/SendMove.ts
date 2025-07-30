export type PiecesStateDeltaType = {
  pieceId: number;
  moveTo: number;
  turn: "WHITE" | "BLACK";
  promotion: "rook" | "knight" | "bishop" | "queen" | "king" | "pawn";
  check: boolean;
  checkMate: boolean;
};

export const sendMove = (
  piecesDelta: PiecesStateDeltaType,
  dataChannelRef: React.RefObject<RTCDataChannel | null>
) => {
  if (dataChannelRef.current?.readyState === "open") {
    dataChannelRef.current.send(JSON.stringify(piecesDelta));
  }
};
