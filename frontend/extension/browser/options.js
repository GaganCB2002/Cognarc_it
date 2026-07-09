document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const userIdInput = document.getElementById('userId');
  const saveBtn = document.getElementById('btn-save');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.sync.get({
    apiUrl: 'http://localhost:5000/api',
    userId: 'temp-user-id'
  }, (items) => {
    apiUrlInput.value = items.apiUrl;
    userIdInput.value = items.userId;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim();
    const userId = userIdInput.value.trim();

    if (!apiUrl || !userId) {
      statusDiv.textContent = 'Both fields are required.';
      statusDiv.className = 'status error';
      return;
    }

    chrome.storage.sync.set({
      apiUrl: apiUrl,
      userId: userId
    }, () => {
      // Update status to let user know options were saved.
      statusDiv.textContent = 'Configuration saved successfully!';
      statusDiv.className = 'status success';
      
      // Clear status after 3 seconds
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 3000);
    });
  });
});
