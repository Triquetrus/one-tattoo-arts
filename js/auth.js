// auth.js — Firebase Authentication
import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Call this when the login button is clicked
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err) {
    return { success: false, message: friendlyError(err.code) };
  }
}

// Call this when the logout button is clicked
export async function logout() {
  await signOut(auth);
}

// Watch auth state. Calls onLogin() or onLogout() accordingly.
export function watchAuth(onLogin, onLogout) {
  onAuthStateChanged(auth, user => {
    if (user) onLogin(user);
    else onLogout();
  });
}

function friendlyError(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    default:
      return "Login failed. Please try again.";
  }
}
