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

export const joinMatch = async (
  joinMatchId: string,
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>,
  dataChannelRef: React.RefObject<RTCDataChannel | null>,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>,
  setTurn: React.Dispatch<React.SetStateAction<"WHITE" | "BLACK">>
) => {
  console.log(joinMatchId);

  if (!joinMatchId.trim()) {
    return alert("Please enter a match ID before joining.");
  }
  const matchDocument = doc(db, "matches", joinMatchId);
  const snapshot = await getDoc(matchDocument);
  if (!snapshot.exists) return alert("Room not Found");

  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnection.oniceconnectionstatechange = () => {
    console.log("ICE state →", peerConnection.iceConnectionState);
  };
  peerConnectionRef.current = peerConnection;

  peerConnection.ondatachannel = (e) => {
    const dc = e.channel;
    dataChannelRef.current = dc;
    setupDataChannel(dc, setPieces, setTurn);

    dc.onopen = () => {
      console.log("🟢 DataChannel OPEN (joiner)!");
    };
    dc.onclose = () => {
      console.log("⚪️ DataChannel CLOSED");
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
        peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });
};
