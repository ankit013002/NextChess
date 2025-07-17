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

export const setupDataChannel = (dataChannel: RTCDataChannel, setLog) => {
  dataChannel.onmessage = (e) =>
    setLog((prevLog) => [...prevLog, `Peer: ${e.data}`]);
};
