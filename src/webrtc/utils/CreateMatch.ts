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
  const callerCollection = collection(matchDocument, "callerCandidates");

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      // Tag each candidate with sessionId so stale ones from prior sessions
      // are ignored by the guest.
      addDoc(callerCollection, { ...e.candidate.toJSON(), sessionId });
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  // merge: true preserves any existing gameState field across host reconnects.
  await setDoc(
    matchDocument,
    {
      offer: { sdp: offerDescription.sdp, type: offerDescription.type },
      sessionId,
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

  const calleeCollection = collection(matchDocument, "calleeCandidates");
  const unsubCandidates = onSnapshot(calleeCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        // Ignore candidates from previous sessions.
        if (data.sessionId !== sessionId) return;
        const { sessionId: _sid, ...iceData } = data;
        peerConnection
          .addIceCandidate(new RTCIceCandidate(iceData))
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
