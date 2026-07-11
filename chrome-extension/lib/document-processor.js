(function() {
  const CHUNK_SIZE = 5000;

  async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function extractTextFromPlainText(content) {
    return content;
  }

  async function extractTextFromPDF(file, onProgress) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    let text = '';
    let pageCount = 0;

    try {
      if (typeof pdfjsLib === 'undefined') {
        return { text: '[PDF.js not loaded. Install the extension properly.]', pageCount: 0 };
      }
      const data = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
      pageCount = pdf.numPages;

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n\n';
        if (onProgress) onProgress(Math.round((i / pageCount) * 100));
      }
    } catch (err) {
      text = `[Error extracting PDF: ${err.message}]`;
    }

    return { text: text.trim(), pageCount };
  }

  async function extractTextFromImage(file, onProgress) {
    try {
      const dataUrl = await readFileAsDataURL(file);

      if (typeof Tesseract === 'undefined') {
        return { text: '[OCR engine not available. The sandbox should handle this.]' };
      }

      if (onProgress) onProgress(10);

      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
      });

      if (onProgress) onProgress(100);
      return { text: result.data.text.trim() };
    } catch (err) {
      return { text: `[Error extracting image text: ${err.message}]` };
    }
  }

  async function processImageViaSandbox(file) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = chrome.runtime.getURL('sandbox/ocr.html');
      document.body.appendChild(iframe);

      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('OCR sandbox timeout'));
      }, 60000);

      iframe.onload = async () => {
        try {
          const dataUrl = await readFileAsDataURL(file);
          iframe.contentWindow.postMessage({
            type: 'OCR_PROCESS',
            imageData: dataUrl,
            id: file.name,
          }, '*');
        } catch (err) {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(err);
        }
      };

      window.addEventListener('message', function handler(e) {
        if (e.data?.type === 'OCR_RESULT' && e.data?.id === file.name) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          document.body.removeChild(iframe);
          resolve({ text: e.data.text });
        }
      });
    });
  }

  function chunkText(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  }

  async function processDocument(file, onProgress) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let type = 'text';
    let content = '';
    let text = '';
    let pageCount = 1;

    if (['pdf'].includes(ext)) {
      type = 'pdf';
      const result = await extractTextFromPDF(file, onProgress);
      text = result.text;
      pageCount = result.pageCount || 1;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'tif'].includes(ext)) {
      type = 'image';
      try {
        const result = await processImageViaSandbox(file);
        text = result.text;
      } catch {
        text = '[OCR processing unavailable]';
      }
    } else if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'rb', 'go', 'rs', 'sh', 'bat', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'].includes(ext)) {
      type = 'text';
      content = await readFileAsText(file);
      text = content;
    } else {
      try {
        content = await readFileAsText(file);
        text = content;
      } catch {
        text = `[Unsupported file type: .${ext}]`;
      }
    }

    content = text;

    const doc = await globalThis.DocAgentDB.addDocument({
      title: file.name,
      type,
      content: text,
      size: file.size,
      pageCount,
      preview: text.slice(0, 300),
    });

    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      await globalThis.DocAgentDB.addChunk(doc.id, chunks[i], i);
    }

    return { ...doc, chunkCount: chunks.length };
  }

  async function getFullDocumentText(docId) {
    const doc = await globalThis.DocAgentDB.getDocument(docId);
    if (!doc) return null;
    const chunks = await globalThis.DocAgentDB.getChunks(docId);
    return {
      ...doc,
      fullText: chunks.map(c => c.text).join(''),
    };
  }

  const api = {
    processDocument,
    getFullDocumentText,
    extractTextFromPDF,
    extractTextFromImage,
    extractTextFromPlainText,
    chunkText,
    readFileAsArrayBuffer,
    readFileAsDataURL,
    readFileAsText,
    processImageViaSandbox,
  };

  if (typeof globalThis !== 'undefined') {
    globalThis.DocAgentProcessor = api;
  }

  return api;
})();
