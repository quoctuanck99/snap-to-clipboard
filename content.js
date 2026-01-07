// Prevent double-injection
if (window.__region_capture_injected) {
  // toggle off if already present
  const existing = document.getElementById('region-capture-overlay');
  if (existing) existing.remove();
  window.__region_capture_injected = false;
} else {
  window.__region_capture_injected = true;

  const overlay = document.createElement('div');
  overlay.id = 'region-capture-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: 2147483647,
    cursor: 'crosshair',
    background: 'rgba(0,150,50,0.12)'
  });

  const selection = document.createElement('div');
  selection.id = 'region-capture-selection';
  Object.assign(selection.style, {
    position: 'absolute',
    border: '2px dashed #00a8ff',
    background: 'rgba(0,168,255,0.15)'
  });

  const banner = document.createElement('div');
  banner.id = 'region-capture-banner';
  banner.textContent = 'Capture mode — drag to select. Press Esc to cancel.';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    zIndex: 2147483647,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
  });

  overlay.appendChild(selection);
  overlay.appendChild(banner);
  document.documentElement.appendChild(overlay);

  let startX = 0, startY = 0, curX = 0, curY = 0, dragging = false;

  function updateSelection() {
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(startX - curX);
    const h = Math.abs(startY - curY);
    Object.assign(selection.style, {
      left: x + 'px',
      top: y + 'px',
      width: w + 'px',
      height: h + 'px'
    });
  }

  function cleanup() {
    overlay.remove();
    window.__region_capture_injected = false;
    window.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') cleanup();
  }

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    curX = startX;
    curY = startY;
    dragging = true;
    updateSelection();
  }, { passive: false });

  overlay.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    curX = e.clientX;
    curY = e.clientY;
    updateSelection();
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    curX = e.clientX;
    curY = e.clientY;
    updateSelection();

    const rect = selection.getBoundingClientRect();

    // Hide overlay so it does not appear in the captured image
    overlay.style.visibility = 'hidden';

    // Wait a frame for the hide to take effect, then request screenshot
    requestAnimationFrame(() => {
      // give an extra tick to ensure compositor updated
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: 'capture' }, async (resp) => {
          try {
            const dataUrl = resp && resp.dataUrl;
            if (!dataUrl) throw new Error('No screenshot returned');
            const img = new Image();
            img.src = dataUrl;
            await img.decode();

            const ratio = window.devicePixelRatio || 1;
            const sx = Math.round(rect.left * ratio);
            const sy = Math.round(rect.top * ratio);
            const sw = Math.round(rect.width * ratio);
            const sh = Math.round(rect.height * ratio);

            const c = document.createElement('canvas');
            c.width = sw;
            c.height = sh;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

            c.toBlob(async (blob) => {
              if (!blob) throw new Error('Failed to create blob');
              try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('Copied selection to clipboard');
              } catch (err) {
                console.error('Clipboard write failed', err);
                showToast('Copy failed: ' + err.message);
              }
            }, 'image/png');
          } catch (err) {
            console.error(err);
            showToast('Capture failed: ' + err.message);
          } finally {
            cleanup();
          }
        });
      }, 50);
    });
  });

  overlay.addEventListener('dblclick', () => cleanup());
  window.addEventListener('keydown', onKeyDown);

  function showToast(text) {
    const t = document.createElement('div');
    Object.assign(t.style, {
      position: 'fixed',
      left: '50%',
      bottom: '20px',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      zIndex: 2147483647
    });
    t.textContent = text;
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }
}
