import ChessBoard from "@/components/chessBoard";
import React from "react";

interface ParamsInterface {
  params: { slug: number; isHost: string };
  searchParams: { isHost?: string };
}

const page = async ({ params, searchParams }: ParamsInterface) => {
  const { slug } = await params;
  const matchId = slug;
  const { isHost } = await searchParams;
  console.log(isHost);

  return <ChessBoard matchId={matchId} isHost={isHost} />;
};

export default page;
