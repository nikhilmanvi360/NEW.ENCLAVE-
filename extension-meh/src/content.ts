// content.ts - Inline UI for LUMINA
console.log('LUMINA Content Script Active');

// 1. Create a container for our UI
const container = document.createElement('div');
container.id = 'lumina-extension-root';
document.body.appendChild(container);

// 2. Listen for messages from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'START_ANALYSIS') {
    showToast(`Analyzing: "${request.text.substring(0, 50)}..."`, 'loading');
  } else if (request.action === 'VERDICT_READY') {
    showVerdict(request.text, request.result);
  } else if (request.action === 'ANALYSIS_ERROR') {
    showToast(`Error: ${request.error}`, 'error');
  }
});

function showToast(message: string, type: 'loading' | 'error' | 'success' = 'loading') {
    let toast = document.getElementById('lumina-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lumina-toast';
        document.body.appendChild(toast);
    }

    toast.className = `lumina-toast lumina-toast-${type}`;
    toast.innerHTML = `
        <div class="lumina-toast-content">
            <span class="lumina-toast-icon">${type === 'loading' ? '⏳' : type === 'error' ? '❌' : '✅'}</span>
            <span class="lumina-toast-message">${message}</span>
        </div>
    `;
    
    toast.style.display = 'block';
    if (type !== 'loading') {
        setTimeout(() => {
            toast!.style.display = 'none';
        }, 5000);
    }
}

function showVerdict(claim: string, result: any) {
    const verdictColor = result.verdict === 'True' ? '#10b981' : result.verdict === 'False' ? '#ef4444' : '#f59e0b';
    
    showToast(`Verdict: ${result.verdict}`, 'success');

    // Create a more detailed floating card for the result
    const card = document.createElement('div');
    card.className = 'lumina-floating-card';
    card.innerHTML = `
        <div class="lumina-card-header" style="background: ${verdictColor}">
            <span class="lumina-card-title">LUMINA FORENSIC VERDICT</span>
            <span class="lumina-card-close">✕</span>
        </div>
        <div class="lumina-card-body">
            <div class="lumina-claim-box">"${claim.substring(0, 100)}${claim.length > 100 ? '...' : ''}"</div>
            <div class="lumina-verdict-text" style="color: ${verdictColor}">${result.verdict}</div>
            <div class="lumina-confidence">Confidence: ${(result.confidence * 100).toFixed(0)}%</div>
            <p class="lumina-reasoning">${result.short_reason}</p>
            <div class="lumina-card-footer">
                <a href="http://localhost:3000/?claim=${encodeURIComponent(claim)}" target="_blank">View Full Forensic Report →</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(card);
    
    card.querySelector('.lumina-card-close')?.addEventListener('click', () => {
        card.remove();
    });

    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (card.parentElement) card.remove();
    }, 15000);
}
