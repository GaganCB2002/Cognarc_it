// StudyTrack Background Service Worker

let activeTabId = null;
let activeTabUrl = null;
let activeTabDomain = null;
let activeTabTitle = null;
let startTime = Date.now();

// Base URL of the local backend API for development
// In production, this would be read from config or set to the production URL
let API_URL = "http://localhost:5000/api/telemetry/browser";
let USER_ID = "temp-user-id";

// Initialize from storage
chrome.storage.sync.get({
  apiUrl: 'http://localhost:5000/api/telemetry/browser',
  userId: 'temp-user-id'
}, (items) => {
  API_URL = items.apiUrl.endsWith('/browser') ? items.apiUrl : `${items.apiUrl}/telemetry/browser`;
  USER_ID = items.userId;
});

// Listen for options changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.apiUrl) {
      API_URL = changes.apiUrl.newValue.endsWith('/browser') ? changes.apiUrl.newValue : `${changes.apiUrl.newValue}/telemetry/browser`;
    }
    if (changes.userId) {
      USER_ID = changes.userId.newValue;
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

async function sendTelemetryData(url, title, domain, durationSec, category) {
  // Only send if there's actually a valid URL and duration > 0
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || durationSec <= 0) return;

  try {
    // We send the user ID in the headers or body. Our backend expects it injected by auth, 
    // but for the scaffold we can pass it in body and adapt the backend, or just let backend use temp-user-id.
    // For now we pass it as Authorization header (mock).
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${USER_ID}`
      },
      body: JSON.stringify({
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
