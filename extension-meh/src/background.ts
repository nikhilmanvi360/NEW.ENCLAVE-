// background.ts - Service Worker for LUMINA Extension

console.log('LUMINA Background Service Worker Initialized');

const BACKEND_URL = 'http://localhost:3000/api/verify';

// 1. Create Context Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lumina-check-claim',
    title: 'Forensic Fact-Check: "%s"',
    contexts: ['selection']
  });
});

// 2. Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lumina-check-claim' && info.selectionText) {
    // We could open the popup or send a message to content script to show a toast
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'START_ANALYSIS', 
        text: info.selectionText 
      });
    }
    
    // Perform the actual verification in the background
    performVerification(info.selectionText).then(result => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { 
                action: 'VERDICT_READY', 
                text: info.selectionText,
                result: result
            });
        }
    }).catch(err => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { 
                action: 'ANALYSIS_ERROR', 
                text: info.selectionText,
                error: err.message
            });
        }
    });
  }
});

async function performVerification(claim: string) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim, domain: 'GENERAL' })
        });
        if (!response.ok) throw new Error('Backend server error');
        return await response.json();
    } catch (err) {
        console.error('Verification failed:', err);
        throw err;
    }
}

// 3. Handle Messages from Popup/Content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'VERIFY_CLAIM') {
        performVerification(request.claim)
            .then(res => sendResponse({ success: true, data: res }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
    }
});
