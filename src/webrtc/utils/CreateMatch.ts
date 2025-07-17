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
import { db, rtcConfig } from "../ChessClient";
import { setupDataChannel } from "./SetUpDataChannel";

export const createMatch = async (
  peerConnectionRef,
  dataChannelRef,
  hostMatchId,
  setLog
) => {
  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnection.oniceconnectionstatechange = () => {
    console.log("ICE state →", peerConnection.iceConnectionState);
  };
  peerConnectionRef.current = peerConnection;

  const dataChannel = peerConnection.createDataChannel("chess");
  dataChannelRef.current = dataChannel;
  setupDataChannel(dataChannel, setLog);

  dataChannel.onopen = () => {
    console.log("🟢 DataChannel OPEN (host)!");
    setLog((l) => [...l, "🔗 Channel is open — ready to send moves!"]);
  };
  dataChannel.onclose = () => {
    console.log("⚪️ DataChannel CLOSED");
    setLog((l) => [...l, "⚪️ Channel closed"]);
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
