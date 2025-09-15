import HostJoinControl from "@/components/hostJoinControl";
import Link from "next/link";

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

  const pieces = [
    { row: 1, col: 4, glyph: "♔", color: "text-white/95" },
    { row: 6, col: 4, glyph: "♚", color: "text-black/90" },
    { row: 0, col: 1, glyph: "♘", color: "text-white/95" },
    { row: 7, col: 6, glyph: "♞", color: "text-black/90" },
  ];

  return (
    <div className="relative w-full max-w-[520px] aspect-square rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10">
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
              fontSize: "clamp(22px, 4vw, 38px)",
            }}
            aria-hidden
          >
            {p.glyph}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-black/10" />
    </div>
  );
}

export default function Page() {
  return (
    <main className="bg-[var(--color-light-square)]">
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-dark-square)]/90 px-3 py-1 text-xs font-medium text-white shadow">
                <span>♟️ NextChess</span>
                <span className="opacity-80">
                  Peer-to-peer, in your browser
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--foreground)] md:text-5xl">
                Play chess instantly with a shareable code.
              </h1>
              <p className="mt-3 max-w-prose text-[var(--muted-foreground)]">
                Host a game, share the match ID, and you’re in—no installs, no
                accounts. Built on WebRTC with a smooth, drag-to-move board.
              </p>

              <div className="mt-6">
                <HostJoinControl />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="badge badge-ghost p-1">WebRTC</span>
                <span className="badge bg-white text-black p-1">No login</span>
                <span className="badge badge-ghost p-1">
                  Fast & lightweight
                </span>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <BoardPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--secondary)]/60">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card bg-[var(--card)] text-[var(--card-foreground)] shadow">
              <div className="card-body">
                <div className="text-2xl">⚡</div>
                <h3 className="card-title">Instant Hosting</h3>
                <p>
                  Click <em>Host</em> to spin up a match ID. Share it and start
                  playing in seconds.
                </p>
              </div>
            </div>
            <div className="card bg-[var(--card)] text-[var(--card-foreground)] shadow">
              <div className="card-body">
                <div className="text-2xl">🔒</div>
                <h3 className="card-title">Direct P2P</h3>
                <p>
                  Real-time moves over WebRTC for a snappy, synchronized board
                  on both ends.
                </p>
              </div>
            </div>
            <div className="card bg-[var(--card)] text-[var(--card-foreground)] shadow">
              <div className="card-body">
                <div className="text-2xl">🎯</div>
                <h3 className="card-title">Clean UI</h3>
                <p>
                  Drag pieces, clean highlights, and clear turn logic—no
                  clutter, just chess.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="text-sm font-medium text-[var(--muted-foreground)]">
                Step 1
              </div>
              <div className="mt-1 text-lg text-[var(--color-dark-square)] font-semibold">
                Host a Game
              </div>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Press{" "}
                <span className="badge p-1 bg-[var(--color-dark-square)]">
                  Host
                </span>{" "}
                to create a match ID.
              </p>
            </li>
            <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="text-sm font-medium text-[var(--muted-foreground)]">
                Step 2
              </div>
              <div className="mt-1 text-lg text-[var(--color-dark-square)] font-semibold">
                Share the ID
              </div>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Send the code to your friend.
              </p>
            </li>
            <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="text-sm font-medium text-[var(--muted-foreground)]">
                Step 3
              </div>
              <div className="mt-1 text-lg text-[var(--color-dark-square)] font-semibold">
                Join & Play
              </div>
              <p className="mt-2 text-[var(--muted-foreground)]">
                They press{" "}
                <span className="badge p-1 bg-[var(--color-light-square)]">
                  Join
                </span>
                , enter the code, and you’re both on the board.
              </p>
            </li>
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <Link
              href="/match/12345?isHost=true"
              className="btn bg-[var(--color-dark-square)] border-none hover:brightness-95"
            >
              Try a quick demo
            </Link>
            <span className="opacity-70">
              or start a real match from the hero above
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-[var(--muted-foreground)]">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p>© {new Date().getFullYear()} NextChess</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="link-hover link">
                Home
              </Link>
              <Link
                href="/projects/nextChess/NextChessBlog"
                className="link-hover link"
              >
                Dev Blog
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
