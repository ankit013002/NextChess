import HostJoinControl from "@/components/hostJoinControl";
import Link from "next/link";

/* ── Board preview ──────────────────────────────────────────────────────── */
function BoardPreview() {
  const squares = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const isLight = (row + col) % 2 === 0;
    return (
      <div
        key={i}
        className={
          isLight
            ? "bg-[var(--color-light-square)]"
            : "bg-[var(--color-dark-square)]"
        }
      />
    );
  });

  // A recognisable mid-game position
  const pieces = [
    // White
    { row: 7, col: 4, glyph: "♔", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    { row: 7, col: 2, glyph: "♗", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    { row: 6, col: 3, glyph: "♙", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    { row: 6, col: 5, glyph: "♙", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    { row: 5, col: 2, glyph: "♖", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    { row: 4, col: 4, glyph: "♕", color: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" },
    // Black
    { row: 0, col: 4, glyph: "♚", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
    { row: 0, col: 5, glyph: "♜", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
    { row: 1, col: 4, glyph: "♟", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
    { row: 1, col: 6, glyph: "♟", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
    { row: 3, col: 3, glyph: "♞", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
    { row: 2, col: 6, glyph: "♝", color: "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]" },
  ];

  return (
    <div className="relative w-full max-w-[480px] aspect-square">
      {/* Outer wood-style frame */}
      <div className="absolute inset-0 rounded-2xl bg-[var(--color-dark-square)] shadow-2xl" />
      <div className="absolute inset-[10px] rounded-xl overflow-hidden shadow-inner">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {squares}
        </div>
        {/* Pieces layer */}
        <div className="absolute inset-0">
          {pieces.map((p, idx) => (
            <div
              key={idx}
              className={`absolute ${p.color} select-none`}
              style={{
                left: `${p.col * 12.5}%`,
                top: `${p.row * 12.5}%`,
                width: "12.5%",
                height: "12.5%",
                display: "grid",
                placeItems: "center",
                fontSize: "clamp(20px, 3.5vw, 36px)",
              }}
              aria-hidden
            >
              {p.glyph}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-black/10" />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Page() {
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Warm accent blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #b58863 0%, transparent 70%)" }}
        />

        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">

            {/* Left: copy + CTA */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-dark-square)]/30 bg-[var(--color-dark-square)]/10 px-3 py-1 text-xs font-medium text-[var(--color-dark-square)] dark:text-[#d4a96a]">
                <span>♟</span>
                <span>Peer-to-peer · No accounts · No installs</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
                Chess with a friend,
                <br />
                <span className="text-[var(--color-dark-square)]">instantly.</span>
              </h1>

              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--muted-foreground)]">
                Generate a match code, send it to your friend, and start
                playing. Real-time moves over WebRTC—no server sees your game.
              </p>

              <div className="mt-8">
                <HostJoinControl />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                {["WebRTC P2P", "No login", "Rejoin after disconnect", "Full chess rules"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: board preview */}
            <div className="flex justify-center md:justify-end">
              <BoardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--secondary)]/40">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Why NextChess
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Instant Hosting",
                body: "One click to spin up a match ID. Share it and be playing within seconds — no setup needed.",
              },
              {
                icon: "🔒",
                title: "Direct P2P",
                body: "Moves travel directly between browsers over WebRTC. No relay server ever sees your game.",
              },
              {
                icon: "♟",
                title: "Full Chess Rules",
                body: "Castling, en passant, promotion, check, checkmate, and stalemate — all enforced correctly.",
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              >
                <div className="mb-3 text-3xl">{icon}</div>
                <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Up and playing in 3 steps
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              No accounts, no downloads, no waiting.
            </p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Host a game",
                body: "Press Host to generate a unique 6-digit match code instantly.",
                icon: "♜",
              },
              {
                step: "02",
                title: "Share the code",
                body: "Copy the code and send it to your friend via any messaging app.",
                icon: "📤",
              },
              {
                step: "03",
                title: "Play",
                body: "They enter the code, press Join, and the board appears—drag pieces to move.",
                icon: "♟",
              },
            ].map(({ step, title, body, icon }) => (
              <li
                key={step}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{icon}</span>
                  <span className="font-mono text-4xl font-bold text-[var(--border)]">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/match/12345?isHost=true"
              className="
                inline-flex h-11 items-center justify-center rounded-full px-7
                bg-[var(--color-dark-square)] text-white font-medium shadow-md
                hover:brightness-95 active:translate-y-px transition
                ring-1 ring-black/10
              "
            >
              Try a quick demo →
            </Link>
            <span className="text-sm text-[var(--muted-foreground)]">
              or start a real match above
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--muted-foreground)] md:flex-row">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-base">♞</span>
              <span>NextChess</span>
              <span className="opacity-40">·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/" className="hover:text-[var(--foreground)] transition">
                Home
              </Link>
              <Link href="#how-it-works" className="hover:text-[var(--foreground)] transition">
                How it works
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
