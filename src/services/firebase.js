// src/services/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase config (from console)
const firebaseConfig = {
  apiKey: "AIzaSyCKJ1gVsGue8YxJQ0ch0NzOdhIHaH_Zhxw",
  authDomain: "movingapp-695e7.firebaseapp.com",
  projectId: "movingapp-695e7",
  storageBucket: "movingapp-695e7.firebasestorage.app",
  messagingSenderId: "728681727749",
  appId: "1:728681727749:web:28a93dead14b696cc8996c",
  measurementId: "G-C75TDFYFJZ",
};

// Avoid re-init on HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export { app };