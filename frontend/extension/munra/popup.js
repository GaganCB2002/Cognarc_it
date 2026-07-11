document.addEventListener('DOMContentLoaded', () => {
  const domainEl = document.getElementById('current-domain');

  // Fetch the current active tab and display its domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const url = tabs[0].url;
      try {
        const { hostname } = new URL(url);
        domainEl.textContent = hostname;
      } catch (_e) {
        domainEl.textContent = 'Unknown';
      }
    }
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    // Open settings/options page
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
});
