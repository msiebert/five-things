import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Creates the per-user Firestore document on first sign-in. Population of
// collected/recentlyMissed/recentlyAdded happens elsewhere (the collection
// button and the Take-25 quiz) — this only guarantees the doc exists with
// the right shape before those write to it.
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { collected: [], recentlyMissed: [], recentlyAdded: [] });
  }
}

function wireControls() {
  const container = document.querySelector("[data-auth-controls]");
  if (!container) return;

  const signInButton = container.querySelector("[data-auth-sign-in]");
  const signOutButton = container.querySelector("[data-auth-sign-out]");
  const userLabel = container.querySelector("[data-auth-user]");

  if (signInButton) {
    signInButton.addEventListener("click", function () {
      signInWithPopup(auth, provider).catch(function (error) {
        console.error("Sign-in failed", error);
      });
    });
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", function () {
      signOut(auth).catch(function (error) {
        console.error("Sign-out failed", error);
      });
    });
  }

  onAuthStateChanged(auth, function (user) {
    container.classList.toggle("is-signed-in", !!user);
    container.classList.toggle("is-signed-out", !user);

    if (user) {
      if (userLabel) userLabel.textContent = user.displayName || user.email || "Signed in";
      ensureUserDoc(user).catch(function (error) {
        console.error("Could not create/verify user document", error);
      });
    } else if (userLabel) {
      userLabel.textContent = "";
    }
  });
}

document.addEventListener("DOMContentLoaded", wireControls);

export { app, auth, db };
