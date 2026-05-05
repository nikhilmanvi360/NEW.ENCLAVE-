import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import {fileURLToPath} from 'url';
import {createServer as createViteServer} from 'vite';
import {
  type AgentResult,
  type AgentRole,
  type SearchResult,
  normalizeEvidenceProcessingResult,
  normalizeAgentResult,
  normalizeJudgeResult,
} from './src/shared/aiSchema';

dotenv.config({path: '.env.local'});
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);

const geminiKey = process.env.GEMINI_API_KEY || '';
const groqKey = process.env.GROQ_API_KEY || '';
const openrouterKey = process.env.OPENROUTER_API_KEY || '';

const genAI = new GoogleGenAI({apiKey: geminiKey});
const groq = new OpenAI({
  apiKey: groqKey,
  baseURL: 'https://api.groq.com/openai/v1',
});
const openrouter = new OpenAI({
  apiKey: openrouterKey,
  baseURL: 'https://openrouter.ai/api/v1',
});

const MODELS = {
  SKEPTIC: 'llama-3.3-70b-versatile',
  SUPPORTER: 'llama-3.1-8b-instant',
  ANALYST: 'google/gemini-2.5-flash-lite',
  JUDGE: 'gemini-2.5-flash',
} as const;

const SKEPTIC_PROMPT = `You are Agent A: The Skeptic (powered by Meta Llama 3.3). Your role is to CHALLENGE the claim.
Use the provided Wikipedia evidence for background context, then use broader live web results to find counter-evidence, logical fallacies, and credible dissenting views. Wikipedia is useful for orientation, but do not treat it as the only decisive source for contentious, medical, legal, or breaking-news claims. Prefer official, academic, scientific, and reputable news sources when resolving conflicts.
Output ONLY a JSON object:
{
  "agent": "Skeptic",
  "stance": "AGAINST",
  "confidence": 0-100,
  "main_argument": "...",
  "evidence": [{"title": "...", "source": "...", "url": "https://...", "finding": "..."}],
  "search_results": [{"title": "...", "source": "...", "url": "https://...", "snippet": "..."}],
  "weakness_of_claim": "..."
}`;

const SUPPORTER_PROMPT = `You are Agent B: The Supporter (powered by Meta Llama 3.1). Your role is to DEFEND the claim.
Use the provided Wikipedia evidence for background context, then use broader live web results to find validating evidence, context, and credible supporting views. Wikipedia is useful for orientation, but do not treat it as the only decisive source for contentious, medical, legal, or breaking-news claims. Prefer official, academic, scientific, and reputable news sources when resolving conflicts.
Output ONLY a JSON object:
{
  "agent": "Supporter",
  "stance": "FOR",
  "confidence": 0-100,
  "main_argument": "...",
  "evidence": [{"title": "...", "source": "...", "url": "https://...", "finding": "..."}],
  "search_results": [{"title": "...", "source": "...", "url": "https://...", "snippet": "..."}],
  "strongest_point": "..."
}`;

const ANALYST_PROMPT = `You are Agent C: The Analyst (powered by Google Gemini via OpenRouter). Your role is to OBJECTIVELY analyze data.
Use the provided Wikipedia evidence for background context, then use broader live web results to analyze factual, peer-reviewed data and scientific consensus. Wikipedia is useful for orientation, but do not treat it as the only decisive source for contentious, medical, legal, or breaking-news claims. Prefer official, academic, scientific, and reputable news sources when resolving conflicts.
Output ONLY a JSON object:
{
  "agent": "Analyst",
  "stance": "NEUTRAL",
  "factual_accuracy_score": 0-100,
  "main_analysis": "...",
  "evidence": [{"title": "...", "source": "...", "url": "https://...", "finding": "..."}],
  "search_results": [{"title": "...", "source": "...", "url": "https://...", "snippet": "..."}],
  "verdict_hint": "...",
  "key_context": "..."
}`;

const JUDGE_PROMPT = `You are the Judge (powered by Google Gemini). Evaluate arguments from Skeptic, Supporter, and Analyst.
Resolve conflicts and produce a FINAL VERDICT. Some agents may have failed; use the completed agent results and lower confidence when evidence coverage is incomplete.
Output ONLY a JSON object:
{
  "verdict": "TRUE | FALSE | MISLEADING | UNVERIFIED",
  "confidence_score": 0-100,
  "confidence_reasoning": "...",
  "final_summary": "...",
  "key_evidence": ["...", "..."],
  "agent_agreement": "UNANIMOUS | MAJORITY | SPLIT",
  "minority_view": "...",
  "verdict_color": "green | red | yellow | grey"
}`;

const EVIDENCE_PROCESSOR_PROMPT = `You are an Evidence Processing Engine in an AI orchestration system.

Your job is to transform raw retrieved data into structured, high-quality evidence that can be used by reasoning agents and a judge model.

You MUST clean, filter, score, and label evidence in a consistent and reliable format.

PROCESSING PIPELINE:
1. Clean and filter irrelevant, duplicate, or vague evidence. Keep only evidence clearly related to the claim. Limit to MAX 5 evidence items.
2. Summarize each evidence item into a concise 1-2 line factual summary.
3. Score relevance from 0 to 1. Discard evidence below 0.5.
4. Classify stance as "supports", "contradicts", or "neutral".
5. Score credibility from 1 to 10. Government, scientific, peer-reviewed sources are 9-10. Wikipedia and reputed organizations are 7-8. General websites are 5-6. Weak sources are below 5.
6. Ensure diversity when available. If all useful evidence is one-sided, set biased_evidence to true.
7. Generate aggregate counts and overall strength.

Output ONLY valid JSON:
{
  "processed_evidence": [
    {
      "summary": "...",
      "source": "...",
      "relevance": 0.0,
      "stance": "supports | contradicts | neutral",
      "credibility": 0
    }
  ],
  "evidence_summary": {
    "support_count": 0,
    "contradict_count": 0,
    "neutral_count": 0,
    "average_credibility": 0.0,
    "overall_strength": "Strong | Moderate | Weak",
    "biased_evidence": false
  }
}

Do NOT hallucinate beyond the supplied evidence.`;

function getPromptByRole(role: AgentRole) {
  switch (role) {
    case 'SKEPTIC':
      return SKEPTIC_PROMPT;
    case 'SUPPORTER':
      return SUPPORTER_PROMPT;
    case 'ANALYST':
      return ANALYST_PROMPT;
  }
}

function parseJsonResponse(text: string) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace >= firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;

  return JSON.parse(jsonText);
}

function requireApiKey(key: string, name: string) {
  if (!key) {
    throw new Error(`${name} is not configured. Add it to .env.local and restart the server.`);
  }
}

function buildSearchQuery(role: AgentRole, claim: string) {
  const focus = {
    SKEPTIC: 'counter evidence fact check criticism',
    SUPPORTER: 'supporting evidence official source',
    ANALYST: 'scientific consensus official data',
  }[role];

  return `${claim} ${focus}`;
}

async function searchWeb(query: string): Promise<SearchResult[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MultiAgentTruthEngine/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Live search failed with status ${response.status}`);
  }

  const html = await response.text();
  const results: SearchResult[] = [];
  const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;

  while ((match = resultPattern.exec(html)) && results.length < 6) {
    const resultUrl = normalizeSearchUrl(decodeHtml(match[1]));
    if (!resultUrl) continue;

    results.push({
      title: stripHtml(match[2]),
      url: resultUrl,
      snippet: stripHtml(match[3]),
      source: getHostname(resultUrl),
    });
  }

  return dedupeSearchResults(results);
}

async function searchWikipedia(claim: string): Promise<SearchResult[]> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('srlimit', '4');
  url.searchParams.set('srsearch', claim);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MultiAgentTruthEngine/1.0 (local research app)',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia search failed with status ${response.status}`);
  }

  const payload = await response.json() as {
    query?: {
      search?: Array<{
        title?: string;
        snippet?: string;
      }>;
    };
  };

  return (payload.query?.search || [])
    .filter((item) => item.title)
    .map((item) => {
      const title = item.title || '';
      return {
        title: `Wikipedia: ${title}`,
        source: 'Wikipedia',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        snippet: stripHtml(item.snippet || ''),
      };
    });
}

function formatSearchResults(results: SearchResult[]) {
  if (results.length === 0) {
    return 'No live search results were available. Be explicit about uncertainty.';
  }

  return results.map((result, index) => (
    `${index + 1}. ${result.title}\nSource: ${result.source || result.url}\nURL: ${result.url || 'Unavailable'}\nSnippet: ${result.snippet || 'No snippet available'}`
  )).join('\n\n');
}

function normalizeSearchUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl, 'https://duckduckgo.com');
    const redirected = parsed.searchParams.get('uddg');
    return redirected ? decodeURIComponent(redirected) : parsed.href;
  } catch {
    return undefined;
  }
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function dedupeSearchResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.url || result.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function callGemini(model: string, systemInstruction: string, prompt: string, useSearch = false) {
  requireApiKey(geminiKey, 'GEMINI_API_KEY');

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      tools: useSearch ? [{googleSearch: {}}] : [],
      temperature: 0.2,
    },
  });

  return parseJsonResponse(response.text || '{}');
}

async function callOpenAICompatible(
  client: OpenAI,
  model: string,
  systemInstruction: string,
  prompt: string,
) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {role: 'system', content: systemInstruction},
      {role: 'user', content: prompt},
    ],
    temperature: 0.2,
    response_format: {type: 'json_object'},
  });

  return parseJsonResponse(response.choices[0].message.content || '{}');
}

async function processEvidence(claim: string, rawEvidence: SearchResult[]) {
  const rawForPrompt = rawEvidence.map((item) => ({
    text: `${item.title}. ${item.snippet || ''}`.trim(),
    source: item.url || item.source || item.title,
  }));

  if (rawForPrompt.length === 0) {
    return normalizeEvidenceProcessingResult({});
  }

  const prompt = JSON.stringify({
    claim,
    raw_evidence: rawForPrompt,
  });

  const processed = normalizeEvidenceProcessingResult(
    await callGemini(MODELS.JUDGE, EVIDENCE_PROCESSOR_PROMPT, prompt, false),
  );

  return processed.processed_evidence.length > 0
    ? processed
    : fallbackProcessEvidence(claim, rawEvidence);
}

function fallbackProcessEvidence(claim: string, rawEvidence: SearchResult[]) {
  const claimTerms = new Set(
    claim
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 3),
  );

  const processed = dedupeSearchResults(rawEvidence)
    .map((item) => {
      const text = `${item.title} ${item.snippet || ''}`.trim();
      const lowerText = text.toLowerCase();
      const overlap = [...claimTerms].filter((term) => lowerText.includes(term)).length;
      const relevance = Math.min(1, Math.max(0.5, overlap / Math.max(1, claimTerms.size)));

      return {
        summary: summarizeRawEvidence(text),
        source: item.url || item.source || item.title,
        relevance,
        stance: classifyFallbackStance(lowerText),
        credibility: scoreSourceCredibility(item.url || item.source || item.title),
      };
    })
    .filter((item) => item.summary && item.relevance >= 0.5)
    .sort((a, b) => (b.relevance + b.credibility / 10) - (a.relevance + a.credibility / 10))
    .slice(0, 5);

  return normalizeEvidenceProcessingResult({
    processed_evidence: processed,
    evidence_summary: {},
  });
}

function summarizeRawEvidence(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function classifyFallbackStance(text: string): 'supports' | 'contradicts' | 'neutral' {
  if (/\b(false|myth|hoax|debunk|incorrect|no evidence|not true|contradict|refute)\b/.test(text)) {
    return 'contradicts';
  }

  if (/\b(confirm|confirmed|supports|evidence|developed|discovered|causes|shows|found)\b/.test(text)) {
    return 'supports';
  }

  return 'neutral';
}

function scoreSourceCredibility(source: string) {
  const lower = source.toLowerCase();
  if (lower.includes('.gov') || lower.includes('.edu') || lower.includes('nih.gov') || lower.includes('who.int') || lower.includes('nature.com') || lower.includes('science.org')) {
    return 9;
  }
  if (lower.includes('wikipedia.org') || lower === 'wikipedia') {
    return 8;
  }
  if (lower.includes('reuters.com') || lower.includes('apnews.com') || lower.includes('bbc.com') || lower.includes('britannica.com')) {
    return 7;
  }
  return 6;
}

async function callAgent(role: AgentRole, claim: string) {
  const model = MODELS[role];
  const [wikipediaResults, webResults] = await Promise.all([
    searchWikipedia(claim).catch((error) => {
      console.error('Wikipedia evidence collection failed:', error);
      return [] satisfies SearchResult[];
    }),
    searchWeb(buildSearchQuery(role, claim)).catch((error) => {
    console.error('Live search failed:', error);
    return [] satisfies SearchResult[];
    }),
  ]);
  const searchResults = dedupeSearchResults([...wikipediaResults, ...webResults]).slice(0, 10);
  const processedEvidence = await processEvidence(claim, searchResults).catch((error) => {
    console.error('Evidence processing failed:', error);
    return normalizeEvidenceProcessingResult({});
  });
  const prompt = `Analyze this claim: "${claim}"

Wikipedia evidence collection:
${formatSearchResults(wikipediaResults)}

Live web search query: ${buildSearchQuery(role, claim)}

Broader live web search results:
${formatSearchResults(webResults)}

Processed evidence:
${JSON.stringify(processedEvidence)}

Use processed evidence as the primary evidence set. Use Wikipedia for background and definitions, then corroborate against broader live search results. If you cite a source, copy its URL into evidence.url. Also return the most relevant collected sources in search_results.`;
  const withSearchResults = (raw: unknown) => ({
    ...(typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}),
    search_results: searchResults,
    processed_evidence: processedEvidence.processed_evidence,
    evidence_summary: processedEvidence.evidence_summary,
  });

  if (model.includes('/')) {
    requireApiKey(openrouterKey, 'OPENROUTER_API_KEY');
    return normalizeAgentResult(withSearchResults(await callOpenAICompatible(openrouter, model, getPromptByRole(role), prompt)), role);
  }

  if (model.includes('gemini')) {
    return normalizeAgentResult(withSearchResults(await callGemini(model, getPromptByRole(role), prompt, true)), role);
  }

  requireApiKey(groqKey, 'GROQ_API_KEY');
  return normalizeAgentResult(withSearchResults(await callOpenAICompatible(groq, model, getPromptByRole(role), prompt)), role);
}

async function callJudge(claim: string, agents: AgentResult[]) {
  const prompt = `
Claim: "${claim}"
Agent results: ${JSON.stringify(agents)}
  `;

  return normalizeJudgeResult(await callGemini(MODELS.JUDGE, JUDGE_PROMPT, prompt, false));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected server error.';
}

const app = express();
app.use(express.json({limit: '1mb'}));

app.post('/api/agent', async (req, res) => {
  try {
    const {role, claim} = req.body as {role?: AgentRole; claim?: string};
    if (!role || !['SKEPTIC', 'SUPPORTER', 'ANALYST'].includes(role) || !claim?.trim()) {
      res.status(400).json({error: 'A valid role and claim are required.'});
      return;
    }

    res.json(await callAgent(role, claim.trim()));
  } catch (error) {
    console.error('Agent request failed:', error);
    res.status(500).json({error: getErrorMessage(error)});
  }
});

app.post('/api/judge', async (req, res) => {
  try {
    const {claim, agents} = req.body as {
      claim?: string;
      agents?: AgentResult[];
    };

    if (!claim?.trim() || !Array.isArray(agents) || agents.length < 2) {
      res.status(400).json({error: 'Claim and at least two agent results are required.'});
      return;
    }

    res.json(await callJudge(claim.trim(), agents));
  } catch (error) {
    console.error('Judge request failed:', error);
    res.status(500).json({error: getErrorMessage(error)});
  }
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: {middlewareMode: true},
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Multi-Agent Truth Engine running at http://localhost:${port}`);
});
