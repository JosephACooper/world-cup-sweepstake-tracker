'use strict';

const VTON_BUTTON_ID = 'vton-tryon-btn';
const VTON_SKELETON_CLASS = 'vton-skeleton';
const VTON_ERROR_CLASS = 'vton-error-state';

function injectButton(anchorEl, onClickCallback) {
  if (document.getElementById(VTON_BUTTON_ID)) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'vton-btn-wrapper';

  const btn = document.createElement('button');
  btn.id = VTON_BUTTON_ID;
  btn.innerHTML = `
    <span class="vton-btn-label">TRY IT ON</span>
    <span class="vton-btn-sub">Powered by AI</span>
  `;
  btn.addEventListener('click', () => onClickCallback(btn));

  wrapper.appendChild(btn);
  anchorEl.parentNode.insertBefore(wrapper, anchorEl);
  return btn;
}

function setButtonState(btn, state) {
  if (!btn) return;
  const label = btn.querySelector('.vton-btn-label');
  if (!label) return;

  switch (state) {
    case 'idle':
      label.textContent = 'TRY IT ON';
      btn.disabled = false;
      btn.classList.remove('vton-btn--generating', 'vton-btn--disabled');
      break;
    case 'generating':
      label.textContent = 'GENERATING…';
      btn.disabled = true;
      btn.classList.add('vton-btn--generating');
      break;
    case 'setup-required':
      label.textContent = 'SET UP IN SETTINGS';
      btn.disabled = true;
      btn.classList.add('vton-btn--disabled');
      break;
  }
}

function createSkeleton(width, height) {
  const skeleton = document.createElement('div');
  skeleton.className = VTON_SKELETON_CLASS;
  if (width) skeleton.style.width = `${width}px`;
  if (height) skeleton.style.height = `${height}px`;
  return skeleton;
}

function createErrorState(width, height) {
  const el = document.createElement('div');
  el.className = VTON_ERROR_CLASS;
  if (width) el.style.width = `${width}px`;
  if (height) el.style.height = `${height}px`;
  el.innerHTML = `
    <span class="vton-error-icon">×</span>
    <span class="vton-error-text">Generation failed</span>
  `;
  return el;
}

function replaceImgWithSkeleton(imgEl) {
  const rect = imgEl.getBoundingClientRect();
  const width = imgEl.naturalWidth || rect.width || imgEl.width || 400;
  const height = imgEl.naturalHeight || rect.height || imgEl.height || 500;

  const skeleton = createSkeleton(width, height);

  // Mirror the img's sizing attributes so layout doesn't shift
  skeleton.style.width = imgEl.style.width || (imgEl.getAttribute('width') ? `${imgEl.getAttribute('width')}px` : '100%');
  skeleton.style.height = imgEl.style.height || (imgEl.getAttribute('height') ? `${imgEl.getAttribute('height')}px` : 'auto');
  skeleton.style.aspectRatio = imgEl.style.aspectRatio || `${width} / ${height}`;

  skeleton._originalImg = imgEl;
  imgEl.parentNode.insertBefore(skeleton, imgEl);
  imgEl.style.display = 'none';

  return skeleton;
}

function resolveSkeletonWithResult(skeleton, resultUrl) {
  const img = skeleton._originalImg;
  if (!img) return;
  img.src = resultUrl;
  img.style.display = '';
  skeleton.remove();
}

function resolveSkeletonWithError(skeleton) {
  const img = skeleton._originalImg;
  if (!img) return;

  const error = createErrorState(
    skeleton.offsetWidth || undefined,
    skeleton.offsetHeight || undefined
  );
  error.style.width = skeleton.style.width;
  error.style.height = skeleton.style.height;
  error.style.aspectRatio = skeleton.style.aspectRatio;

  skeleton.parentNode.insertBefore(error, skeleton);
  skeleton.remove();
  img.style.display = 'none';
}

function removeAllVtonElements() {
  document.getElementById('vton-btn-wrapper')?.remove();
  document.querySelectorAll(`.${VTON_SKELETON_CLASS}`).forEach((el) => {
    const img = el._originalImg;
    if (img) img.style.display = '';
    el.remove();
  });
  document.querySelectorAll(`.${VTON_ERROR_CLASS}`).forEach((el) => el.remove());
  document.querySelectorAll('[data-vton-modified]').forEach((img) => {
    img.removeAttribute('data-vton-modified');
  });
}
