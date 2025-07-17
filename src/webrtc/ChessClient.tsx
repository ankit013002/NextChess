"use client";

import { useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { createMatch, setupDataChannel } from "./utils/CreateMatch";
import { joinMatch } from "./utils/JoinMatch";
import { sendMove } from "./utils/SendMove";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const rtcConfig = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

export default function ChessClient() {
  const [hostMatchId, setHostMatchId] = useState("");
  const [joinMatchId, setJoinMatchId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={() =>
          createMatch(peerConnectionRef, dataChannelRef, hostMatchId, setLog)
        }
        className="btn"
      >
        Host Game
      </button>
      <div>
        <input
          value={hostMatchId}
          onChange={(e) => setHostMatchId(e.target.value)}
          placeholder="Room ID"
          className="input"
        />
        <button
          onClick={() =>
            joinMatch(joinMatchId, peerConnectionRef, dataChannelRef, setLog)
          }
          className="btn ml-2"
        >
          Join
        </button>
      </div>
      <input
        placeholder="e.g. e2e4"
        value={joinMatchId}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMove(
              (e.target as HTMLInputElement).value,
              dataChannelRef,
              setLog
            );
            (e.target as HTMLInputElement).value = "";
          }
        }}
        onChange={(e) => setJoinMatchId(e.target.value)}
        className="input"
      />
      <ul className="list-disc ml-5">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <button className="btn">Send Move</button>
    </div>
  );
}
