import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Read configuration from the injected file or environment
const firebaseConfig = {
  apiKey: "AIzaSyBez8uygg5PddCLewFjv-kLYIfn7XkR_zM",
  authDomain: "causal-citadel-l6tp2.firebaseapp.com",
  projectId: "causal-citadel-l6tp2",
  storageBucket: "causal-citadel-l6tp2.firebasestorage.app",
  messagingSenderId: "413207116114",
  appId: "1:413207116114:web:b4ab04161f4fddd035e28b",
  firestoreDatabaseId: "ai-studio-a77db7fc-ee1c-4ed4-9427-b754bb87648e"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithPopup, signOut };
