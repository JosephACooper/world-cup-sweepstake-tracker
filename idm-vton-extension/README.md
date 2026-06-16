# IDM-VTON Chrome Extension

Virtual clothing try-on for ASOS and Newlook, powered by [cuuupid/idm-vton](https://replicate.com/cuuupid/idm-vton) via Replicate.

## Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `idm-vton-extension/` folder

## Setup

1. Click the extension icon in the toolbar
2. Upload a **Front** reference photo of yourself
3. Upload a **Back** reference photo (optional — falls back to front)
4. Paste your [Replicate API key](https://replicate.com/account/api-tokens) and click **Save**

## Usage

Navigate to any product page on ASOS or Newlook. A **TRY IT ON** button appears above the add-to-bag button. Click it — product carousel images are replaced with AI-generated versions showing you wearing the garment.

## Selector Verification

The site adapter selectors in `content/content.js` are placeholders and **must be verified** against live sites using Chrome DevTools before the extension will work reliably. Open a product page, inspect the carousel images and add-to-bag button, and update the `adapters` object accordingly.

## File Structure

```
idm-vton-extension/
├── manifest.json
├── popup/
│   ├── popup.html       # Settings UI
│   ├── popup.js
│   └── popup.css
├── content/
│   ├── content.js       # Main injection logic + site adapters
│   ├── observer.js      # MutationObserver for SPA navigation
│   └── ui.js            # Button + skeleton UI helpers
├── background/
│   └── background.js    # Replicate API calls + polling
├── styles/
│   └── injected.css     # Styles injected into product pages
└── assets/
    └── icon*.png
```
