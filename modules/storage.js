import {
  FULLSCREEN_TEXTAREA_HEIGHT_KEY,
  FULLSCREEN_TEXTAREA_WIDTH_KEY,
  LETTER_DRAFT_STORAGE_KEY,
  MIN_SAVED_FULLSCREEN_HEIGHT_PX,
  MIN_SAVED_FULLSCREEN_WIDTH_PX,
} from "./constants.js";

/** Restore a previously saved draft into the textarea. */
export function restoreLetterDraft() {
  const letterField = document.getElementById("letter-content");
  if (!letterField) return;

  try {
    const savedDraft = localStorage.getItem(LETTER_DRAFT_STORAGE_KEY);
    if (savedDraft !== null) {
      letterField.value = savedDraft;
    }
  } catch {
    /* storage unavailable */
  }
}

/** Bind an `input` listener to auto-save the textarea draft to localStorage. */
export function bindDraftAutosave() {
  const letterField = document.getElementById("letter-content");
  if (!letterField) return;

  letterField.addEventListener("input", (event) => {
    try {
      localStorage.setItem(LETTER_DRAFT_STORAGE_KEY, event.target.value);
    } catch {
      /* storage unavailable */
    }
  });
}

/** Clear the textarea and remove the persisted draft (with user confirmation). */
export function clearLetterDraft() {
  const letterField = document.getElementById("letter-content");
  if (!letterField) return;

  const shouldClear = confirm("Clear your saved draft? This cannot be undone.");
  if (!shouldClear) return;

  letterField.value = "";
  try {
    localStorage.removeItem(LETTER_DRAFT_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Persist the fullscreen textarea dimensions to localStorage.
 * @param {HTMLTextAreaElement} letterField
 */
function saveFullscreenTextareaSize(letterField) {
  const measuredHeight = Math.round(letterField.getBoundingClientRect().height);
  const measuredWidth = Math.round(letterField.getBoundingClientRect().width);
  if (
    !Number.isFinite(measuredHeight) ||
    measuredHeight < MIN_SAVED_FULLSCREEN_HEIGHT_PX
  )
    return;
  if (
    !Number.isFinite(measuredWidth) ||
    measuredWidth < MIN_SAVED_FULLSCREEN_WIDTH_PX
  )
    return;

  try {
    localStorage.setItem(
      FULLSCREEN_TEXTAREA_HEIGHT_KEY,
      String(measuredHeight),
    );
    localStorage.setItem(FULLSCREEN_TEXTAREA_WIDTH_KEY, String(measuredWidth));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Apply previously saved fullscreen dimensions to the textarea.
 * @param {HTMLTextAreaElement} letterField
 */
export function applySavedFullscreenTextareaSize(letterField) {
  try {
    const savedHeight = localStorage.getItem(FULLSCREEN_TEXTAREA_HEIGHT_KEY);
    const savedWidth = localStorage.getItem(FULLSCREEN_TEXTAREA_WIDTH_KEY);
    const parsedHeight = Number.parseInt(savedHeight || "", 10);
    const parsedWidth = Number.parseInt(savedWidth || "", 10);

    if (
      Number.isFinite(parsedHeight) &&
      parsedHeight >= MIN_SAVED_FULLSCREEN_HEIGHT_PX
    ) {
      letterField.style.height = `${parsedHeight}px`;
    }
    if (
      Number.isFinite(parsedWidth) &&
      parsedWidth >= MIN_SAVED_FULLSCREEN_WIDTH_PX
    ) {
      letterField.style.width = `${parsedWidth}px`;
    }
  } catch {
    /* storage unavailable */
  }
}

/** Observe textarea resizes in fullscreen mode and persist the new dimensions. */
export function bindFullscreenResizeMemory() {
  const letterField = document.getElementById("letter-content");
  if (!letterField) return;

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      if (!document.body.classList.contains("writing-focus-active")) return;
      saveFullscreenTextareaSize(letterField);
    });
    observer.observe(letterField);
    return;
  }

  const fallbackSave = () => {
    if (!document.body.classList.contains("writing-focus-active")) return;
    saveFullscreenTextareaSize(letterField);
  };
  letterField.addEventListener("mouseup", fallbackSave);
  letterField.addEventListener("touchend", fallbackSave);
}
