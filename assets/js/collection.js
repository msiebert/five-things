// Wires every "+ Add to my collection" button (see _includes/fact-card.html)
// to write that fact's ID into the signed-in user's Firestore doc. See
// docs/firestore-schema.md for the document shape this writes to.
//
// The "Added" state is also restored on page load so it survives across
// visits, without re-fetching the whole Firestore doc every time: the set
// of collected IDs is cached in localStorage for the current calendar day
// (UTC, matching the `at` timestamps already stored server-side) and kept
// current as facts are added during that day. The cache is refetched once
// a new day starts.
import { auth, db } from "./auth.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();
const RESET_DELAY_MS = 2500;
const CACHE_KEY = "five-things:collected";

let currentUser = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch (error) {
    return null;
  }
}

function writeCache(uid, ids) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ uid: uid, date: todayKey(), ids: Array.from(ids) })
  );
}

function dispatchCollectionCount(count) {
  window.dispatchEvent(
    new CustomEvent("five-things:collection-count", { detail: { count } })
  );
}

function markButtonsAsAdded(ids) {
  document.querySelectorAll(".add-to-collection").forEach(function (button) {
    if (!ids.has(button.dataset.factId)) return;
    button.disabled = true;
    button.classList.remove("is-saving", "is-error");
    button.classList.add("is-added");
    button.textContent = "Added ✓";
  });
}

async function syncCollectedState(user) {
  const cache = readCache();
  if (cache && cache.uid === user.uid && cache.date === todayKey()) {
    markButtonsAsAdded(new Set(cache.ids));
    dispatchCollectionCount(cache.ids.length);
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const collected = (snap.exists() && snap.data().collected) || [];
    const ids = new Set(collected.map(function (entry) { return entry.id; }));
    writeCache(user.uid, ids);
    markButtonsAsAdded(ids);
    dispatchCollectionCount(ids.size);
  } catch (error) {
    console.error("Could not load collected facts", error);
  }
}

auth.onAuthStateChanged(function (user) {
  currentUser = user;
  if (user) syncCollectedState(user);
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

    const cache = readCache();
    const ids = cache && cache.uid === user.uid && cache.date === todayKey()
      ? new Set(cache.ids)
      : new Set();
    ids.add(factId);
    writeCache(user.uid, ids);
    dispatchCollectionCount(ids.size);
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
