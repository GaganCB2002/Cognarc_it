document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const authTokenInput = document.getElementById('authToken');
  const saveBtn = document.getElementById('btn-save');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.sync.get({
    apiUrl: 'https://cognarc-it-1.onrender.com/api',
    authToken: ''
  }, (items) => {
    apiUrlInput.value = items.apiUrl;
    authTokenInput.value = items.authToken;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim();
    const authToken = authTokenInput.value.trim();

    if (!apiUrl) {
      statusDiv.textContent = 'API URL is required.';
      statusDiv.className = 'status error';
      return;
    }

    chrome.storage.sync.set({
      apiUrl: apiUrl,
      authToken: authToken
    }, () => {
      statusDiv.textContent = 'Configuration saved successfully!';
      statusDiv.className = 'status success';
      
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 3000);
    });
  });
});
