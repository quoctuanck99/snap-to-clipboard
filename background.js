chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  const url = tab.url || '';
  // disallow injecting into chrome:// and other internal pages
  if (!/^https?:/.test(url) && !/^file:/.test(url)) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '',
      title: 'Region Capture',
      message: 'Capture mode is not available on this page (e.g. chrome:// pages). Open a regular webpage and try again.'
    });
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'capture') {
    const winId = sender.tab ? sender.tab.windowId : null;
    chrome.tabs.captureVisibleTab(winId, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true; // indicate async response
  }
});
