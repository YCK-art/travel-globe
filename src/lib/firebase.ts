import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzi9UlVNxwtXUtToIEPdXPxlAKUYbvA8s",
  authDomain: "travel-globe-dfcfc.firebaseapp.com",
  projectId: "travel-globe-dfcfc",
  storageBucket: "travel-globe-dfcfc.appspot.com",
  messagingSenderId: "1098596620865",
  appId: "1:1098596620865:web:aac6a1b4ddafd7849484c0",
  measurementId: "G-KXRDR0ZGNZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app, "gs://travel-globe-dfcfc.firebasestorage.app");

export { app, auth, provider, db, setDoc, doc, storage }; 