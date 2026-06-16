'use strict';

const adapters = {
  'asos.com': {
    // Verify these selectors in DevTools before shipping — ASOS uses dynamic class names
    carouselSelector: '[data-testid="product-image"] img, .product-hero__image img, [class*="product-image"] img',
    basketButtonSelector: '[data-testid="add-to-bag-button"], button[data-auto-id="add-to-bag"]',
    productPagePattern: /\/[a-z-]+\/prd\//i,
  },
  'newlook.com': {
    // Verify these selectors in DevTools before shipping
    carouselSelector: '.product-images img, .pdp-images img, [class*="productImage"] img',
    basketButtonSelector: '.add-to-bag, button[data-testid="addToBag"], .js-add-to-bag',
    productPagePattern: /\/p\//i,
  },
};

function getAdapter() {
  const host = location.hostname.replace('www.', '');
  for (const [domain, adapter] of Object.entries(adapters)) {
    if (host.includes(domain)) return adapter;
  }
  return null;
}

function isProductPage(adapter) {
  if (!adapter.productPagePattern) return true;
  return adapter.productPagePattern.test(location.pathname);
}

function findBasketButton(selector) {
  const els = document.querySelectorAll(selector);
  return els.length > 0 ? els[0] : null;
}

function findCarouselImages(selector) {
  const all = document.querySelectorAll(selector);
  const unique = [];
  const seen = new Set();
  all.forEach((img) => {
    const src = img.src || img.getAttribute('data-src') || '';
    if (src && !seen.has(src)) {
      seen.add(src);
      unique.push(img);
    }
  });
  return unique;
}

async function checkSetup() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CHECK_SETUP' }, resolve);
  });
}

function getGarmentImageUrl(imgEl) {
  // Prefer the highest-res src available
  const srcset = imgEl.srcset;
  if (srcset) {
    const entries = srcset.split(',').map((s) => {
      const [url, width] = s.trim().split(/\s+/);
      return { url, width: parseInt(width) || 0 };
    });
    entries.sort((a, b) => b.width - a.width);
    if (entries[0]?.url) return entries[0].url;
  }
  return imgEl.src || imgEl.getAttribute('data-src') || '';
}

async function startTryOn(btn, adapter) {
  const images = findCarouselImages(adapter.carouselSelector);
  if (images.length === 0) {
    console.warn('[IDM-VTON] No carousel images found');
    return;
  }

  setButtonState(btn, 'generating');

  // Replace all images with skeletons immediately
  const skeletons = images.map((img) => replaceImgWithSkeleton(img));

  // Process each image independently so results appear as they arrive
  const promises = images.map(async (img, index) => {
    const skeleton = skeletons[index];
    const garmentImageUrl = getGarmentImageUrl(img);
    if (!garmentImageUrl) {
      resolveSkeletonWithError(skeleton);
      return;
    }

    // poseIndex: 0=front, 1=back, 2+=front (per spec)
    const poseIndex = index === 1 ? 1 : 0;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GENERATE_TRYON', garmentImageUrl, poseIndex },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[IDM-VTON] Message error:', chrome.runtime.lastError);
            resolveSkeletonWithError(skeleton);
          } else if (response?.success && response.resultUrl) {
            resolveSkeletonWithResult(skeleton, response.resultUrl);
          } else {
            console.error('[IDM-VTON] Generation error:', response?.error);
            resolveSkeletonWithError(skeleton);
          }
          resolve();
        }
      );
    });
  });

  await Promise.allSettled(promises);
  setButtonState(btn, 'idle');
}

let currentBtn = null;

async function initPage() {
  const adapter = getAdapter();
  if (!adapter) return;
  if (!isProductPage(adapter)) return;

  // Wait a tick for SPA-rendered content
  await new Promise((r) => setTimeout(r, 800));

  const basketBtn = findBasketButton(adapter.basketButtonSelector);
  if (!basketBtn) return;

  const setup = await checkSetup();
  const isReady = setup?.hasApiKey && setup?.hasFrontPhoto;

  currentBtn = injectButton(basketBtn, async (btn) => {
    if (!isReady) return;
    await startTryOn(btn, adapter);
  });

  if (!isReady) {
    setButtonState(currentBtn, 'setup-required');
  } else {
    setButtonState(currentBtn, 'idle');
  }
}

function cleanup() {
  removeAllVtonElements();
  currentBtn = null;
}

// Expose for observer.js
window.__vtonInit = initPage;
window.__vtonCleanup = cleanup;

// Initial run
initPage();
