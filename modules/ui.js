import { decrypt, encrypt, formatSealedOn } from "./crypto.js";
import {
  applySavedFullscreenTextareaSize,
  bindDraftAutosave,
  bindFullscreenResizeMemory,
  clearLetterDraft,
  restoreLetterDraft,
} from "./storage.js";

export { clearLetterDraft };

/**
 * Toggle the fullscreen writing mode.
 * @param {boolean} [forceState] - Explicitly set fullscreen on/off; omit to toggle.
 */
export function toggleWriteFocus(forceState) {
  const active = document.body.classList.contains("writing-focus-active");
  const nextState = typeof forceState === "boolean" ? forceState : !active;
  const button = document.getElementById("focus-write-btn");
  const letterField = document.getElementById("letter-content");

  document.body.classList.toggle("writing-focus-active", nextState);

  if (button) {
    button.innerText = nextState ? "Exit Fullscreen" : "Fullscreen";
    button.setAttribute("aria-pressed", nextState ? "true" : "false");
  }

  if (nextState && letterField) {
    applySavedFullscreenTextareaSize(letterField);
    letterField.focus();
    letterField.setSelectionRange(
      letterField.value.length,
      letterField.value.length,
    );
  } else if (letterField) {
    letterField.style.width = "";
    letterField.style.height = "";
  }
}

/** Encrypt the compose form contents and display the sealed URL. */
export async function sealLetter() {
  const content = document.getElementById("letter-content").value;
  const password = document.getElementById("compose-password").value;

  if (!content || !password) {
    alert("Please provide both your letter and a passphrase.");
    return;
  }

  try {
    const useBase2048 = document.getElementById("shorter-link").checked;
    const encryptedHash = await encrypt(content, password, { useBase2048 });
    const url = `${window.location.origin + window.location.pathname}#${encryptedHash}`;

    document.getElementById("url-display").innerText = url;
    document.getElementById("url-output").style.display = "block";
  } catch (err) {
    console.error("Encryption failed:", err);
    alert("An error occurred while sealing the letter.");
  }
}

/** Copy the sealed URL to the clipboard. */
export async function copyURL() {
  const url = document.getElementById("url-display").innerText;
  const feedback = document.getElementById("copy-feedback");

  try {
    await navigator.clipboard.writeText(url);
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
    }, 1800);
  } catch (err) {
    alert(
      "Failed to copy link automatically. Please select the URL and copy it manually.",
    );
  }
}

/** Navigate to the sealed URL to preview the unlock flow. */
export function previewLetter() {
  const url = document.getElementById("url-display").innerText;
  window.location.href = url;
  window.location.reload();
}

/** Decrypt the URL hash and show the letter content. */
export async function unsealLetter() {
  const password = document.getElementById("unlock-password").value;
  const hash = decodeURIComponent(window.location.hash.substring(1));
  const errorMsg = document.getElementById("error-msg");

  errorMsg.style.display = "none";

  if (!password) {
    errorMsg.innerText = "Please enter a passphrase.";
    errorMsg.style.display = "block";
    return;
  }

  try {
    const { text, ts } = await decrypt(hash, password);

    document.getElementById("unlock-view").classList.add("hidden");
    document.getElementById("letter-view").classList.remove("hidden");

    const bodyEl = document.getElementById("letter-body");
    bodyEl.textContent = text;
    bodyEl.style.whiteSpace = "pre-wrap";

    document.getElementById("letter-timestamp").innerText = formatSealedOn(ts);
  } catch (err) {
    console.error("Decryption failed:", err);
    if (err.message === "UNSUPPORTED_COMPRESSION") {
      errorMsg.innerText =
        "This letter uses a compression method your browser doesn't support. Try Firefox or Safari.";
    } else {
      errorMsg.innerText =
        "The passphrase doesn't seem right. Please try again.";
    }
    errorMsg.style.display = "block";
  }
}

/** Wire up DOM event listeners, restore drafts, and route to the correct view. */
export function init() {
  document.addEventListener("DOMContentLoaded", () => {
    restoreLetterDraft();
    bindDraftAutosave();
    bindFullscreenResizeMemory();

    if (window.location.hash.length > 1) {
      document.getElementById("compose-view").classList.add("hidden");
      document.getElementById("unlock-view").classList.remove("hidden");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      document.body.classList.contains("writing-focus-active")
    ) {
      toggleWriteFocus(false);
    }
  });
}
