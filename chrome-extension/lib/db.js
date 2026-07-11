const DB_NAME = 'DocAgentDB';
const DB_VERSION = 2;
let _db = null;

async function getDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('text_chunks')) {
        const chunkStore = db.createObjectStore('text_chunks', { keyPath: 'id' });
        chunkStore.createIndex('docId', 'docId', { unique: false });
        chunkStore.createIndex('searchContent', 'searchContent', { unique: false });
      }
      if (!db.objectStoreNames.contains('tracking_events')) {
        db.createObjectStore('tracking_events', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

const db = {
  async addDocument({ title, type, content, size, pageCount, preview }) {
    const database = await getDB();
    const doc = {
      id: crypto.randomUUID(),
      title: title || 'Untitled',
      type: type || 'text',
      content: content || '',
      size: size || 0,
      pageCount: pageCount || 1,
      preview: preview || content?.slice(0, 200) || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };
    const tx = database.transaction('documents', 'readwrite');
    tx.objectStore('documents').add(doc);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
    return doc;
  },

  async updateDocument(id, updates) {
    const database = await getDB();
    const tx = database.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    const existing = await new Promise((resolve) => {
      const r = store.get(id);
      r.onsuccess = () => resolve(r.result);
    });
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    store.put(updated);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    return updated;
  },

  async getDocument(id) {
    const database = await getDB();
    const tx = database.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    return new Promise((resolve) => {
      const r = store.get(id);
      r.onsuccess = () => resolve(r.result);
    });
  },

  async getAllDocuments() {
    const database = await getDB();
    const tx = database.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    const index = store.index('createdAt');
    return new Promise((resolve) => {
      const results = [];
      const r = index.openCursor(null, 'prev');
      r.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { results.push(cursor.value); cursor.continue(); }
        else resolve(results);
      };
    });
  },

  async deleteDocument(id) {
    const database = await getDB();
    const tx = database.transaction('documents', 'readwrite');
    tx.objectStore('documents').delete(id);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    return true;
  },

  async searchDocuments(query) {
    const database = await getDB();
    const all = await db.getAllDocuments();
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  },

  async addChunk(docId, text, index) {
    const database = await getDB();
    const chunk = {
      id: `${docId}_${index}`,
      docId,
      index,
      text,
      searchContent: text.toLowerCase().slice(0, 500),
      createdAt: Date.now(),
    };
    const tx = database.transaction('text_chunks', 'readwrite');
    tx.objectStore('text_chunks').add(chunk);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    return chunk;
  },

  async getChunks(docId) {
    const database = await getDB();
    const tx = database.transaction('text_chunks', 'readonly');
    const store = tx.objectStore('text_chunks');
    const index = store.index('docId');
    return new Promise((resolve) => {
      const results = [];
      const r = index.openCursor(IDBKeyRange.only(docId));
      r.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { results.push(cursor.value); cursor.continue(); }
        else resolve(results.sort((a, b) => a.index - b.index));
      };
    });
  },

  async deleteChunks(docId) {
    const chunks = await db.getChunks(docId);
    const database = await getDB();
    const tx = database.transaction('text_chunks', 'readwrite');
    const store = tx.objectStore('text_chunks');
    for (const c of chunks) store.delete(c.id);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
  },

  async trackEvent({ type, url, title, data }) {
    const database = await getDB();
    const event = {
      id: crypto.randomUUID(),
      type: type || 'page_view',
      url: url || '',
      title: title || '',
      data: data || {},
      timestamp: Date.now(),
    };
    const tx = database.transaction('tracking_events', 'readwrite');
    tx.objectStore('tracking_events').add(event);
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    return event;
  },

  async getTrackingEvents(limit = 100) {
    const database = await getDB();
    const tx = database.transaction('tracking_events', 'readonly');
    const store = tx.objectStore('tracking_events');
    return new Promise((resolve) => {
      const results = [];
      const r = store.openCursor(null, 'prev');
      let count = 0;
      r.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && count < limit) { results.push(cursor.value); count++; cursor.continue(); }
        else resolve(results);
      };
    });
  },

  async clearAll() {
    const database = await getDB();
    for (const name of ['documents', 'text_chunks', 'tracking_events']) {
      const tx = database.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
      await new Promise((resolve) => { tx.oncomplete = resolve; });
    }
  },

  async getStats() {
    const docs = await db.getAllDocuments();
    const tracking = await db.getTrackingEvents(999999);
    const totalSize = docs.reduce((s, d) => s + (d.size || 0), 0);
    return {
      totalDocuments: docs.length,
      totalSize,
      totalTrackingEvents: tracking.length,
      byType: docs.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {}),
    };
  },
};

if (typeof globalThis !== 'undefined') {
  globalThis.DocAgentDB = db;
}
