import { ChessPiece } from "./pieces";

export function checkMovementForPiece(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  let validMovement = false;
  switch (piece.type) {
    case "pawn":
      validMovement = checkPawnMovement(piece, to, pieceInToTile);
      break;
    case "rook":
      validMovement = checkRookMovement(piece, to, pieceInToTile);
      break;
    case "knight":
      validMovement = checkKnightMovement(piece, to, pieceInToTile);
      break;
    case "bishop":
      validMovement = checkBishopMovement(piece, to, pieceInToTile);
      break;
    case "queen":
      validMovement = checkQueenMovement(piece, to, pieceInToTile);
      break;
    case "king":
      validMovement = checkKingMovement(piece, to, pieceInToTile);
      break;
    default:
      break;
  }
  return validMovement;
}

function checkPawnMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  if (piece.side == "WHITE") {
    console.log("Here");
    if (
      (piece.position + 7 === to || piece.position + 9 === to) &&
      pieceInToTile
    ) {
      console.log("taking");

      return true;
    } else if (piece.position + 8 === to) {
      console.log("moving");

      return true;
    } else {
      return false;
    }
  } else {
    if (
      (piece.position - 7 === to || piece.position - 9 === to) &&
      pieceInToTile
    ) {
      return true;
    } else if (piece.position - 8 === to) {
      return true;
    } else {
      return false;
    }
  }
}

function checkRookMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  return false;
}

function checkKnightMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  return false;
}

function checkBishopMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  return false;
}

function checkQueenMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  return false;
}

function checkKingMovement(
  piece: ChessPiece,
  to: number,
  pieceInToTile?: ChessPiece
) {
  return false;
}
