import { ChessPiece } from "@/utils/pieces";
import { PiecesStateDeltaType } from "./SendMove";

export const setupDataChannel = (
  dataChannel: RTCDataChannel,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>
) => {
  dataChannel.onmessage = (e) => {
    try {
      const incoming = JSON.parse(e.data as string) as PiecesStateDeltaType;
      console.log("REVIEVED PIECES: ", incoming);
      setPieces((prevState) => {
        const newState = [...prevState];
        const pieceOfInterest = newState.find(
          (piece) => piece.id === incoming.pieceId
        );
        if (!pieceOfInterest) {
          return prevState;
        }
        pieceOfInterest.position = incoming.moveTo;
        return newState;
      });
    } catch (error) {
      console.error("Failed to aprse incoming message: ", error);
    }
  };
};
