import { IconType } from "react-icons";
import {
  TbChessFilled,
  TbChessKingFilled,
  TbChessQueenFilled,
  TbChessRookFilled,
  TbChessBishopFilled,
  TbChessKnightFilled,
} from "react-icons/tb";

export interface ChessPiece {
  id: number;
  type: "rook" | "knight" | "bishop" | "queen" | "king" | "pawn";
  position: number;
  style: object;
  image: IconType;
  side: "WHITE" | "BLACK";
  hasMoved: boolean;
}

export interface DefaultChessPiece {
  type: "rook" | "knight" | "bishop" | "queen";
  style: {
    color: string;
  };
  image: IconType;
}

export const chessPieces: ChessPiece[] = [
  {
    id: 0,
    type: "rook",
    position: 0,
    style: { color: "white" },
    image: TbChessRookFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 1,
    type: "knight",
    position: 1,
    style: { color: "white" },
    image: TbChessKnightFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 2,
    type: "bishop",
    position: 2,
    style: { color: "white" },
    image: TbChessBishopFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 3,
    type: "queen",
    position: 3,
    style: { color: "white" },
    image: TbChessQueenFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 4,
    type: "king",
    position: 4,
    style: { color: "white" },
    image: TbChessKingFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 5,
    type: "bishop",
    position: 5,
    style: { color: "white" },
    image: TbChessBishopFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 6,
    type: "knight",
    position: 6,
    style: { color: "white" },
    image: TbChessKnightFilled,
    side: "WHITE",
    hasMoved: false,
  },
  {
    id: 7,
    type: "rook",
    position: 7,
    style: { color: "white" },
    image: TbChessRookFilled,
    side: "WHITE",
    hasMoved: false,
  },

  ...Array.from({ length: 8 }, (_, i) => ({
    id: 8 + i,
    type: "pawn" as const,
    position: 8 + i,
    style: { color: "white" },
    image: TbChessFilled,
    side: "WHITE" as const,
    hasMoved: false,
  })),

  ...Array.from({ length: 8 }, (_, i) => ({
    id: 16 + i,
    type: "pawn" as const,
    position: 48 + i,
    style: { color: "black" },
    image: TbChessFilled,
    side: "BLACK" as const,
    hasMoved: false,
  })),

  {
    id: 24,
    type: "rook",
    position: 56,
    style: { color: "black" },
    image: TbChessRookFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 25,
    type: "knight",
    position: 57,
    style: { color: "black" },
    image: TbChessKnightFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 26,
    type: "bishop",
    position: 58,
    style: { color: "black" },
    image: TbChessBishopFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 27,
    type: "queen",
    position: 59,
    style: { color: "black" },
    image: TbChessQueenFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 28,
    type: "king",
    position: 60,
    style: { color: "black" },
    image: TbChessKingFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 29,
    type: "bishop",
    position: 61,
    style: { color: "black" },
    image: TbChessBishopFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 30,
    type: "knight",
    position: 62,
    style: { color: "black" },
    image: TbChessKnightFilled,
    side: "BLACK",
    hasMoved: false,
  },
  {
    id: 31,
    type: "rook",
    position: 63,
    style: { color: "black" },
    image: TbChessRookFilled,
    side: "BLACK",
    hasMoved: false,
  },
];

export const defaultPieces: DefaultChessPiece[] = [
  {
    type: "rook",
    style: { color: "var(--color-light-square)" },
    image: TbChessRookFilled,
  },
  {
    type: "knight",
    style: { color: "var(--color-light-square)" },
    image: TbChessKnightFilled,
  },
  {
    type: "bishop",
    style: { color: "var(--color-light-square)" },
    image: TbChessBishopFilled,
  },
  {
    type: "queen",
    style: { color: "var(--color-light-square)" },
    image: TbChessQueenFilled,
  },
];
