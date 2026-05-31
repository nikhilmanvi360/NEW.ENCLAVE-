// content.ts - Inline UI for LUMINA
console.log('LUMINA Content Script Active');

// 1. Create a container for our UI
const container = document.createElement('div');
container.id = 'lumina-extension-root';
document.body.appendChild(container);

// 2. Listen for messages from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'START_ANALYSIS') {
    showToast(`Analyzing: "${String(request.text || '').substring(0, 50)}..."`, 'loading');
  } else if (request.action === 'VERDICT_READY') {
    showVerdict(String(request.text || ''), request.result || {});
  } else if (request.action === 'ANALYSIS_ERROR') {
    showToast(`Error: ${String(request.error || 'Analysis failed')}`, 'error');
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
  toast.replaceChildren();

  const content = document.createElement('div');
  content.className = 'lumina-toast-content';

  const icon = document.createElement('span');
  icon.className = 'lumina-toast-icon';
  icon.textContent = type === 'loading' ? '⏳' : type === 'error' ? '❌' : '✅';

  const text = document.createElement('span');
  text.className = 'lumina-toast-message';
  text.textContent = message;

  content.append(icon, text);
  toast.append(content);

  toast.style.display = 'block';
  if (type !== 'loading') {
    setTimeout(() => {
      toast!.style.display = 'none';
    }, 5000);
  }
}

function showVerdict(claim: string, result: any) {
  const verdictColor = result.verdict === 'True' ? '#10b981' : result.verdict === 'False' ? '#ef4444' : '#f59e0b';

  showToast(`Verdict: ${String(result.verdict || 'Unknown')}`, 'success');

  // Build DOM nodes directly so page-selected text and model output are never parsed as HTML.
  const card = document.createElement('div');
  card.className = 'lumina-floating-card';

  const header = document.createElement('div');
  header.className = 'lumina-card-header';
  header.style.background = verdictColor;

  const title = document.createElement('span');
  title.className = 'lumina-card-title';
  title.textContent = 'LUMINA FORENSIC VERDICT';

  const close = document.createElement('span');
  close.className = 'lumina-card-close';
  close.textContent = '✕';

  header.append(title, close);

  const body = document.createElement('div');
  body.className = 'lumina-card-body';

  const claimBox = document.createElement('div');
  claimBox.className = 'lumina-claim-box';
  claimBox.textContent = `"${claim.substring(0, 100)}${claim.length > 100 ? '...' : ''}"`;

  const verdict = document.createElement('div');
  verdict.className = 'lumina-verdict-text';
  verdict.style.color = verdictColor;
  verdict.textContent = String(result.verdict || 'Unknown');

  const confidence = document.createElement('div');
  confidence.className = 'lumina-confidence';
  const confidenceValue = Number(result.confidence);
  confidence.textContent = `Confidence: ${Number.isFinite(confidenceValue) ? (confidenceValue * 100).toFixed(0) : '0'}%`;

  const reasoning = document.createElement('p');
  reasoning.className = 'lumina-reasoning';
  reasoning.textContent = String(result.short_reason || '');

  const footer = document.createElement('div');
  footer.className = 'lumina-card-footer';

  const reportLink = document.createElement('a');
  reportLink.href = `http://localhost:3000/?claim=${encodeURIComponent(claim)}`;
  reportLink.target = '_blank';
  reportLink.rel = 'noopener noreferrer';
  reportLink.textContent = 'View Full Forensic Report →';

  footer.append(reportLink);
  body.append(claimBox, verdict, confidence, reasoning, footer);
  card.append(header, body);

  document.body.appendChild(card);

  close.addEventListener('click', () => {
    card.remove();
  });

  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (card.parentElement) card.remove();
  }, 15000);
}
