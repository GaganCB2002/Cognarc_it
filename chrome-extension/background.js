chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('landing/index.html') });
  }
  chrome.alarms.create('cleanup', { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

async function cleanupOldData() {
  try {
    const [{ result }] = await chrome.storage.local.get(['cleanupLastRun']);
    const now = Date.now();
    if (result && now - result < 86400000) return;
    await chrome.storage.local.set({ cleanupLastRun: now });
  } catch {}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_DOCUMENTS':
      sendResponse({ type: 'ASYNC' });
      break;
    case 'OPEN_DASHBOARD':
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
      sendResponse({ ok: true });
      break;
    case 'GET_STATS':
      sendResponse({ type: 'ASYNC' });
      break;
    case 'TRACK_EVENT':
      sendResponse({ ok: true });
      break;
    case 'PING':
      sendResponse({ ok: true, version: '1.0.0' });
      break;
  }
  return true;
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
  }
});
