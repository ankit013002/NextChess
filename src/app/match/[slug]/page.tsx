import React from "react";

interface ParamsInterface {
  params: { slug: number };
}

const page = async ({ params }: ParamsInterface) => {
  const { slug } = await params;
  const matchId = slug;

  const BOARD_SIZE = 8;

  const initialPieces: Record<number, string> = {
    0: "♜",
    1: "♞",
    2: "♝",
    3: "♛",
    4: "♚",
    5: "♝",
    6: "♞",
    7: "♜",
    8: "♟",
    9: "♟",
    10: "♟",
    11: "♟",
    12: "♟",
    13: "♟",
    14: "♟",
    15: "♟",
    48: "♙",
    49: "♙",
    50: "♙",
    51: "♙",
    52: "♙",
    53: "♙",
    54: "♙",
    55: "♙",
    56: "♖",
    57: "♘",
    58: "♗",
    59: "♕",
    60: "♔",
    61: "♗",
    62: "♘",
    63: "♖",
  };

  const squares = Array.from({ length: BOARD_SIZE ** 2 }, (_, idx) => {
    const x = idx % BOARD_SIZE;
    const y = Math.floor(idx / BOARD_SIZE);
    const isLight = (x + y) % 2 === 0;
    const piece = initialPieces[idx];
    return (
      <div
        key={idx}
        className={`${
          isLight
            ? "bg-[var(--color-light-square)]"
            : "bg-[var(--color-dark-square)]"
        } flex justify-center items-center`}
      >
        <div className="cursor-pointer">{piece ?? null}</div>
      </div>
    );
  });

  console.log(matchId);
  return (
    <div className="h-full min-h-[95vh] flex justify-center items-center">
      <div className="w-[80vw] max-w-[1080px] aspect-square border-black border-2 bg-white grid grid-rows-8 grid-cols-8">
        {squares}
      </div>
    </div>
  );
};

export default page;
