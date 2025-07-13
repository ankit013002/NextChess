import React from "react";

interface ParamsInterface {
  params: {
    matchId: number;
  };
}

const page = async ({ params }: ParamsInterface) => {
  const { slug } = await params;
  const matchId = slug;
  console.log(matchId);
  return <div className="h-full min-h-[95vh] bg-red-500">{matchId}</div>;
};

export default page;
