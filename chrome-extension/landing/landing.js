(function() {
  const extendBtn = document.getElementById('extendBtn');
  const learnBtn = document.getElementById('learnBtn');

  extendBtn?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
    } else {
      const el = document.createElement('a');
      el.href = 'https://chrome.google.com/webstore';
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.click();
    }
  });

  learnBtn?.addEventListener('click', () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      q.parentElement.classList.toggle('open');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.querySelector(a.getAttribute('href'));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const isChromeExt = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  if (isChromeExt) {
    extendBtn.textContent = '📋 Open DocAgent';
    extendBtn.querySelector('.btn-badge')?.remove();
  }
})();
