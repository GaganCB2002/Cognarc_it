import activeWin from 'active-win';
import axios from 'axios';

// Read from env or default to dev settings
const API_BASE = process.env.STUDYTRACK_API_BASE || "https://cognarc-it-1.onrender.com/api";
const TELEMETRY_URL = `${API_BASE}/telemetry/desktop`;
const SESSION_URL = `${API_BASE}/tracking/sessions/current`;
const USER_TOKEN = process.env.STUDYTRACK_USER_TOKEN || "temp-user-id";

let currentWindow = null;
let startTime = Date.now();
let activeSessionId = null;

const IDE_APPS = ['Code', 'Code - Insiders', 'idea64', 'webstorm64', 'pycharm64', 'Cursor', 'Windsurf', 'devenv', 'studio'];
const TERMINAL_APPS = ['WindowsTerminal', 'cmd', 'powershell', 'bash', 'ubuntu', 'wsl'];
const BROWSER_APPS = ['chrome', 'msedge', 'brave', 'firefox', 'opera'];
const COMM_APPS = ['slack', 'teams', 'zoom', 'discord'];

function categorizeApp(ownerName) {
  const name = ownerName.toLowerCase();
  if (IDE_APPS.some(app => name.includes(app.toLowerCase()))) return 'IDE';
  if (TERMINAL_APPS.some(app => name.includes(app.toLowerCase()))) return 'Terminal';
  if (BROWSER_APPS.some(app => name.includes(app.toLowerCase()))) return 'Browser';
  if (COMM_APPS.some(app => name.includes(app.toLowerCase()))) return 'Communication';
  return 'General';
}

async function checkActiveSession() {
  try {
    const res = await axios.get(SESSION_URL, {
      headers: { "Authorization": `Bearer ${USER_TOKEN}` }
    });
    if (res.data && res.data.success && res.data.data && res.data.data.status === 'ACTIVE') {
      if (activeSessionId !== res.data.data.id) {
        console.log(`[Session Started] ID: ${res.data.data.id}`);
        activeSessionId = res.data.data.id;
        startTime = Date.now(); // Reset timer for new session
      }
    } else {
      if (activeSessionId) {
        console.log(`[Session Stopped] Tracking disabled.`);
        activeSessionId = null;
        currentWindow = null; // Clear state
      }
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      if (activeSessionId) {
        console.log(`[Session Stopped] Tracking disabled.`);
        activeSessionId = null;
        currentWindow = null;
      }
    } else {
      console.error("Error checking session:", err.message);
    }
  }
}

async function sendTelemetry(win, durationSec) {
  if (!win || durationSec <= 0 || !activeSessionId) return;

  const category = categorizeApp(win.owner.name);
  
  try {
    await axios.post(TELEMETRY_URL, {
      trackingSessionId: activeSessionId,
      activeApp: win.owner.name,
      windowTitle: win.title,
      processName: win.owner.name,
      duration: durationSec,
      isIdle: false, // native idle detection can be added in future
      category: category
    }, {
      headers: { "Authorization": `Bearer ${USER_TOKEN}` }
    });
    console.log(`Sent telemetry: ${win.owner.name} [${category}] for ${durationSec}s`);
  } catch (err) {
    console.error("Failed to send telemetry:", err.message);
  }
}

async function pollActiveWindow() {
  if (!activeSessionId) return; // Do not poll OS if no session

  try {
    const win = await activeWin();
    if (!win) return;

    if (!currentWindow || 
        currentWindow.title !== win.title || 
        currentWindow.owner.name !== win.owner.name) {
      
      const now = Date.now();
      const durationSec = Math.floor((now - startTime) / 1000);

      if (currentWindow && durationSec > 0) {
        await sendTelemetry(currentWindow, durationSec);
      }

      currentWindow = win;
      startTime = now;
    }
  } catch (err) {
    console.error("Error polling window:", err.message);
  }
}

console.log("StudyTrack Desktop Agent Started...");
console.log("Waiting for active session...");

// Poll session state and active window
setInterval(checkActiveSession, 5000);
setInterval(pollActiveWindow, 5000);
