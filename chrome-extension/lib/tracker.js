(() => {
  const TRACKING_KEY = 'docagent_tracking_enabled';
  const PAGE_TIMERS = new Map();

  function isEnabled() {
    return localStorage.getItem(TRACKING_KEY) !== 'false';
  }

  function setEnabled(val) {
    localStorage.setItem(TRACKING_KEY, val ? 'true' : 'false');
  }

  async function track(type, data = {}) {
    if (!isEnabled()) return;
    try {
      await globalThis.DocAgentDB?.trackEvent({
        type,
        url: location?.href || '',
        title: document?.title || '',
        data: { ...data, timestamp: Date.now() },
      });
    } catch {}
  }

  function trackPageView() {
    track('page_view', {
      referrer: document?.referrer || '',
      language: navigator?.language || '',
      userAgent: navigator?.userAgent?.slice(0, 200) || '',
      viewport: `${window?.innerWidth || 0}x${window?.innerHeight || 0}`,
    });
  }

  function trackClick(e) {
    const el = e.target;
    const text = el?.textContent?.trim()?.slice(0, 100) || '';
    const tag = el?.tagName || '';
    const id = el?.id || '';
    const cls = el?.className?.toString()?.slice(0, 100) || '';
    track('click', { tag, id, class: cls, text });
  }

  function trackScroll() {
    const scrollPct = Math.round(
      ((window?.scrollY || 0) / (document?.documentElement?.scrollHeight - window?.innerHeight || 1)) * 100
    );
    if (scrollPct > 0 && scrollPct % 25 === 0) {
      track('scroll', { percentage: scrollPct });
    }
  }

  function trackSelection() {
    const sel = window?.getSelection()?.toString()?.trim();
    if (sel && sel.length > 10) {
      track('selection', { length: sel.length, preview: sel.slice(0, 100) });
    }
  }

  function trackFileUpload(e) {
    const files = e?.target?.files || [];
    for (const f of files) {
      track('file_upload', {
        name: f.name,
        type: f.type,
        size: f.size,
      });
    }
  }

  function trackFileDownload(url, filename) {
    track('file_download', { url: url || '', filename: filename || '' });
  }

  let pageStart = Date.now();

  function trackTimeOnPage() {
    const elapsed = Math.round((Date.now() - pageStart) / 1000);
    if (elapsed > 5) {
      track('time_on_page', { seconds: elapsed });
    }
  }

  function initTracker() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    trackPageView();

    document.addEventListener('click', trackClick, true);
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('selectionchange', trackSelection);

    document.addEventListener('change', (e) => {
      if (e.target?.type === 'file') trackFileUpload(e);
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        PAGE_TIMERS.set('end', Date.now());
        trackTimeOnPage();
      } else {
        pageStart = Date.now();
      }
    });

    window.addEventListener('beforeunload', () => {
      trackTimeOnPage();
    });

    const origFetch = window.fetch;
    window.fetch = function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (url.includes('download') || url.includes('.pdf') || url.includes('.doc')) {
        track('fetch_download', { url: url.slice(0, 300) });
      }
      return origFetch.apply(this, args);
    };
  }

  const api = {
    track, isEnabled, setEnabled,
    init: initTracker,
    trackPageView, trackClick, trackFileUpload, trackFileDownload,
  };

  if (typeof globalThis !== 'undefined') {
    globalThis.DocAgentTracker = api;
  }

  if (document?.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }

  return api;
})();
