import { IconType } from "react-icons";
import {
  TbChess,
  TbChessFilled,
  TbChessKing,
  TbChessKingFilled,
  TbChessQueen,
  TbChessQueenFilled,
  TbChessRook,
  TbChessRookFilled,
  TbChessBishop,
  TbChessBishopFilled,
  TbChessKnight,
  TbChessKnightFilled,
} from "react-icons/tb";

export interface ChessPiece {
  id: number;
  type: "rook" | "knight" | "bishop" | "queen" | "king" | "pawn";
  position: number;
  image: IconType;
  side: string;
}

export const chessPieces: ChessPiece[] = [
  {
    id: 0,
    type: "rook",
    position: 0,
    image: TbChessRookFilled,
    side: "WHITE",
  },
  {
    id: 1,
    type: "knight",
    position: 1,
    image: TbChessKnightFilled,
    side: "WHITE",
  },
  {
    id: 2,
    type: "bishop",
    position: 2,
    image: TbChessBishopFilled,
    side: "WHITE",
  },
  {
    id: 3,
    type: "queen",
    position: 3,
    image: TbChessQueenFilled,
    side: "WHITE",
  },
  {
    id: 4,
    type: "king",
    position: 4,
    image: TbChessKingFilled,
    side: "WHITE",
  },
  {
    id: 5,
    type: "bishop",
    position: 5,
    image: TbChessBishopFilled,
    side: "WHITE",
  },
  {
    id: 6,
    type: "knight",
    position: 6,
    image: TbChessKnightFilled,
    side: "WHITE",
  },
  {
    id: 7,
    type: "rook",
    position: 7,
    image: TbChessRookFilled,
    side: "WHITE",
  },

  ...Array.from({ length: 8 }, (_, i) => ({
    id: 8 + i,
    type: "pawn" as const,
    position: 8 + i,
    image: TbChessFilled,
    side: "WHITE",
  })),

  ...Array.from({ length: 8 }, (_, i) => ({
    id: 16 + i,
    type: "pawn" as const,
    position: 48 + i,
    image: TbChess,
    side: "BLACK",
  })),

  { id: 24, type: "rook", position: 56, image: TbChessRook, side: "BLACK" },
  {
    id: 25,
    type: "knight",
    position: 57,
    image: TbChessKnight,
    side: "BLACK",
  },
  {
    id: 26,
    type: "bishop",
    position: 58,
    image: TbChessBishop,
    side: "BLACK",
  },
  { id: 27, type: "queen", position: 59, image: TbChessQueen, side: "BLACK" },
  { id: 28, type: "king", position: 60, image: TbChessKing, side: "BLACK" },
  {
    id: 29,
    type: "bishop",
    position: 61,
    image: TbChessBishop,
    side: "BLACK",
  },
  {
    id: 30,
    type: "knight",
    position: 62,
    image: TbChessKnight,
    side: "BLACK",
  },
  { id: 31, type: "rook", position: 63, image: TbChessRook, side: "BLACK" },
];
