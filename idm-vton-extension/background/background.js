'use strict';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const MODEL_PATH = 'cuuupid/idm-vton';
const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 120000;

const STORAGE_KEYS = {
  FRONT_PHOTO: 'referencePhotoFront',
  BACK_PHOTO: 'referencePhotoBack',
  API_KEY: 'replicateApiKey',
};

async function getStorageValues(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

async function setStatus(status) {
  return chrome.storage.local.set({ tryOnStatus: status });
}

async function createPrediction(apiKey, humanImgUrl, garmImgUrl) {
  const response = await fetch(`${REPLICATE_API_BASE}/models/${MODEL_PATH}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        human_img: humanImgUrl,
        garm_img: garmImgUrl,
        garment_des: 'clothing item',
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Replicate API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function pollPrediction(apiKey, predictionId) {
  const url = `${REPLICATE_API_BASE}/predictions/${predictionId}`;
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Poll failed: ${response.status}`);
    }

    const prediction = await response.json();

    if (prediction.status === 'succeeded') {
      const output = prediction.output;
      if (Array.isArray(output) && output.length > 0) return output[0];
      throw new Error('Prediction succeeded but output was empty');
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error || 'unknown error'}`);
    }
  }

  throw new Error('Prediction timed out after 120 seconds');
}

async function handleGenerateTryOn(message, sendResponse) {
  const { garmentImageUrl, poseIndex } = message;

  const storage = await getStorageValues([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.FRONT_PHOTO,
    STORAGE_KEYS.BACK_PHOTO,
  ]);

  const apiKey = storage[STORAGE_KEYS.API_KEY];
  if (!apiKey) {
    sendResponse({ success: false, error: 'API key not set' });
    return;
  }

  // poseIndex 1 uses back photo, everything else uses front
  const referencePhoto = (poseIndex === 1)
    ? storage[STORAGE_KEYS.BACK_PHOTO]
    : storage[STORAGE_KEYS.FRONT_PHOTO];

  if (!referencePhoto) {
    const missing = poseIndex === 1 ? 'back' : 'front';
    // Fall back to front if back is missing
    const fallback = storage[STORAGE_KEYS.FRONT_PHOTO];
    if (!fallback) {
      sendResponse({ success: false, error: 'Reference photos not set' });
      return;
    }
  }

  const humanImg = (poseIndex === 1 && storage[STORAGE_KEYS.BACK_PHOTO])
    ? storage[STORAGE_KEYS.BACK_PHOTO]
    : storage[STORAGE_KEYS.FRONT_PHOTO];

  try {
    await setStatus('generating');
    const prediction = await createPrediction(apiKey, humanImg, garmentImageUrl);
    const resultUrl = await pollPrediction(apiKey, prediction.id);
    await setStatus('ready');
    sendResponse({ success: true, resultUrl });
  } catch (err) {
    console.error('[IDM-VTON] Generation failed:', err);
    await setStatus('error');
    sendResponse({ success: false, error: err.message });
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GENERATE_TRYON') {
    handleGenerateTryOn(message, sendResponse);
    return true; // keep channel open for async response
  }

  if (message.type === 'CHECK_SETUP') {
    getStorageValues([STORAGE_KEYS.API_KEY, STORAGE_KEYS.FRONT_PHOTO]).then((storage) => {
      sendResponse({
        hasApiKey: !!storage[STORAGE_KEYS.API_KEY],
        hasFrontPhoto: !!storage[STORAGE_KEYS.FRONT_PHOTO],
      });
    });
    return true;
  }
});
