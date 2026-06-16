'use strict';

// Shared state accessible to content.js
window.__vtonState = {
  lastUrl: location.href,
  observerActive: false,
  debounceTimer: null,
};

function debounce(fn, ms) {
  return function (...args) {
    clearTimeout(window.__vtonState.debounceTimer);
    window.__vtonState.debounceTimer = setTimeout(() => fn.apply(this, args), ms);
  };
}

const handleMutation = debounce(() => {
  const currentUrl = location.href;
  if (currentUrl !== window.__vtonState.lastUrl) {
    window.__vtonState.lastUrl = currentUrl;
    if (typeof window.__vtonCleanup === 'function') window.__vtonCleanup();
    if (typeof window.__vtonInit === 'function') window.__vtonInit();
  }
}, 500);

function startObserver() {
  if (window.__vtonState.observerActive) return;
  window.__vtonState.observerActive = true;

  const observer = new MutationObserver(handleMutation);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start once body is available
if (document.body) {
  startObserver();
} else {
  document.addEventListener('DOMContentLoaded', startObserver);
}
