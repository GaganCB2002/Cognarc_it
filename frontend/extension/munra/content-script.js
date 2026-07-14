// Munra Content Script
// Shares JWT auth token from the web app with the extension.
// Auto-runs on every matched page to notify the background script
// and signal presence to the page.

(function autoInit() {
  try {
    chrome.runtime.sendMessage({ type: "PAGE_LOADED", url: location.href, host: location.host }, () => {});
  } catch {
    // Extension context may not be ready yet
  }
  // Signal to the page that this extension is installed
  document.documentElement.setAttribute("data-munra-extension", "active");
})();

const STORAGE_KEYS = ["accessToken", "token", "authToken", "sb-access-token"];

function findToken() {
  for (const key of STORAGE_KEYS) {
    try {
      const val = localStorage.getItem(key);
      if (val && val.length > 20) return val;
    } catch {}
  }
  return null;
}

function sendTokenToExtension(token) {
  try {
    chrome.runtime.sendMessage({ type: "SET_AUTH_TOKEN", token }, () => {});
  } catch {}
}

let lastSentToken = null;

function checkAndSync() {
  const token = findToken();
  if (token && token !== lastSentToken) {
    lastSentToken = token;
    sendTokenToExtension(token);
  }
}

checkAndSync();
setInterval(checkAndSync, 3000);

window.addEventListener("storage", (e) => {
  if (STORAGE_KEYS.includes(e.key)) {
    if (e.newValue && e.newValue !== lastSentToken) {
      lastSentToken = e.newValue;
      sendTokenToExtension(e.newValue);
    }
  }
});
