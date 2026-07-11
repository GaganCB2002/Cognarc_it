// Munra Background Service Worker (MV3)
// Uses chrome.alarms for keepalive and reliable scheduling.

let activeTabId = null;
let activeTabUrl = null;
let activeTabDomain = null;
let activeTabTitle = null;
// let activeTabFavicon = null;
let startTime = Date.now();

const DEFAULT_API = "https://cognarc-it-1.onrender.com/api";
let API_BASE = DEFAULT_API;
let AUTH_TOKEN = "";
let activeSessionId = null;

function headers() {
  const h = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) h["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  return h;
}

function telemetryUrl() { return `${API_BASE}/telemetry/browser`; }
function sessionUrl() { return `${API_BASE}/tracking/sessions/current`; }
function _liveUrl() { return `${API_BASE}/tracking/sessions/live`; }

chrome.storage.sync.get({ apiUrl: DEFAULT_API, authToken: "" }, (items) => {
  API_BASE = items.apiUrl || DEFAULT_API;
  AUTH_TOKEN = items.authToken || "";
});

chrome.storage.onChanged.addListener((changes, ns) => {
  if (ns !== "sync") return;
  if (changes.apiUrl) API_BASE = changes.apiUrl.newValue || DEFAULT_API;
  if (changes.authToken) AUTH_TOKEN = changes.authToken.newValue || "";
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SET_AUTH_TOKEN" && msg.token) {
    AUTH_TOKEN = msg.token;
    chrome.storage.sync.set({ authToken: msg.token });
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "GET_STATUS") {
    sendResponse({
      connected: !!activeSessionId,
      activeTab: activeTabUrl,
      sessionId: activeSessionId,
    });
    return true;
  }
});

// ─── Alarm-based scheduling (MV3 keepalive) ───

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check-session", { periodInMinutes: 1 / 12 });  // every 5s
  chrome.alarms.create("stream-telemetry", { periodInMinutes: 1 / 12 });
  chrome.alarms.create("keepalive", { periodInMinutes: 4 });          // keep SW alive
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "check-session") checkActiveSession();
  if (alarm.name === "stream-telemetry") streamTelemetry();
});

// ─── Session check ───

async function checkActiveSession() {
  try {
    const res = await fetch(sessionUrl(), { headers: headers() });
    if (res.ok) {
      const body = await res.json();
      const session = body?.data || body?.session || body;
      if (session && session.status === "ACTIVE") {
        if (activeSessionId !== session.id) {
          activeSessionId = session.id;
          startTime = Date.now();
        }
        return;
      }
    }
    // No active session
    if (activeSessionId) activeSessionId = null;
  } catch {
    // Backend offline – keep sessionId if we had one (don't flap)
  }
}

// ─── Telemetry streaming ───

function categorizeDomain(domain) {
  const docs = ["developer.mozilla.org", "docs.microsoft.com", "react.dev", "nextjs.org", "tailwindcss.com", "nodejs.org"];
  const programming = ["github.com", "stackoverflow.com", "leetcode.com", "gitlab.com", "npmjs.com", "codesandbox.io"];
  const ai = ["chat.openai.com", "claude.ai", "gemini.google.com", "copilot.microsoft.com", "perplexity.ai"];
  const social = ["twitter.com", "x.com", "reddit.com", "facebook.com", "youtube.com", "linkedin.com", "instagram.com"];
  if (docs.includes(domain)) return "Documentation";
  if (programming.includes(domain)) return "Programming";
  if (ai.includes(domain)) return "AI Tools";
  if (social.includes(domain)) return "Social Media";
  return "General";
}

function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return "unknown"; }
}

async function sendTelemetry(url, title, domain, durationSec, category) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || durationSec <= 0 || !activeSessionId) return;
  try {
    await fetch(telemetryUrl(), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ trackingSessionId: activeSessionId, url, title, domain, duration: durationSec, category }),
    });
  } catch {
    // Silently retry on next cycle
  }
}

async function handleTabChange(tabId) {
  if (activeTabId === tabId) return;
  const now = Date.now();
  const durationSec = Math.floor((now - startTime) / 1000);
  if (activeTabUrl) await sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
  try {
    const tab = await chrome.tabs.get(tabId);
    activeTabId = tabId;
    activeTabUrl = tab.url;
    activeTabDomain = extractDomain(tab.url);
    activeTabTitle = tab.title;
    _activeTabFavicon = tab.favIconUrl || null;
    startTime = now;
  } catch {
    activeTabId = null; activeTabUrl = null;
  }
}

chrome.tabs.onActivated.addListener((info) => { handleTabChange(info.tabId); });
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (tabId === activeTabId && change.url) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (activeTabUrl) sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
    activeTabUrl = change.url;
    activeTabDomain = extractDomain(change.url);
    activeTabTitle = tab.title;
    _activeTabFavicon = tab.favIconUrl || null;
    startTime = now;
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (activeTabUrl) sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
    activeTabId = null; activeTabUrl = null; activeTabDomain = null; activeTabTitle = null;
  }
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (activeTabUrl) sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
    activeTabUrl = null;
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        activeTabUrl = tabs[0].url;
        activeTabDomain = extractDomain(tabs[0].url);
        activeTabTitle = tabs[0].title;
        activeTabFavicon = tabs[0].favIconUrl || null;
        startTime = Date.now();
      }
    });
  }
});
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (activeTabUrl) sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
    activeTabUrl = null;
  } else if (state === "active") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        activeTabUrl = tabs[0].url;
        activeTabDomain = extractDomain(tabs[0].url);
        activeTabTitle = tabs[0].title;
        startTime = Date.now();
      }
    });
  }
});

function streamTelemetry() {
  if (activeTabUrl && activeSessionId) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (durationSec >= 5) {
      sendTelemetry(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, categorizeDomain(activeTabDomain));
      startTime = Date.now();
    }
  }
}
