import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable StrictMode: its double-invocation creates two concurrent WebRTC
  // peer connections that race to write to Firestore, causing ICE negotiation
  // to fail because one connection's offer is overwritten before the guest
  // can answer it.
  reactStrictMode: false,
};

export default nextConfig;
