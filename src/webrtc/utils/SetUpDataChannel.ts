import { ChessPiece } from "@/utils/pieces";
import { PiecesStateDeltaType } from "./SendMove";
import { GetImageFromType } from "@/utils/GetImageFromType";

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
        console.log("Incoming: ", incoming);
        const newState = [...prevState];

        const { pieceId, pieceMoved, piecePromoted } = incoming;

        const pieceOfInterest = newState.find((piece) => piece.id === pieceId);

        if (!pieceOfInterest) {
          return prevState;
        }

        console.log("Before Promotion");

        if (piecePromoted) {
          pieceOfInterest.type = piecePromoted.promotion;
          pieceOfInterest.image = GetImageFromType(piecePromoted.promotion);
          return newState;
        }

        console.log("Past Promotion");

        if (pieceMoved) {
          const eliminatedPiece = newState.find(
            (piece) => piece.position == pieceMoved.moveTo
          );

          if (eliminatedPiece != undefined) {
            eliminatedPiece.position = -1;
          }

          pieceOfInterest.position = pieceMoved.moveTo;

          setTurn(pieceMoved.turn);
        }

        return newState;
      });
    } catch (error) {
      console.error("Failed to aprse incoming message: ", error);
    }
  };
};
