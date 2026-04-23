import {
  doc,
  collection,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db, rtcConfig } from "../ChessClient";
import { setupDataChannel } from "./SetUpDataChannel";
import { ChessPiece } from "@/utils/pieces";
import { loadGameState, MatchConnection } from "./GameStateSync";

export const joinMatch = async (
  joinMatchId: string,
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>,
  dataChannelRef: React.RefObject<RTCDataChannel | null>,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>,
  setTurn: React.Dispatch<React.SetStateAction<"WHITE" | "BLACK">>,
  setEnPassantTarget: React.Dispatch<React.SetStateAction<number | null>>,
  setCheckMate: React.Dispatch<React.SetStateAction<boolean>>,
  setStalemate: React.Dispatch<React.SetStateAction<boolean>>,
  onConnected: () => void,
  onDisconnected: () => void,
  onHostReconnect: () => void
): Promise<MatchConnection> => {
  if (!joinMatchId.trim()) {
    alert("Please enter a match ID before joining.");
    return { cleanup: () => {}, savedState: null };
  }

  const matchDocument = doc(db, "matches", joinMatchId);
  const snapshot = await getDoc(matchDocument);
  if (!snapshot.exists()) {
    alert("Room not found");
    return { cleanup: () => {}, savedState: null };
  }

  const { offer, sessionId: currentSessionId } = snapshot.data()!;
  // Per-session subcollection keeps ICE candidates isolated across reconnects.
  const sessionRef = doc(collection(matchDocument, "sessions"), currentSessionId);

  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnectionRef.current = peerConnection;

  peerConnection.oniceconnectionstatechange = () => {
    const state = peerConnection.iceConnectionState;
    console.log("ICE state →", state);
    if (state === "connected" || state === "completed") onConnected();
    if (state === "disconnected" || state === "failed" || state === "closed")
      onDisconnected();
  };

  peerConnection.ondatachannel = (e) => {
    const dc = e.channel;
    dataChannelRef.current = dc;
    setupDataChannel(
      dc,
      setPieces,
      setTurn,
      setEnPassantTarget,
      setCheckMate,
      setStalemate
    );
    dc.onopen = () => {
      console.log("🟢 DataChannel OPEN (guest)");
      onConnected();
    };
    dc.onclose = () => {
      console.log("⚪️ DataChannel CLOSED");
      onDisconnected();
    };
  };

  const calleeCollection = collection(sessionRef, "calleeCandidates");
  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      addDoc(calleeCollection, e.candidate.toJSON());
    }
  };

  // Buffer caller ICE candidates that arrive before setRemoteDescription
  // resolves — addIceCandidate silently fails in the "stable" state before
  // a remote description is applied.
  const pendingCallerCandidates: RTCIceCandidateInit[] = [];
  let remoteDescSet = false;

  const callerCollection = collection(sessionRef, "callerCandidates");
  const unsubCandidates = onSnapshot(callerCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = change.doc.data() as RTCIceCandidateInit;
        if (remoteDescSet) {
          peerConnection
            .addIceCandidate(new RTCIceCandidate(candidate))
            .catch(console.warn);
        } else {
          // Queue until setRemoteDescription + createAnswer + setLocalDescription
          // are all done.
          pendingCallerCandidates.push(candidate);
        }
      }
    });
  });

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);
  remoteDescSet = true;

  // Flush any candidates that arrived while we were setting up descriptions.
  pendingCallerCandidates.splice(0).forEach((c) =>
    peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn)
  );

  await setDoc(
    matchDocument,
    { answer: { sdp: answerDescription.sdp, type: answerDescription.type } },
    { merge: true }
  );

  // Watch the match document for a new sessionId — that means the host has
  // refreshed and generated a fresh offer. Signal the component to re-join.
  const unsubHostWatch = onSnapshot(matchDocument, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;
    if (data.sessionId && data.sessionId !== currentSessionId) {
      onHostReconnect();
    }
  });

  const savedState = await loadGameState(joinMatchId);

  const cleanup = () => {
    unsubCandidates();
    unsubHostWatch();
    peerConnection.close();
  };

  return { cleanup, savedState };
};
