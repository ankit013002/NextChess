"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const isDark = saved
      ? saved === "dark"
      : document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <nav
      className="
        sticky top-0 z-50
        border-b border-[var(--border)]
        backdrop-blur-md
        bg-[var(--color-dark-square)]/90 dark:bg-[color:rgb(0_0_0/0.35)]
        text-white
      "
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent"
      />

      <div className="navbar max-w-7xl mx-auto px-3">
        <div className="navbar-start">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="nav-menu"
              className="btn btn-ghost btn-circle text-white/90 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>

            <div
              id="nav-menu"
              className={`
                ${
                  open
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }
                transition-all duration-150
                absolute left-0 mt-3 w-56
                rounded-xl border border-[var(--border)]
                bg-[var(--card)] text-[var(--card-foreground)]
                shadow-lg
              `}
              onMouseLeave={() => setOpen(false)}
            >
              <ul className="menu menu-sm p-2">
                <li>
                  <Link href="/" className="rounded-lg hover:bg-[var(--muted)]">
                    Homepage
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects/nextChess/NextChessBlog"
                    className="rounded-lg hover:bg-[var(--muted)]"
                  >
                    Dev Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="rounded-lg hover:bg-[var(--muted)]"
                  >
                    How it works
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="navbar-center">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-2 py-1 rounded-lg
              text-xl font-semibold tracking-tight
              hover:bg-white/5 transition
            "
            aria-label="NextChess home"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 ring-1 ring-white/20">
              ♞
            </span>
            <span>NextChess</span>
          </Link>
        </div>

        <div className="navbar-end gap-1">
          <button
            className="btn btn-ghost btn-circle text-white/90 hover:text-white"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          <button
            className="relative btn btn-ghost btn-circle text-white/90 hover:text-white"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute right-2 top-2 inline-block h-2 w-2 rounded-full bg-[var(--color-lastmove)] ring-2 ring-[var(--color-dark-square)]" />
          </button>

          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle text-white/90 hover:text-white"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {dark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21.64 13.01A9 9 0 1111 2.36 7 7 0 0021.64 13z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 4a1 1 0 011 1v1h-2v-1a1 1 0 011-1zm0-22a1 1 0 01-1-1V0h2v1a1 1 0 01-1 1zM0 13a1 1 0 011-1H1v2H1a1 1 0 01-1-1zm23 0a1 1 0 01-1 1h-1v-2h1a1 1 0 011 1zM4.22 4.22A1 1 0 015.64 2.8l.71.71-1.41 1.41-.72-.7zm13.43 13.43a1 1 0 011.41 1.41l-.71.71-1.41-1.41.71-.71zM4.22 19.78a1 1 0 01-1.41-1.41l.71-.71 1.41 1.41-.71.71zm15.56-15.56a1 1 0 01-1.41-1.41l.71-.71 1.41 1.41-.71.71z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
