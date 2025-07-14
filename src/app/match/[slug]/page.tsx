import ChessBoard from "@/components/chessBoard";
import React from "react";

interface ParamsInterface {
  params: { slug: number };
}

const page = async ({ params }: ParamsInterface) => {
  const { slug } = await params;
  const matchId = slug;

  return <ChessBoard />;
};

export default page;
