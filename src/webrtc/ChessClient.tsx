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
  query,
  orderBy,
} from "firebase/firestore";

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
const db = getFirestore(app);

const rtcConfig = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

export default function ChessClient() {
  const [matchId, setMatchId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const peerConnectionRef = useRef<RTCPeerConnection>(null);
  const dataChannelRef = useRef<RTCDataChannel>(null);

  const setupDataChannel = (dataChannel: RTCDataChannel) => {
    dataChannel.onmessage = (e) =>
      setLog((prevLog) => [...prevLog, `Peer: ${e.data}`]);
  };

  const createMatch = async () => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE state →", peerConnection.iceConnectionState);
      // e.g. “checking”, “connected”, “completed”, “failed” …
    };
    peerConnectionRef.current = peerConnection;

    const dataChannel = peerConnection.createDataChannel("chess");
    dataChannelRef.current = dataChannel;
    setupDataChannel(dataChannel);

    dataChannel.onopen = () => {
      console.log("🟢 DataChannel OPEN (host)!");
      setLog((l) => [...l, "🔗 Channel is open — ready to send moves!"]);
    };
    dataChannel.onclose = () => {
      console.log("⚪️ DataChannel CLOSED");
      setLog((l) => [...l, "⚪️ Channel closed"]);
    };

    const matchDocument = doc(collection(db, "matches"));
    const callerCollection = collection(matchDocument, "callerCandidates");
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(callerCollection, e.candidate.toJSON());
      }
    };

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(matchDocument, { offer });

    setMatchId(matchDocument.id);

    onSnapshot(matchDocument, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    const calleeCollection = collection(matchDocument, "calleeCandidates");

    onSnapshot(calleeCollection, (snapshot) => {
      console.log(
        "📥 calleeCandidates snapshot:",
        snapshot.docs.map((d) => d.id)
      );
      snapshot.docChanges().forEach((change) => {
        console.log("   🔸 change:", change.type, change.doc.data());
        if (change.type === "added") {
          peerConnection.addIceCandidate(
            new RTCIceCandidate(change.doc.data())
          );
        }
      });
    });
  };

  const joinMatch = async () => {
    console.log(matchId);
    if (!matchId.trim()) {
      return alert("Please enter a match ID before joining.");
    }
    const matchDocument = doc(db, "matches", matchId);
    const snapshot = await getDoc(matchDocument);
    if (!snapshot.exists) return alert("Room not Found");

    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE state →", peerConnection.iceConnectionState);
      // e.g. “checking”, “connected”, “completed”, “failed” …
    };
    peerConnectionRef.current = peerConnection;

    peerConnection.ondatachannel = (e) => {
      const dc = e.channel;
      dataChannelRef.current = dc;
      setupDataChannel(dc);

      dc.onopen = () => {
        console.log("🟢 DataChannel OPEN (joiner)!");
        setLog((l) => [...l, "🔗 Channel is open — ready to send moves!"]);
      };
      dc.onclose = () => {
        console.log("⚪️ DataChannel CLOSED");
        setLog((l) => [...l, "⚪️ Channel closed"]);
      };
    };

    const calleeCollection = collection(matchDocument, "calleeCandidates");
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(calleeCollection, e.candidate.toJSON());
      }
    };

    const { offer } = snapshot.data()!;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      sdp: answerDescription.sdp,
      type: answerDescription.type,
    };

    await setDoc(matchDocument, { answer }, { merge: true });

    const callerCollection = collection(matchDocument, "callerCandidates");
    onSnapshot(callerCollection, (snapshot) => {
      console.log(
        "📥 callerCandidates snapshot:",
        snapshot.docs.map((d) => d.id)
      );
      snapshot.docChanges().forEach((change) => {
        console.log("   🔸 change:", change.type, change.doc.data());
        if (change.type === "added") {
          peerConnection.addIceCandidate(
            new RTCIceCandidate(change.doc.data())
          );
        }
      });
    });
  };

  const sendMove = (move: string) => {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(move);
      setLog((prevLog) => [...prevLog, `You: ${move}`]);
    }
  };

  const handleInput = (e) => {
    console.log(typeof e.target.value);
    setMatchId((prev) => {
      console.log(prev);
      return e.target.value;
    });
  };

  return (
    <div className="p-6 space-y-4">
      <button onClick={createMatch} className="btn">
        Host Game
      </button>
      <div>
        <input
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          placeholder="Room ID"
          className="input"
        />
        <button onClick={joinMatch} className="btn ml-2">
          Join
        </button>
      </div>
      <input
        placeholder="e.g. e2e4"
        // onKeyDown={(e) => {
        //   if (e.key === "Enter") {
        //     sendMove((e.target as HTMLInputElement).value);
        //     (e.target as HTMLInputElement).value = "";
        //   }
        // }}
        onChange={(e) => handleInput(e)}
        className="input"
      />
      <ul className="list-disc ml-5">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <button onClick={() => sendMove("hi")} className="btn">
        Send Move
      </button>
    </div>
  );
}
