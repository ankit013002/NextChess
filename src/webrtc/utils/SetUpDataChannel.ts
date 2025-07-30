import { ChessPiece } from "@/utils/pieces";
import { PiecesStateDeltaType } from "./SendMove";

export const setupDataChannel = (
  dataChannel: RTCDataChannel,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>,
  setTurn: React.Dispatch<React.SetStateAction<"WHITE" | "BLACK">>
) => {
  dataChannel.onmessage = (e) => {
    try {
      const incoming = JSON.parse(e.data as string) as PiecesStateDeltaType;
      console.log("REVIEVED PIECES: ", incoming);
      setPieces((prevState) => {
        console.log("INCOMING: ", incoming);
        const newState = [...prevState];

        const eliminatedPiece = newState.find(
          (piece) => piece.position == incoming.moveTo
        );

        if (eliminatedPiece) {
          eliminatedPiece.position = -1;
        }

        setTurn(incoming.turn);

        const pieceOfInterest = newState.find(
          (piece) => piece.id === incoming.pieceId
        );
        if (!pieceOfInterest) {
          return prevState;
        }

        pieceOfInterest.position = incoming.moveTo;

        if (pieceOfInterest.type !== incoming.promotion) {
          pieceOfInterest.type = incoming.promotion;
        }

        return newState;
      });
    } catch (error) {
      console.error("Failed to aprse incoming message: ", error);
    }
  };
};
