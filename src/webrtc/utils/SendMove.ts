import { IconType } from "react-icons";

export type PiecesStateDeltaType = {
  pieceId: number;
  pieceMoved: {
    moveTo: number;
    turn: "WHITE" | "BLACK";
    check: boolean;
    checkMate: boolean;
  } | null;
  piecePromoted: {
    promotion: "rook" | "knight" | "bishop" | "queen";
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
