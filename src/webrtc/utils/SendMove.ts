export type PiecesStateDeltaType = {
  pieceId: number;
  moveTo: number;
};

export const sendMove = (
  piecesDelta: PiecesStateDeltaType,
  dataChannelRef: React.RefObject<RTCDataChannel | null>
) => {
  if (dataChannelRef.current?.readyState === "open") {
    dataChannelRef.current.send(JSON.stringify(piecesDelta));
  }
};
