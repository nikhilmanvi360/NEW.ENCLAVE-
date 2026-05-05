# Feature Guide

## Live Web Search

The app performs server-side evidence collection before each agent call.

- Wikipedia is queried first for background, definitions, timelines, and related entities.
- Each agent also receives a role-specific broader live web search query.
- Wikipedia results and broader search results are passed through an Evidence Processing Engine.
- The Evidence Processing Engine filters duplicates, summarizes evidence, scores relevance, labels stance, scores credibility, checks bias, and returns aggregate strength.
- Processed evidence is injected into the agent prompt as the primary evidence set.
- Agent responses include both model evidence and the raw `search_results`.
- Agent responses include `processed_evidence` and `evidence_summary` for transparent downstream reasoning.
- The frontend shows a separate **Live Search Sources** section with trust badges and clickable links, including a distinct Wikipedia badge.
- The frontend also shows **Processed Evidence** with stance, relevance, credibility, strength, and bias indicators.
- If live search fails, the agent still runs and the prompt explicitly marks source coverage as uncertain.

Wikipedia is used for orientation, not as the only final authority. Agents are instructed to corroborate Wikipedia context against official, academic, scientific, or reputable news sources when claims are contentious, medical, legal, or time-sensitive.
