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

export const createMatch = async (
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>,
  dataChannelRef: React.RefObject<RTCDataChannel | null>,
  hostMatchId: string,
  setPieces: React.Dispatch<React.SetStateAction<ChessPiece[]>>
) => {
  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnection.oniceconnectionstatechange = () => {
    console.log("ICE state →", peerConnection.iceConnectionState);
  };
  peerConnectionRef.current = peerConnection;

  const dataChannel = peerConnection.createDataChannel("chess");
  dataChannelRef.current = dataChannel;
  setupDataChannel(dataChannel, setPieces);

  dataChannel.onopen = () => {
    console.log("🟢 DataChannel OPEN (host)!");
  };
  dataChannel.onclose = () => {
    console.log("⚪️ DataChannel CLOSED");
  };

  const matchDocument = doc(collection(db, "matches"), `${hostMatchId}`);
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

  // setHostMatchId(matchDocument.id);

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
        peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });
};
