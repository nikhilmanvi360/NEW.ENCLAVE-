import type {AgentResult, AgentRole, JudgeResult} from '../shared/aiSchema';
import {supabase} from '../lib/supabase';

export type {AgentResult, AgentRole, Evidence, EvidenceSummary, JudgeResult, ProcessedEvidence, SearchResult} from '../shared/aiSchema';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (supabase) {
    const {data} = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    const message = isErrorPayload(payload) && payload.error
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function isErrorPayload(payload: unknown): payload is {error?: string} {
  return typeof payload === 'object' && payload !== null && 'error' in payload;
}

export async function callAgent(role: AgentRole, claim: string) {
  return postJson<AgentResult>('/api/agent', {role, claim});
}

export async function callJudge(claim: string, agents: AgentResult[]) {
  return postJson<JudgeResult>('/api/judge', {claim, agents});
}

export async function checkCache(claim: string, domain: string) {
  const params = new URLSearchParams({ claim, domain });
  const response = await fetch(`/api/cache/check?${params.toString()}`);
  return response.json() as Promise<{cached: boolean; result?: any; agent_results?: any; last_verified?: string}>;
}
