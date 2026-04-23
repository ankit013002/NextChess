"use client";

import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const HostJoinControl = () => {
  const router = useRouter();
  const [joinMatchId, setJoinMatchId] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  const isValid = useMemo(() => /^\d{1,6}$/.test(joinMatchId), [joinMatchId]);

  const hostNewGame = () => {
    const matchId = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(5, "0");
    router.push(`/match/${matchId}?isHost=${true}`);
  };

  const joinGame = () => {
    if (!isValid) return;
    router.push(`/match/${joinMatchId}?isHost=${false}`);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-3">
        {/* Host */}
        <button
          onClick={hostNewGame}
          aria-label="Host a new match"
          className="
            inline-flex h-12 items-center justify-center gap-2 rounded-full px-7
            bg-[var(--color-dark-square)] text-white font-semibold shadow-md
            hover:brightness-95 active:translate-y-px transition
            ring-1 ring-black/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark-square)]
          "
        >
          <span className="text-base leading-none">♜</span>
          Host
        </button>

        {/* Join toggle */}
        <button
          onClick={() => setJoinOpen((v) => !v)}
          aria-expanded={joinOpen}
          aria-controls="join-panel"
          aria-label="Join an existing match"
          className="
            inline-flex h-12 items-center justify-center gap-2 rounded-full px-7
            text-[var(--foreground)] font-semibold shadow-md transition
            border border-[var(--border)]
            bg-[color:rgb(255_255_255/0.7)] hover:bg-[color:rgb(255_255_255/0.9)]
            dark:bg-[color:rgb(0_0_0/0.25)] dark:hover:bg-[color:rgb(0_0_0/0.4)]
            backdrop-blur
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]
          "
        >
          <span className="text-base leading-none">♟</span>
          Join
        </button>
      </div>

      <AnimatePresence initial={false}>
        {joinOpen && (
          <motion.div
            id="join-panel"
            key="join-panel"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              mt-3 rounded-2xl border border-[var(--border)]
              bg-[color:rgb(255_255_255/0.7)] dark:bg-[color:rgb(0_0_0/0.3)]
              backdrop-blur p-3 shadow-md
            "
          >
            <div className="flex items-center gap-2">
              <label htmlFor="matchId" className="sr-only">Match ID</label>
              <input
                id="matchId"
                value={joinMatchId}
                onChange={(e) =>
                  setJoinMatchId(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") joinGame();
                  if (e.key === "Escape") setJoinOpen(false);
                }}
                inputMode="numeric"
                pattern="\d*"
                placeholder="Enter match ID"
                aria-invalid={!!joinMatchId && !isValid}
                className={`
                  h-11 w-full flex-1 rounded-xl px-3 font-mono tracking-wider
                  border bg-[var(--card)] text-[var(--card-foreground)]
                  placeholder:text-[var(--muted-foreground)] placeholder:font-sans placeholder:tracking-normal
                  border-[var(--border)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-square)] focus:border-transparent
                  transition
                  ${joinMatchId && !isValid ? "ring-2 ring-red-400 border-red-400" : ""}
                `}
              />
              <button
                onClick={joinGame}
                disabled={!isValid}
                className="
                  inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5
                  bg-[var(--color-dark-square)] text-white font-medium shadow-md transition
                  hover:brightness-95 active:translate-y-px
                  ring-1 ring-black/10
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark-square)]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0
                "
              >
                Join
              </button>
            </div>

            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Digits only ·{" "}
              <kbd className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1 py-px text-[10px]">Enter</kbd>{" "}
              to join ·{" "}
              <kbd className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1 py-px text-[10px]">Esc</kbd>{" "}
              to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostJoinControl;
