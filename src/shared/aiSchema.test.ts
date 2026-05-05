import {describe, expect, it} from 'vitest';
import {
  createFailedAgentResult,
  normalizeAgentResult,
  normalizeEvidenceProcessingResult,
  normalizeJudgeResult,
} from './aiSchema';

describe('AI response schemas', () => {
  it('normalizes agent evidence with source links', () => {
    const result = normalizeAgentResult({
      agent: 'Wrong',
      stance: 'FOR',
      confidence: '88',
      main_argument: 'A supported claim.',
      evidence: [
        {
          title: 'Official Data',
          source: 'CDC',
          url: 'https://www.cdc.gov/example',
          finding: 'A useful finding.',
        },
        {
          source: '',
          finding: '',
        },
      ],
      search_results: [
        {
          title: 'Search Result',
          source: 'cdc.gov',
          url: 'https://www.cdc.gov/search-result',
          snippet: 'A live search snippet.',
        },
      ],
      processed_evidence: [
        {
          summary: 'Official source supports the claim.',
          source: 'https://www.cdc.gov/example',
          relevance: 0.9,
          stance: 'supports',
          credibility: 9,
        },
        {
          summary: 'Too weak.',
          source: 'example.com',
          relevance: 0.2,
          stance: 'neutral',
          credibility: 5,
        },
      ],
    }, 'SKEPTIC');

    expect(result.agent).toBe('Skeptic');
    expect(result.confidence).toBe(88);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].url).toBe('https://www.cdc.gov/example');
    expect(result.search_results).toHaveLength(1);
    expect(result.search_results[0].source).toBe('cdc.gov');
    expect(result.processed_evidence).toHaveLength(1);
  });

  it('creates failed agent results for partial runs', () => {
    const result = createFailedAgentResult('ANALYST', 'Provider timed out.');

    expect(result.agent).toBe('Analyst');
    expect(result.stance).toBe('FAILED');
    expect(result.error).toBe('Provider timed out.');
    expect(result.evidence).toEqual([]);
    expect(result.search_results).toEqual([]);
  });

  it('normalizes processed evidence summaries and aggregate counts', () => {
    const result = normalizeEvidenceProcessingResult({
      processed_evidence: [
        {summary: 'A strong supporting item.', source: 'Wikipedia', relevance: 0.8, stance: 'supports', credibility: 8},
        {summary: 'A strong contradicting item.', source: 'NIH', relevance: 0.9, stance: 'contradicts', credibility: 10},
        {summary: 'Low relevance item.', source: 'Blog', relevance: 0.3, stance: 'neutral', credibility: 5},
      ],
      evidence_summary: {},
    });

    expect(result.processed_evidence).toHaveLength(2);
    expect(result.evidence_summary.support_count).toBe(1);
    expect(result.evidence_summary.contradict_count).toBe(1);
    expect(result.evidence_summary.biased_evidence).toBe(false);
    expect(result.evidence_summary.overall_strength).toBe('Moderate');
  });

  it('normalizes incomplete judge responses into a safe verdict', () => {
    const result = normalizeJudgeResult({
      verdict: 'MAYBE',
      confidence_score: 'not a number',
      final_summary: 'Evidence is incomplete.',
      key_evidence: ['Completed agents agreed.', ''],
      verdict_color: 'purple',
    });

    expect(result.verdict).toBe('UNVERIFIED');
    expect(result.confidence_score).toBe(0);
    expect(result.key_evidence).toEqual(['Completed agents agreed.']);
    expect(result.verdict_color).toBe('grey');
  });
});
