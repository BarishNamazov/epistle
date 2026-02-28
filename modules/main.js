import {
  clearLetterDraft,
  copyURL,
  init,
  previewLetter,
  sealLetter,
  toggleWriteFocus,
  unsealLetter,
} from "./ui.js";

window.sealLetter = sealLetter;
window.unsealLetter = unsealLetter;
window.copyURL = copyURL;
window.previewLetter = previewLetter;
window.toggleWriteFocus = toggleWriteFocus;
window.clearLetterDraft = clearLetterDraft;

init();
