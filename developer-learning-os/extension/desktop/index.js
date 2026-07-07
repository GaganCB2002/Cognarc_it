import activeWin from 'active-win';
import axios from 'axios';

// Read from env or default to dev settings
const API_URL = process.env.STUDYTRACK_API_URL || "http://localhost:5000/api/telemetry/desktop";
const USER_ID = process.env.STUDYTRACK_USER_ID || "temp-user-id";

let currentWindow = null;
let startTime = Date.now();

const IDE_APPS = ['Code', 'Code - Insiders', 'idea64', 'webstorm64', 'pycharm64', 'Cursor', 'Windsurf', 'devenv'];
const TERMINAL_APPS = ['WindowsTerminal', 'cmd', 'powershell', 'bash', 'ubuntu'];
const BROWSER_APPS = ['chrome', 'msedge', 'brave', 'firefox', 'opera'];

function categorizeApp(ownerName) {
  if (IDE_APPS.some(app => ownerName.includes(app))) return 'IDE';
  if (TERMINAL_APPS.some(app => ownerName.includes(app))) return 'Terminal';
  if (BROWSER_APPS.some(app => ownerName.toLowerCase().includes(app))) return 'Browser';
  return 'General';
}

async function sendTelemetry(win, durationSec) {
  if (!win || durationSec <= 0) return;

  const category = categorizeApp(win.owner.name);
  
  try {
    await axios.post(API_URL, {
      activeApp: win.owner.name,
      windowTitle: win.title,
      processName: win.owner.name, // using owner name as process name approximation
      duration: durationSec,
      isIdle: false, // basic scaffold, idle detection requires native hooks
      category: category
    }, {
      headers: {
        "Authorization": `Bearer ${USER_ID}`
      }
    });
    console.log(`Sent telemetry: ${win.owner.name} [${category}] for ${durationSec}s`);
  } catch (err) {
    console.error("Failed to send telemetry:", err.message);
  }
}

async function pollActiveWindow() {
  try {
    const win = await activeWin();
    
    if (!win) return;

    // Check if the window has changed
    if (!currentWindow || 
        currentWindow.title !== win.title || 
        currentWindow.owner.name !== win.owner.name) {
      
      const now = Date.now();
      const durationSec = Math.floor((now - startTime) / 1000);

      // Send telemetry for previous window
      if (currentWindow) {
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
console.log("Monitoring active windows. Press Ctrl+C to stop.");

// Poll every 5 seconds
setInterval(pollActiveWindow, 5000);
