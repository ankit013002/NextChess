import {
  doc,
  collection,
  setDoc,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db, rtcConfig } from "../ChessClient";
import { setupDataChannel } from "./SetUpDataChannel";
import { ChessPiece } from "@/utils/pieces";
import { loadGameState, MatchConnection } from "./GameStateSync";

export const createMatch = async (
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>,
  dataChannelRef: React.RefObject<RTCDataChannel | null>,
  hostMatchId: string,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>,
  setTurn: React.Dispatch<React.SetStateAction<"WHITE" | "BLACK">>,
  setEnPassantTarget: React.Dispatch<React.SetStateAction<number | null>>,
  setCheckMate: React.Dispatch<React.SetStateAction<boolean>>,
  setStalemate: React.Dispatch<React.SetStateAction<boolean>>,
  onConnected: () => void,
  onDisconnected: () => void
): Promise<MatchConnection> => {
  // New UUID each time the host loads — lets the guest detect reconnects.
  const sessionId = crypto.randomUUID();

  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnectionRef.current = peerConnection;

  peerConnection.oniceconnectionstatechange = () => {
    const state = peerConnection.iceConnectionState;
    console.log("ICE state →", state);
    if (state === "connected" || state === "completed") onConnected();
    if (state === "disconnected" || state === "failed" || state === "closed")
      onDisconnected();
  };

  const dataChannel = peerConnection.createDataChannel("chess");
  dataChannelRef.current = dataChannel;
  setupDataChannel(
    dataChannel,
    setPieces,
    setTurn,
    setEnPassantTarget,
    setCheckMate,
    setStalemate
  );

  dataChannel.onopen = () => {
    console.log("🟢 DataChannel OPEN (host)");
    onConnected();
  };
  dataChannel.onclose = () => {
    console.log("⚪️ DataChannel CLOSED");
    onDisconnected();
  };

  const matchDocument = doc(collection(db, "matches"), hostMatchId);

  // Each session gets its own ICE candidate subcollection so old candidates
  // never accumulate in a shared collection across reconnects.
  const sessionRef = doc(collection(matchDocument, "sessions"), sessionId);
  const callerCollection = collection(sessionRef, "callerCandidates");

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      addDoc(callerCollection, e.candidate.toJSON());
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // merge: true preserves gameState across reconnects.
  // answer is explicitly cleared so a stale answer from a previous session
  // can never be applied before the guest posts a fresh one.
  await setDoc(
    matchDocument,
    {
      offer: { sdp: offerDescription.sdp, type: offerDescription.type },
      sessionId,
      answer: null,
    },
    { merge: true }
  );

  const unsubAnswer = onSnapshot(matchDocument, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;
    // Only accept an answer that belongs to this session.
    if (
      data.answer &&
      data.sessionId === sessionId &&
      !peerConnection.currentRemoteDescription
    ) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(data.answer))
        .catch(console.warn);
    }
  });

  const calleeCollection = collection(sessionRef, "calleeCandidates");
  const unsubCandidates = onSnapshot(calleeCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(change.doc.data()))
          .catch(console.warn);
      }
    });
  });

  const savedState = await loadGameState(hostMatchId);

  const cleanup = () => {
    unsubAnswer();
    unsubCandidates();
    peerConnection.close();
  };

  return { cleanup, savedState };
};
