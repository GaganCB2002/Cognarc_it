(function() {
  const db = globalThis.DocAgentDB;
  let allDocs = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedDocId = null;

  const $ = (id) => document.getElementById(id);

  const docList = $('docList');
  const searchInput = $('searchInput');
  const viewTitle = $('viewTitle');
  const progressWrap = $('progressWrap');
  const progressFill = $('progressFill');
  const progressText = $('progressText');
  const detailPanel = $('detailPanel');
  const detailBody = $('detailBody');
  const closeDetailBtn = $('closeDetailBtn');
  const refreshBtn = $('refreshBtn');
  const clearBtn = $('clearBtn');
  const uploadNavBtn = $('uploadNavBtn');
  const navFileInput = $('navFileInput');
  const toast = $('toast');
  const statCount = $('statCount');
  const statSize = $('statSize');
  const statChunks = $('statChunks');

  let toastTimeout = null;

  function showToast(msg, duration = 3000) {
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function setProgress(pct, text) {
    progressFill.style.width = Math.min(pct, 100) + '%';
    progressText.textContent = text || Math.round(pct) + '%';
    progressWrap.style.display = 'flex';
    if (pct >= 100) {
      setTimeout(() => { progressWrap.style.display = 'none'; }, 1500);
    }
  }

  async function loadDocuments() {
    try {
      docList.innerHTML = '<div class="loading">Loading documents...</div>';
      allDocs = await db.getAllDocuments();
      renderDocuments();
      updateStats();
    } catch (err) {
      docList.innerHTML = `<div class="loading">Error loading: ${err.message}</div>`;
    }
  }

  function getFilteredDocs() {
    let docs = allDocs;
    if (currentFilter !== 'all') {
      docs = docs.filter(d => d.type === currentFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
      );
    }
    return docs;
  }

  function renderDocuments() {
    const docs = getFilteredDocs();
    viewTitle.textContent = searchQuery
      ? `Search: "${searchQuery}"`
      : currentFilter === 'all' ? 'All Documents' : `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}s`;

    if (!docs.length) {
      docList.innerHTML = '<div class="loading">No documents found</div>';
      return;
    }

    docList.innerHTML = docs.map(doc => {
      const icon = doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : '📝';
      const date = new Date(doc.createdAt).toLocaleDateString();
      const size = formatSize(doc.size);
      const preview = (doc.preview || doc.content || '').slice(0, 120);
      const isActive = doc.id === selectedDocId;
      return `
        <div class="doc-card ${isActive ? 'active' : ''}" data-id="${doc.id}">
          <span class="doc-icon">${icon}</span>
          <div class="doc-body">
            <div class="doc-title">${escapeHtml(doc.title)}</div>
            <div class="doc-preview">${escapeHtml(preview)}</div>
            <div class="doc-footer">
              <span class="doc-tag">${doc.type}</span>
              <span>${date}</span>
              <span>${size}</span>
              ${doc.pageCount > 1 ? `<span>${doc.pageCount} pages</span>` : ''}
            </div>
          </div>
          <div class="doc-actions">
            <button class="doc-action-btn" data-action="view" title="View">👁️</button>
            <button class="doc-action-btn danger" data-action="delete" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    docList.querySelectorAll('.doc-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.target.closest('.doc-action-btn')?.dataset.action;
        const id = card.dataset.id;
        if (action === 'delete') {
          e.stopPropagation();
          deleteDocument(id);
        } else {
          selectDocument(id);
        }
      });
    });
  }

  async function selectDocument(id) {
    selectedDocId = id;
    renderDocuments();

    try {
      detailBody.innerHTML = '<div class="loading">Loading...</div>';
      const doc = await db.getDocument(id);
      if (!doc) {
        detailBody.innerHTML = '<div class="detail-empty">Document not found</div>';
        return;
      }

      const chunks = await db.getChunks(id);
      const fullText = chunks.map(c => c.text).join('');

      const icon = doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : '📝';
      const date = new Date(doc.createdAt).toLocaleString();
      const size = formatSize(doc.size);

      detailBody.innerHTML = `
        <div class="detail-meta">
          <div class="detail-meta-item"><strong>${icon}</strong> ${escapeHtml(doc.title)}</div>
          <div class="detail-meta-item"><strong>Type:</strong> ${doc.type}</div>
          <div class="detail-meta-item"><strong>Size:</strong> ${size}</div>
          <div class="detail-meta-item"><strong>Created:</strong> ${date}</div>
          ${doc.pageCount > 1 ? `<div class="detail-meta-item"><strong>Pages:</strong> ${doc.pageCount}</div>` : ''}
          <div class="detail-meta-item"><strong>Chunks:</strong> ${chunks.length}</div>
        </div>
        <div class="detail-content">${escapeHtml(fullText || doc.content || 'No content')}</div>
      `;

      if (window.innerWidth <= 900) {
        detailPanel.classList.add('open');
      }
    } catch (err) {
      detailBody.innerHTML = `<div class="detail-empty">Error: ${err.message}</div>`;
    }
  }

  async function deleteDocument(id) {
    if (!confirm('Delete this document?')) return;
    try {
      await db.deleteChunks(id);
      await db.deleteDocument(id);
      showToast('Document deleted');
      if (selectedDocId === id) {
        selectedDocId = null;
        detailBody.innerHTML = '<div class="detail-empty">Select a document to view its contents</div>';
      }
      await loadDocuments();
    } catch (err) {
      showToast('Error deleting: ' + err.message, 4000);
    }
  }

  async function updateStats() {
    try {
      const stats = await db.getStats();
      statCount.textContent = stats.totalDocuments;
      statSize.textContent = formatSize(stats.totalSize);
      statChunks.textContent = allDocs.reduce((sum, d) => sum + Math.ceil((d.content?.length || 0) / 5000), 0);
    } catch {}
  }

  async function processFiles(files) {
    for (const file of files) {
      try {
        setProgress(5, `Processing: ${file.name}...`);
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
          await processImage(file);
        } else if (ext === 'pdf') {
          await processPDF(file);
        } else {
          await processTextFile(file);
        }

        setProgress(100, 'Complete');
        showToast(`✅ "${file.name}" saved`);
        await loadDocuments();
      } catch (err) {
        showToast(`❌ "${file.name}": ${err.message}`, 5000);
      }
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
            const text = e.data.text || '';
            setProgress(50, 'Saving to database...');
            const doc = await db.addDocument({
              title: file.name, type: 'image', content: text,
              size: file.size, pageCount: 1, preview: text.slice(0, 300),
            });
            const chunks = [];
            for (let i = 0; i < text.length; i += 5000) chunks.push(text.slice(i, i + 5000));
            for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
            resolve();
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
      setProgress(Math.round((i / pageCount) * 70), `Page ${i}/${pageCount}`);
    }

    setProgress(75, 'Saving to database...');
    const doc = await db.addDocument({
      title: file.name, type: 'pdf', content: text.trim(),
      size: file.size, pageCount, preview: text.trim().slice(0, 300),
    });
    const chunks = [];
    for (let i = 0; i < text.length; i += 5000) chunks.push(text.slice(i, i + 5000));
    for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
  }

  async function processTextFile(file) {
    const text = await file.text();
    setProgress(50, 'Saving to database...');
    const doc = await db.addDocument({
      title: file.name, type: 'text', content: text,
      size: file.size, pageCount: 1, preview: text.slice(0, 300),
    });
    const chunks = [];
    for (let i = 0; i < text.length; i += 5000) chunks.push(text.slice(i, i + 5000));
    for (let i = 0; i < chunks.length; i++) await db.addChunk(doc.id, chunks[i], i);
  }

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(1)} ${units[i]}`;
  }

  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderDocuments();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderDocuments();
  });

  closeDetailBtn.addEventListener('click', () => {
    selectedDocId = null;
    detailPanel.classList.remove('open');
    detailBody.innerHTML = '<div class="detail-empty">Select a document to view its contents</div>';
    renderDocuments();
  });

  refreshBtn.addEventListener('click', loadDocuments);

  clearBtn.addEventListener('click', async () => {
    if (!confirm('Delete ALL documents and data? This cannot be undone.')) return;
    try {
      await db.clearAll();
      showToast('All data cleared');
      selectedDocId = null;
      detailBody.innerHTML = '<div class="detail-empty">Select a document to view its contents</div>';
      await loadDocuments();
    } catch (err) {
      showToast('Error: ' + err.message, 4000);
    }
  });

  uploadNavBtn.addEventListener('click', () => navFileInput.click());

  navFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length) {
      await processFiles(e.target.files);
      navFileInput.value = '';
    }
  });

  const urlParams = new URLSearchParams(location.search);
  const docId = urlParams.get('id');
  if (docId) {
    setTimeout(() => selectDocument(docId), 300);
  }

  loadDocuments();
})();
