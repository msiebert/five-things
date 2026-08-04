// Wires every "+ Add to my collection" button (see _includes/fact-card.html)
// to write that fact's ID into the signed-in user's Firestore doc. See
// docs/firestore-schema.md for the document shape this writes to.
import { auth, db } from "./auth.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  setDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();
const RESET_DELAY_MS = 2500;

let currentUser = null;
auth.onAuthStateChanged(function (user) {
  currentUser = user;
});

async function addToCollection(button) {
  const factId = button.dataset.factId;
  const originalText = button.textContent;

  button.disabled = true;
  button.classList.remove("is-error");
  button.classList.add("is-saving");
  button.textContent = "Adding…";

  try {
    let user = currentUser;
    if (!user) {
      const result = await signInWithPopup(auth, provider);
      user = result.user;
    }

    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      { collected: arrayUnion({ id: factId, at: new Date().toISOString() }) },
      { merge: true }
    );

    button.classList.remove("is-saving");
    button.classList.add("is-added");
    button.textContent = "Added ✓";
  } catch (error) {
    console.error("Could not add fact to collection", error);
    button.classList.remove("is-saving");
    button.classList.add("is-error");
    button.textContent = "Couldn't add — try again";
    button.disabled = false;
    setTimeout(function () {
      button.classList.remove("is-error");
      button.textContent = originalText;
    }, RESET_DELAY_MS);
  }
}

document.addEventListener("click", function (event) {
  const button = event.target.closest(".add-to-collection");
  if (!button) return;
  addToCollection(button);
});
