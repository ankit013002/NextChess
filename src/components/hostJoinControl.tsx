"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

const HostJoinControl = () => {
  // const hostNewGame = () => {
  //   const matchId = Math.floor(Math.random() * 99999);
  //   redirect(`/match/${matchId}`);
  // };
  const router = useRouter();
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinPressed, setJoinPressed] = useState(false);

  const hostNewGame = () => {
    const matchId = Math.floor(Math.random() * 99999);
    router.push(`/match/${matchId}?isHost=${true}`);
  };

  const joinGame = () => {
    router.push(`/match/${joinMatchId}?isHost=${false}`);
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-x-5">
        <button
          onClick={() => hostNewGame()}
          className="btn btn-primary min-w-[100px]"
        >
          Host
        </button>
        <button
          onClick={() => setJoinPressed(true)}
          className="btn btn-secondary min-w-[100px]"
        >
          Join
        </button>
      </div>
      <div>
        {joinPressed && (
          <div className="flex">
            <input
              value={joinMatchId}
              onChange={(e) => setJoinMatchId(e.target.value)}
              type="text"
              placeholder="Type here"
              className="input"
            />
            <button onClick={() => joinGame()} className="btn">
              Join
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostJoinControl;
