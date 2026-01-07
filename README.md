# SnapToClipboard - Region Capture to Clipboard

This Chrome extension lets you click the toolbar button, draw a rectangle on the page, and automatically copy the selected region as an image to the clipboard.

Install (developer mode):

1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this folder.
4. Click the extension icon to start a capture, drag to select, release to copy.

Notes:
- Uses `chrome.tabs.captureVisibleTab` so it captures the visible viewport.
- Coordinates are adjusted for `devicePixelRatio` and `window.scrollY`.
- If clipboard write fails, check Chrome permissions and that the page allows clipboard access.

Limitations:
- This extension cannot run on Chrome internal pages (URLs starting with `chrome://`), the Web Store, or other privileged pages. Chrome prevents content script injection there. Load a normal `http(s)://` page to use the capture.
