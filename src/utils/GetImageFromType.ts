import {
  TbChessQueenFilled,
  TbChessRookFilled,
  TbChessBishopFilled,
  TbChessFilled,
  TbChessKnightFilled,
} from "react-icons/tb";

export function GetImageFromType(type: "rook" | "knight" | "bishop" | "queen") {
  switch (type) {
    case "rook":
      return TbChessRookFilled;
    case "knight":
      return TbChessKnightFilled;
    case "bishop":
      return TbChessBishopFilled;
    case "queen":
      return TbChessQueenFilled;
    default:
      console.error("Error: none existent type");
      return TbChessFilled;
  }
}
