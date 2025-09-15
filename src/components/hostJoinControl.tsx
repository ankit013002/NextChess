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
        <button
          onClick={hostNewGame}
          aria-label="Host a new match"
          className="
            inline-flex h-11 items-center justify-center rounded-full px-6
            text-white shadow-md transition
            bg-[var(--color-dark-square)]
            hover:brightness-95 active:translate-y-[1px]
            ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
          "
        >
          Host
        </button>

        <button
          onClick={() => setJoinOpen((v) => !v)}
          aria-expanded={joinOpen}
          aria-controls="join-panel"
          aria-label="Join an existing match"
          className="
            inline-flex h-11 items-center justify-center rounded-full px-6
            text-[var(--foreground)] shadow-md transition
            border border-[var(--border)]
            bg-[color:rgb(255_255_255/0.7)] hover:bg-[color:rgb(255_255_255/0.85)]
            dark:bg-[color:rgb(0_0_0/0.35)] dark:hover:bg-[color:rgb(0_0_0/0.45)]
            backdrop-blur
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
          "
        >
          Join
        </button>
      </div>

      <AnimatePresence initial={false}>
        {joinOpen && (
          <motion.div
            id="join-panel"
            key="join-panel"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="
              mt-3 rounded-xl border border-[var(--border)]
              bg-[color:rgb(255_255_255/0.6)] dark:bg-[color:rgb(0_0_0/0.35)]
              backdrop-blur p-2 sm:p-3 shadow
            "
          >
            <div className="flex items-center gap-2">
              <label htmlFor="matchId" className="sr-only">
                Match ID
              </label>
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
                  h-11 w-full flex-1 rounded-xl px-3
                  border bg-[var(--card)] text-[var(--card-foreground)]
                  placeholder:text-[var(--muted-foreground)]
                  border-[var(--border)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                  ${
                    joinMatchId && !isValid
                      ? "ring-2 ring-[var(--error)] border-[var(--error)]"
                      : ""
                  }
                `}
              />
              <button
                onClick={joinGame}
                disabled={!isValid}
                className="
                  inline-flex h-11 items-center justify-center rounded-full px-5
                  text-white shadow-md transition
                  bg-[var(--color-dark-square)]
                  hover:brightness-95 active:translate-y-[1px]
                  ring-1 ring-black/10
                  focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Join
              </button>
            </div>

            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              Tip: digits only • Press <kbd className="kbd kbd-xs">Enter</kbd>{" "}
              to join, <kbd className="kbd kbd-xs">Esc</kbd> to close.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostJoinControl;
