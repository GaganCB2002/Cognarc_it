// StudyTrack Background Service Worker

let activeTabId = null;
let activeTabUrl = null;
let activeTabDomain = null;
let activeTabTitle = null;
let startTime = Date.now();

let API_BASE = "https://cognarc-it-1.onrender.com/api";
let TELEMETRY_URL = `${API_BASE}/telemetry/browser`;
let SESSION_URL = `${API_BASE}/tracking/sessions/current`;
let AUTH_TOKEN = "";
let activeSessionId = null;

// Initialize from storage
chrome.storage.sync.get({
  apiUrl: 'https://cognarc-it-1.onrender.com/api',
  authToken: ''
}, (items) => {
  API_BASE = items.apiUrl;
  TELEMETRY_URL = `${API_BASE}/telemetry/browser`;
  SESSION_URL = `${API_BASE}/tracking/sessions/current`;
  AUTH_TOKEN = items.authToken;
});

// Listen for options changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.apiUrl) {
      API_BASE = changes.apiUrl.newValue;
      TELEMETRY_URL = `${API_BASE}/telemetry/browser`;
      SESSION_URL = `${API_BASE}/tracking/sessions/current`;
    }
    if (changes.authToken) {
      AUTH_TOKEN = changes.authToken.newValue;
    }
  }
});

// Simple hardcoded categorizer for the prototype
function categorizeDomain(domain) {
  const docs = ['developer.mozilla.org', 'docs.microsoft.com', 'react.dev'];
  const programming = ['github.com', 'stackoverflow.com', 'leetcode.com'];
  const ai = ['chat.openai.com', 'claude.ai', 'gemini.google.com'];
  const social = ['twitter.com', 'reddit.com', 'facebook.com', 'youtube.com'];

  if (docs.includes(domain)) return 'Documentation';
  if (programming.includes(domain)) return 'Programming';
  if (ai.includes(domain)) return 'AI Tools';
  if (social.includes(domain)) return 'Social Media';
  return 'General';
}

function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch (e) {
    return 'unknown';
  }
}

async function checkActiveSession() {
  try {
    const url = AUTH_TOKEN ? `${SESSION_URL}?token=${encodeURIComponent(AUTH_TOKEN)}` : SESSION_URL;
    const res = await fetch(url);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data && data.data.status === 'ACTIVE') {
        if (activeSessionId !== data.data.id) {
          console.log(`[Session Started] ID: ${data.data.id}`);
          activeSessionId = data.data.id;
          startTime = Date.now(); // Reset timer
        }
      } else {
        if (activeSessionId) {
          console.log(`[Session Stopped] Tracking disabled.`);
          activeSessionId = null;
        }
      }
    } else {
      if (activeSessionId) {
        console.log(`[Session Stopped] Tracking disabled.`);
        activeSessionId = null;
      }
    }
  } catch (err) {
    console.error("Error checking session:", err);
  }
}

// Poll session state every 5 seconds
setInterval(checkActiveSession, 5000);

async function sendTelemetryData(url, title, domain, durationSec, category) {
  // Only send if there's actually a valid URL, duration > 0, and an active session
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || durationSec <= 0 || !activeSessionId) return;

  try {
    const url = AUTH_TOKEN ? `${TELEMETRY_URL}?token=${encodeURIComponent(AUTH_TOKEN)}` : TELEMETRY_URL;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackingSessionId: activeSessionId,
        url,
        title,
        domain,
        duration: durationSec,
        category,
      }),
    });
    console.log(`Sent telemetry for ${domain}: ${durationSec}s`);
  } catch (err) {
    console.error("Failed to send telemetry:", err);
  }
}

async function handleTabChange(tabId) {
  if (activeTabId === tabId) return;

  const now = Date.now();
  const durationSec = Math.floor((now - startTime) / 1000);

  // Send data for previous tab
  if (activeTabUrl) {
    const category = categorizeDomain(activeTabDomain);
    await sendTelemetryData(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, category);
  }

  // Update to new tab
  try {
    const tab = await chrome.tabs.get(tabId);
    activeTabId = tabId;
    activeTabUrl = tab.url;
    activeTabDomain = extractDomain(tab.url);
    activeTabTitle = tab.title;
    startTime = now;
  } catch (err) {
    console.error("Error getting tab info", err);
    activeTabId = null;
    activeTabUrl = null;
  }
}

// Listen for active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// Listen for URL changes in the active tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);

    // Send data for the old URL
    if (activeTabUrl) {
      const category = categorizeDomain(activeTabDomain);
      sendTelemetryData(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, category);
    }

    activeTabUrl = changeInfo.url;
    activeTabDomain = extractDomain(changeInfo.url);
    activeTabTitle = tab.title;
    startTime = now;
  }
});

// Idle detection
chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === 'idle' || newState === 'locked') {
    // Treat idle/locked as closing the active tab session
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    
    if (activeTabUrl) {
      const category = categorizeDomain(activeTabDomain);
      sendTelemetryData(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, category);
    }
    
    // Pause tracking
    activeTabUrl = null; 
  } else if (newState === 'active') {
    // Resume tracking by fetching the active tab
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

// Stream telemetry continuously every 5 seconds to provide real-time live data
setInterval(async () => {
  if (activeTabUrl && activeSessionId) {
    const now = Date.now();
    const durationSec = Math.floor((now - startTime) / 1000);
    if (durationSec >= 5) {
      const category = categorizeDomain(activeTabDomain);
      await sendTelemetryData(activeTabUrl, activeTabTitle, activeTabDomain, durationSec, category);
      startTime = Date.now(); // Reset timer to stream in chunks
    }
  }
}, 5000);
