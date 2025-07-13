"use client";

import { redirect } from "next/navigation";
import React, { useState } from "react";

const HostJoinControl = () => {
  const hostNewGame = () => {
    const matchId = Math.floor(Math.random() * 99999);
    redirect(`/match/${matchId}`);
  };

  const [joinPressed, setJoinPressed] = useState(false);

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
          <input type="text" placeholder="Type here" className="input" />
        )}
      </div>
    </div>
  );
};

export default HostJoinControl;
