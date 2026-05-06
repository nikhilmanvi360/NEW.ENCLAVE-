import {z} from 'zod';

const text = z.string().trim().catch('');

export const evidenceSchema = z.object({
  title: text.optional(),
  source: text,
  url: z.string().trim().url().optional().catch(undefined),
  finding: text,
});

export const searchResultSchema = z.object({
  title: text,
  url: z.string().trim().url().optional().catch(undefined),
  snippet: text.optional(),
  source: text.optional(),
});

export const processedEvidenceSchema = z.object({
  summary: text,
  source: text,
  relevance: z.coerce.number().min(0).max(1).catch(0),
  stance: z.enum(['supports', 'contradicts', 'neutral']).catch('neutral'),
  credibility: z.coerce.number().min(1).max(10).catch(5),
});

export const evidenceSummarySchema = z.object({
  support_count: z.coerce.number().int().min(0).catch(0),
  contradict_count: z.coerce.number().int().min(0).catch(0),
  neutral_count: z.coerce.number().int().min(0).catch(0),
  average_credibility: z.coerce.number().min(0).max(10).catch(0),
  overall_strength: z.enum(['Strong', 'Moderate', 'Weak']).catch('Weak'),
  biased_evidence: z.boolean().catch(false),
});

export const evidenceProcessingResultSchema = z.object({
  processed_evidence: z.array(processedEvidenceSchema).max(5).catch([]),
  evidence_summary: evidenceSummarySchema.catch({
    support_count: 0,
    contradict_count: 0,
    neutral_count: 0,
    average_credibility: 0,
    overall_strength: 'Weak',
    biased_evidence: false,
  }),
});

export const agentResultSchema = z.object({
  agent: z.enum(['Skeptic', 'Supporter', 'Analyst']).catch('Analyst'),
  stance: z.enum(['AGAINST', 'FOR', 'NEUTRAL', 'FAILED']).catch('NEUTRAL'),
  confidence: z.coerce.number().min(0).max(100).optional().catch(undefined),
  factual_accuracy_score: z.coerce.number().min(0).max(100).optional().catch(undefined),
  main_argument: text.optional(),
  main_analysis: text.optional(),
  evidence: z.array(evidenceSchema).catch([]),
  search_results: z.array(searchResultSchema).catch([]),
  processed_evidence: z.array(processedEvidenceSchema).catch([]),
  evidence_summary: evidenceSummarySchema.optional().catch(undefined),
  weakness_of_claim: text.optional(),
  strongest_point: text.optional(),
  verdict_hint: z.enum(['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED']).optional().catch(undefined),
  key_context: text.optional(),
  logical_fallacies: z.array(text).catch([]),
  debunking_sources: z.array(evidenceSchema).catch([]),
  caveats: z.array(text).catch([]),
  partial_support_score: z.coerce.number().min(0).max(100).optional().catch(undefined),
  domain: text.optional(),
  consensus_exists: z.boolean().optional().catch(undefined),
  consensus_summary: text.optional(),
  crux_of_dispute: text.optional(),
  error: text.optional(),
});

export const judgeResultSchema = z.object({
  verdict: z.enum(['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED']).catch('UNVERIFIED'),
  confidence_score: z.coerce.number().min(0).max(100).catch(0),
  confidence_reasoning: text.catch('The judge could not provide confidence reasoning.'),
  final_summary: text.catch('The available evidence was insufficient for a complete verdict.'),
  key_evidence: z.array(z.string()).catch([]),
  agent_agreement: z.enum(['UNANIMOUS', 'MAJORITY', 'SPLIT']).catch('SPLIT'),
  minority_view: text.optional(),
  verdict_color: z.enum(['green', 'red', 'yellow', 'grey']).catch('grey'),
});

export type Evidence = z.infer<typeof evidenceSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type ProcessedEvidence = z.infer<typeof processedEvidenceSchema>;
export type EvidenceSummary = z.infer<typeof evidenceSummarySchema>;
export type EvidenceProcessingResult = z.infer<typeof evidenceProcessingResultSchema>;
export type AgentResult = z.infer<typeof agentResultSchema>;
export type JudgeResult = z.infer<typeof judgeResultSchema>;
export type AgentRole = 'SKEPTIC' | 'SUPPORTER' | 'ANALYST';

const roleDefaults: Record<AgentRole, Pick<AgentResult, 'agent' | 'stance'>> = {
  SKEPTIC: {agent: 'Skeptic', stance: 'AGAINST'},
  SUPPORTER: {agent: 'Supporter', stance: 'FOR'},
  ANALYST: {agent: 'Analyst', stance: 'NEUTRAL'},
};

export function normalizeAgentResult(raw: unknown, role: AgentRole): AgentResult {
  const fallback = roleDefaults[role];
  const parsed = agentResultSchema.parse({
    ...fallback,
    ...(isRecord(raw) ? raw : {}),
  });

  return {
    ...parsed,
    agent: fallback.agent,
    stance: parsed.stance === 'FAILED' ? fallback.stance : parsed.stance,
    evidence: parsed.evidence.filter((item) => item.finding || item.source || item.url),
    search_results: parsed.search_results.filter((item) => item.title || item.url || item.snippet),
    processed_evidence: parsed.processed_evidence.filter((item) => item.relevance >= 0.5 && item.summary),
  };
}

export function normalizeEvidenceProcessingResult(raw: unknown): EvidenceProcessingResult {
  const parsed = evidenceProcessingResultSchema.parse(isRecord(raw) ? raw : {});
  const processed = parsed.processed_evidence
    .filter((item) => item.relevance >= 0.5 && item.summary)
    .slice(0, 5);

  const supportCount = processed.filter((item) => item.stance === 'supports').length;
  const contradictCount = processed.filter((item) => item.stance === 'contradicts').length;
  const neutralCount = processed.filter((item) => item.stance === 'neutral').length;
  const averageCredibility = processed.length
    ? Number((processed.reduce((sum, item) => sum + item.credibility, 0) / processed.length).toFixed(1))
    : 0;

  return {
    processed_evidence: processed,
    evidence_summary: {
      ...parsed.evidence_summary,
      support_count: supportCount,
      contradict_count: contradictCount,
      neutral_count: neutralCount,
      average_credibility: averageCredibility,
      biased_evidence: processed.length > 0 && (supportCount === 0 || contradictCount === 0),
      overall_strength: getOverallStrength(processed.length, averageCredibility),
    },
  };
}

export function normalizeJudgeResult(raw: unknown): JudgeResult {
  const parsed = judgeResultSchema.parse(isRecord(raw) ? raw : {});

  // Fix: If model returned confidence in 0-1 range, scale to 0-100
  let confidence = parsed.confidence_score;
  if (confidence > 0 && confidence <= 1) {
    confidence = Math.round(confidence * 100);
  }
  // Clamp to valid range
  confidence = Math.min(100, Math.max(0, Math.round(confidence)));

  // Fix: Infer verdict_color if model returned 'grey' (default catch) but verdict is known
  let verdictColor = parsed.verdict_color;
  if (verdictColor === 'grey' && parsed.verdict !== 'UNVERIFIED') {
    verdictColor = parsed.verdict === 'TRUE' ? 'green'
      : parsed.verdict === 'FALSE' ? 'red'
      : 'yellow';
  }

  return {
    ...parsed,
    confidence_score: confidence,
    verdict_color: verdictColor,
    key_evidence: parsed.key_evidence.filter(Boolean),
  };
}

export function createFailedAgentResult(role: AgentRole, message: string): AgentResult {
  const fallback = roleDefaults[role];
  return {
    ...fallback,
    stance: 'FAILED',
    evidence: [],
    search_results: [],
    processed_evidence: [],
    evidence_summary: {
      support_count: 0,
      contradict_count: 0,
      neutral_count: 0,
      average_credibility: 0,
      overall_strength: 'Weak',
      biased_evidence: false,
    },
    error: message,
    main_argument: `${fallback.agent} could not complete this run.`,
    main_analysis: `${fallback.agent} could not complete this run.`,
    key_context: 'The judge will evaluate the remaining completed agent results.',
  };
}

export function isFailedAgentResult(result: AgentResult) {
  return result.stance === 'FAILED' || Boolean(result.error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getOverallStrength(count: number, averageCredibility: number): 'Strong' | 'Moderate' | 'Weak' {
  if (count >= 4 && averageCredibility >= 7.5) return 'Strong';
  if (count >= 2 && averageCredibility >= 5.5) return 'Moderate';
  return 'Weak';
}
