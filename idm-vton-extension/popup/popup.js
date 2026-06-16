'use strict';

const STORAGE_KEYS = {
  FRONT_PHOTO: 'referencePhotoFront',
  BACK_PHOTO: 'referencePhotoBack',
  API_KEY: 'replicateApiKey',
};

function $(id) { return document.getElementById(id); }

function showPreview(side, dataUrl) {
  const emptyEl = $(`empty-${side}`);
  const previewEl = $(`preview-${side}`);
  const thumbEl = $(`thumb-${side}`);
  emptyEl.hidden = true;
  previewEl.hidden = false;
  thumbEl.src = dataUrl;
}

function clearPreview(side) {
  const emptyEl = $(`empty-${side}`);
  const previewEl = $(`preview-${side}`);
  const thumbEl = $(`thumb-${side}`);
  emptyEl.hidden = false;
  previewEl.hidden = true;
  thumbEl.src = '';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function initPhotoSlot(side, storageKey) {
  const inner = $(`slot-inner-${side}`);
  const input = $(`input-${side}`);
  const removeBtn = $(`remove-${side}`);

  inner.addEventListener('click', () => input.click());

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await fileToBase64(file);
      showPreview(side, dataUrl);
      await chrome.storage.local.set({ [storageKey]: dataUrl });
    } catch (err) {
      console.error('Failed to save photo:', err);
    }
    input.value = '';
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPreview(side);
    chrome.storage.local.remove(storageKey);
  });
}

async function loadStoredPhotos() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.FRONT_PHOTO,
    STORAGE_KEYS.BACK_PHOTO,
    STORAGE_KEYS.API_KEY,
  ]);

  if (result[STORAGE_KEYS.FRONT_PHOTO]) {
    showPreview('front', result[STORAGE_KEYS.FRONT_PHOTO]);
  }
  if (result[STORAGE_KEYS.BACK_PHOTO]) {
    showPreview('back', result[STORAGE_KEYS.BACK_PHOTO]);
  }
  if (result[STORAGE_KEYS.API_KEY]) {
    $('api-key-input').value = result[STORAGE_KEYS.API_KEY];
  }
}

async function syncStatus() {
  const result = await chrome.storage.local.get(['tryOnStatus']);
  const status = result.tryOnStatus || 'ready';
  setStatus(status);
}

function setStatus(status) {
  const dot = $('status-dot');
  const label = $('status-label');
  dot.className = 'status-dot';

  const map = {
    ready: { cls: 'ready', text: 'Ready' },
    generating: { cls: 'generating', text: 'Generating…' },
    error: { cls: 'error', text: 'Error' },
  };

  const s = map[status] || map.ready;
  dot.classList.add(s.cls);
  label.textContent = s.text;
}

function initApiKey() {
  $('save-api-key').addEventListener('click', async () => {
    const key = $('api-key-input').value.trim();
    if (!key) return;
    await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: key });
    const statusEl = $('save-status');
    statusEl.hidden = false;
    setTimeout(() => { statusEl.hidden = true; }, 2500);
  });
}

function init() {
  initPhotoSlot('front', STORAGE_KEYS.FRONT_PHOTO);
  initPhotoSlot('back', STORAGE_KEYS.BACK_PHOTO);
  initApiKey();
  loadStoredPhotos();
  syncStatus();

  // Keep status in sync while popup is open
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.tryOnStatus) {
      setStatus(changes.tryOnStatus.newValue || 'ready');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
