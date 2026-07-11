(function() {
  const db = globalThis.DocAgentDB;
  let currentDocs = [];

  const $ = (id) => document.getElementById(id);
  const uploadBtn = $('uploadBtn');
  const dashboardBtn = $('dashboardBtn');
  const fileInput = $('fileInput');
  const status = $('status');
  const progressWrap = $('progressWrap');
  const progressFill = $('progressFill');
  const progressText = $('progressText');
  const recentList = $('recentList');
  const docCount = $('docCount');
  const statsText = $('statsText');
  const viewAllBtn = $('viewAllBtn');
  const settingsBtn = $('settingsBtn');

  function setStatus(msg, isError = false) {
    status.textContent = msg;
    status.style.color = isError ? '#ef4444' : '#a1a1aa';
  }

  function setProgress(pct) {
    progressFill.style.width = Math.min(pct, 100) + '%';
    progressText.textContent = Math.round(pct) + '%';
    progressWrap.style.display = 'flex';
    if (pct >= 100) {
      setTimeout(() => { progressWrap.style.display = 'none'; }, 1000);
    }
  }

  async function loadDocuments() {
    try {
      currentDocs = await db.getAllDocuments();
      renderRecent();
      docCount.textContent = currentDocs.length;
      statsText.textContent = `${currentDocs.length} document${currentDocs.length !== 1 ? 's' : ''}`;
    } catch (err) {
      setStatus('Error loading documents', true);
    }
  }

  function renderRecent() {
    if (!currentDocs.length) {
      recentList.innerHTML = '<div class="empty">No documents yet</div>';
      return;
    }
    const recent = currentDocs.slice(0, 5);
    recentList.innerHTML = recent.map(doc => {
      const icon = doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : '📝';
      const date = new Date(doc.createdAt).toLocaleDateString();
      return `
        <div class="doc-item" data-id="${doc.id}">
          <span class="doc-icon">${icon}</span>
          <div class="doc-info">
            <div class="doc-title">${escapeHtml(doc.title)}</div>
            <div class="doc-meta">${date} · ${formatSize(doc.size)}</div>
          </div>
          <span class="doc-type">${doc.type}</span>
        </div>
      `;
    }).join('');

    recentList.querySelectorAll('.doc-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        chrome.tabs.create({
          url: chrome.runtime.getURL(`dashboard/index.html?id=${id}`)
        });
      });
    });
  }

  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
  }

  async function processFile(file) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    setStatus(`Processing: ${file.name}...`);

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
      return await processImage(file);
    } else if (ext === 'pdf') {
      return await processPDF(file);
    } else {
      return await processText(file);
    }
  }

  async function processImage(file) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = chrome.runtime.getURL('sandbox/ocr.html');
    document.body.appendChild(iframe);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('OCR timeout'));
      }, 120000);

      iframe.onload = async () => {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            iframe.contentWindow.postMessage({ type: 'OCR_PROCESS', imageData: e.target.result, id: file.name }, '*');
          };
          reader.readAsDataURL(file);
        } catch (err) {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(err);
        }
      };

      window.addEventListener('message', async function handler(e) {
        if (e.data?.type === 'OCR_RESULT' && e.data?.id === file.name) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          document.body.removeChild(iframe);
          try {
            const doc = await db.addDocument({
              title: file.name, type: 'image', content: e.data.text,
              size: file.size, pageCount: 1, preview: e.data.text.slice(0, 300),
            });
            const chunks = chunkText(e.data.text);
            for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
            resolve({ ...doc, chunkCount: chunks.length });
          } catch (err) { reject(err); }
        }
      });
    });
  }

  async function processPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    let text = '';
    let pageCount = 0;

    const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
    pageCount = pdf.numPages;
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n\n';
      setProgress(Math.round((i / pageCount) * 80));
    }

    const doc = await db.addDocument({
      title: file.name, type: 'pdf', content: text.trim(),
      size: file.size, pageCount, preview: text.trim().slice(0, 300),
    });
    const chunks = chunkText(text.trim());
    for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
    return { ...doc, chunkCount: chunks.length };
  }

  async function processText(file) {
    const text = await file.text();
    const doc = await db.addDocument({
      title: file.name, type: 'text', content: text,
      size: file.size, pageCount: 1, preview: text.slice(0, 300),
    });
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
    return { ...doc, chunkCount: chunks.length };
  }

  function chunkText(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += 5000) chunks.push(text.slice(i, i + 5000));
    return chunks;
  }

  uploadBtn.addEventListener('click', () => fileInput.click());

  dashboardBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
  });

  viewAllBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
  });

  fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
      try {
        const result = await processFile(file);
        setProgress(100);
        setStatus(`✅ "${file.name}" saved`);
        await loadDocuments();
      } catch (err) {
        setStatus(`❌ ${err.message}`, true);
      }
    }
    fileInput.value = '';
  });

  loadDocuments();
})();
