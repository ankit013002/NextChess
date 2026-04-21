import ChessBoard from "@/components/chessBoard";
import React from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ isHost?: string }>;
}

const page = async ({ params, searchParams }: PageProps) => {
  const { slug } = await params;
  const { isHost } = await searchParams;

  return <ChessBoard matchId={Number(slug)} isHost={isHost ?? "false"} />;
};

export default page;
