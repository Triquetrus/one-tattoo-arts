// firebase.js — Initialize Firebase app (CDN compat version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7I36ZuuTRur8Z1mM8y7KpWJbzYmFkDvA",
  authDomain: "one-tattoo-arts.firebaseapp.com",
  projectId: "one-tattoo-arts",
  storageBucket: "one-tattoo-arts.firebasestorage.app",
  messagingSenderId: "7992302328",
  appId: "1:7992302328:web:d698bd69984c6a7dd2390d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
