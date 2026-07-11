(function() {
  if (window.__DocAgentInjected) return;
  window.__DocAgentInjected = true;

  const EXTENSION_ID = chrome.runtime.id;

  function injectScript(file, node) {
    const th = document.getElementsByTagName(node)[0];
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', chrome.runtime.getURL(file));
    th.appendChild(s);
  }

  injectScript('lib/db.js', 'body');
  injectScript('lib/tracker.js', 'body');
  injectScript('lib/document-processor.js', 'body');

  function addDocAgentFloatingBtn() {
    if (document.getElementById('docagent-floating-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'docagent-floating-btn';
    btn.innerHTML = `
      <style>
        #docagent-floating-btn { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; }
        #docagent-floating-btn button {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; transition: all 0.2s;
        }
        #docagent-floating-btn button:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(99,102,241,0.6); }
        #docagent-floating-btn button:active { transform: scale(0.95); }
        #docagent-float-menu {
          position: absolute; bottom: 64px; right: 0;
          background: #18181b; border: 1px solid #27272a;
          border-radius: 12px; padding: 8px; min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          display: none;
        }
        #docagent-float-menu.show { display: block; }
        #docagent-float-menu .item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          color: #e4e4e7; font: 13px/1.4 system-ui, sans-serif;
          cursor: pointer; transition: background 0.15s;
        }
        #docagent-float-menu .item:hover { background: #27272a; }
        #docagent-float-menu .item .icon { font-size: 18px; }
        .docagent-badge {
          display: inline-block; background: #6366f1; color: #fff;
          font: 10px/1 system-ui; padding: 1px 6px; border-radius: 8px;
          margin-left: auto;
        }
        #docagent-file-input { display: none; }
        #docagent-toast {
          position: fixed; bottom: 90px; right: 24px;
          background: #18181b; border: 1px solid #27272a;
          border-radius: 10px; padding: 12px 16px;
          color: #e4e4e7; font: 13px/1.4 system-ui, sans-serif;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          display: none; z-index: 2147483647;
          max-width: 320px;
        }
        #docagent-toast.show { display: block; }
        #docagent-toast .close {
          float: right; cursor: pointer; color: #a1a1aa;
          font-size: 16px; margin-left: 12px;
        }
        #docagent-progress {
          height: 3px; background: #27272a; border-radius: 2px;
          margin-top: 8px; overflow: hidden;
        }
        #docagent-progress .fill {
          height: 100%; width: 0%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transition: width 0.3s;
        }
      </style>
      <div id="docagent-toast">
        <span class="close" onclick="this.parentElement.classList.remove('show')">&times;</span>
        <span id="docagent-toast-msg">Ready</span>
        <div id="docagent-progress"><div class="fill" id="docagent-progress-fill"></div></div>
      </div>
      <div id="docagent-float-menu">
        <div class="item" data-action="upload">
          <span class="icon">📄</span> Upload Document
        </div>
        <div class="item" data-action="mydocs">
          <span class="icon">📂</span> My Documents
          <span class="docagent-badge" id="docagent-doc-count">0</span>
        </div>
        <div class="item" data-action="dashboard">
          <span class="icon">⚙️</span> Open Dashboard
        </div>
      </div>
      <button id="docagent-open-btn" title="DocAgent">📋</button>
      <input type="file" id="docagent-file-input" accept=".pdf,.txt,.md,.csv,.json,.xml,.png,.jpg,.jpeg,.gif,.bmp,.webp" multiple />
    `;
    document.body.appendChild(btn);

    let menuOpen = false;
    const menu = document.getElementById('docagent-float-menu');
    const openBtn = document.getElementById('docagent-open-btn');
    const fileInput = document.getElementById('docagent-file-input');
    const toast = document.getElementById('docagent-toast');
    const toastMsg = document.getElementById('docagent-toast-msg');
    const progressFill = document.getElementById('docagent-progress-fill');

    function showToast(msg, duration = 3000) {
      toastMsg.textContent = msg;
      toast.classList.add('show');
      if (duration > 0) setTimeout(() => toast.classList.remove('show'), duration);
    }

    function setProgress(pct) {
      progressFill.style.width = pct + '%';
    }

    openBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      menu.classList.toggle('show', menuOpen);
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target)) {
        menu.classList.remove('show');
        menuOpen = false;
      }
    });

    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('.item');
      if (!item) return;
      const action = item.dataset.action;
      menu.classList.remove('show');
      menuOpen = false;

      if (action === 'upload') {
        fileInput.click();
      } else if (action === 'mydocs') {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
      } else if (action === 'dashboard') {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
      }
    });

    fileInput.addEventListener('change', handleFiles);

    async function handleFiles(e) {
      const files = e.target.files || [];
      if (!files.length) return;

      for (const file of files) {
        showToast(`Processing: ${file.name}...`, 0);
        setProgress(0);
        try {
          const result = await processFile(file);
          setProgress(100);
          if (result) {
            showToast(`✅ "${file.name}" saved (${result.chunkCount || 0} chunks)`, 4000);
          }
        } catch (err) {
          showToast(`❌ Error: ${err.message}`, 5000);
        }
      }
      updateDocCount();
    }

    async function processFile(file) {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
        return await processImage(file);
      }
      if (ext === 'pdf') {
        return await processPDF(file);
      }
      return await processText(file);
    }

    async function processImage(file) {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = chrome.runtime.getURL('sandbox/ocr.html');
        document.body.appendChild(iframe);
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('OCR timeout'));
        }, 120000);
        iframe.onload = async () => {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              iframe.contentWindow.postMessage({
                type: 'OCR_PROCESS',
                imageData: e.target.result,
                id: file.name,
              }, '*');
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
              const db = globalThis.DocAgentDB;
              if (db) {
                await db.ready;
                const doc = await db.addDocument({
                  title: file.name,
                  type: 'image',
                  content: e.data.text,
                  size: file.size,
                  pageCount: 1,
                  preview: e.data.text.slice(0, 300),
                });
                const chunks = [];
                for (let i = 0; i < e.data.text.length; i += 5000) {
                  chunks.push(e.data.text.slice(i, i + 5000));
                }
                for (let i = 0; i < chunks.length; i++) {
                  await db.addChunk(doc.id, chunks[i], i);
                }
                resolve({ ...doc, chunkCount: chunks.length });
              } else {
                resolve({ title: file.name, type: 'image', content: e.data.text });
              }
            } catch (err) {
              reject(err);
            }
          }
        });
      });
    }

    async function processPDF(file) {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      let text = '';
      let pageCount = 0;

      try {
        const db = globalThis.DocAgentDB;
        await db.ready;
        const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
        pageCount = pdf.numPages;
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n\n';
          setProgress(Math.round((i / pageCount) * 80));
        }
        const doc = await db.addDocument({
          title: file.name,
          type: 'pdf',
          content: text.trim(),
          size: file.size,
          pageCount,
          preview: text.trim().slice(0, 300),
        });
        const chunks = [];
        for (let i = 0; i < text.length; i += 5000) {
          chunks.push(text.slice(i, i + 5000));
        }
        for (let i = 0; i < chunks.length; i++) {
          await db.addChunk(doc.id, chunks[i], i);
        }
        return { ...doc, chunkCount: chunks.length };
      } catch (err) {
        return { title: file.name, type: 'pdf', content: text || '[Error]', error: err.message };
      }
    }

    async function processText(file) {
      const text = await file.text();
      const db = globalThis.DocAgentDB;
      await db.ready;
      const doc = await db.addDocument({
        title: file.name,
        type: 'text',
        content: text,
        size: file.size,
        pageCount: 1,
        preview: text.slice(0, 300),
      });
      const chunks = [];
      for (let i = 0; i < text.length; i += 5000) {
        chunks.push(text.slice(i, i + 5000));
      }
      for (let i = 0; i < chunks.length; i++) {
        await db.addChunk(doc.id, chunks[i], i);
      }
      return { ...doc, chunkCount: chunks.length };
    }

    async function updateDocCount() {
      try {
        const db = globalThis.DocAgentDB;
        if (!db) return;
        const docs = await db.getAllDocuments();
        const badge = document.getElementById('docagent-doc-count');
        if (badge) badge.textContent = docs.length;
      } catch {}
    }

    async function loadPDFJS() {
      if (typeof pdfjsLib !== 'undefined') return;
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.js';
      script.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js';
      };
      document.head.appendChild(script);
      await new Promise(resolve => { script.onload = resolve; });
    }

    async function init() {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js';
      } catch {}

      const checkDB = setInterval(async () => {
        if (globalThis.DocAgentDB && typeof globalThis.DocAgentDB.getAllDocuments === 'function') {
          clearInterval(checkDB);
          await updateDocCount();
        }
      }, 200);

      setTimeout(() => clearInterval(checkDB), 10000);
    }

    init();

    const checkPDFJS = setInterval(() => {
      if (typeof pdfjsLib !== 'undefined') {
        clearInterval(checkPDFJS);
        loadPDFJS();
      }
    }, 100);
    setTimeout(() => clearInterval(checkPDFJS), 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDocAgentFloatingBtn);
  } else {
    addDocAgentFloatingBtn();
  }
})();
