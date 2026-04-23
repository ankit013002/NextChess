import {
  TbChessQueenFilled,
  TbChessRookFilled,
  TbChessBishopFilled,
  TbChessFilled,
  TbChessKnightFilled,
  TbChessKingFilled,
} from "react-icons/tb";
import { ChessPiece } from "./pieces";

export function GetImageFromType(type: ChessPiece["type"]) {
  switch (type) {
    case "rook":
      return TbChessRookFilled;
    case "knight":
      return TbChessKnightFilled;
    case "bishop":
      return TbChessBishopFilled;
    case "queen":
      return TbChessQueenFilled;
    case "king":
      return TbChessKingFilled;
    case "pawn":
      return TbChessFilled;
    default:
      console.error("Error: unknown piece type", type);
      return TbChessFilled;
  }
}
