import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentResult } from '../services/ai';
import { ShieldAlert, CheckCircle, BarChart2, Globe, Link2, AlertCircle } from 'lucide-react';

interface CitationGraphProps {
  claim: string;
  agentResults: {
    skeptic: AgentResult;
    supporter: AgentResult;
    analyst: AgentResult;
  } | null;
}

const AGENT_STYLES = {
  skeptic:  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c', icon: '#f43f5e', label: 'Agent A: Skeptic' },
  supporter:{ bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: '#22c55e', label: 'Agent B: Supporter' },
  analyst:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: '#3b82f6', label: 'Agent C: Analyst' },
} as const;

const CitationGraph: React.FC<CitationGraphProps> = ({ claim, agentResults }) => {
  const { nodes, edges, hasSources } = useMemo(() => {
    if (!agentResults) return { nodes: [], edges: [], hasSources: false };

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    let totalSources = 0;

    // 1. Central Claim Node
    initialNodes.push({
      id: 'claim',
      type: 'default',
      data: {
        label: (
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '10px 14px', minWidth: 180, textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Central Claim</p>
            <p style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 700, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{claim.slice(0, 60)}{claim.length > 60 ? '…' : ''}</p>
          </div>
        )
      },
      position: { x: 400, y: 280 },
    });

    const agentList = [
      { id: 'skeptic',   data: agentResults.skeptic,   icon: <ShieldAlert size={12} /> },
      { id: 'supporter', data: agentResults.supporter,  icon: <CheckCircle size={12} /> },
      { id: 'analyst',   data: agentResults.analyst,    icon: <BarChart2   size={12} /> },
    ] as const;

    agentList.forEach((agent, idx) => {
      const angle = (idx * 120 - 90) * (Math.PI / 180);
      const radius = 210;
      const x = 400 + radius * Math.cos(angle);
      const y = 280 + radius * Math.sin(angle);
      const style = AGENT_STYLES[agent.id];
      const conf = agent.data.confidence ?? agent.data.factual_accuracy_score ?? 0;

      // Agent Node
      initialNodes.push({
        id: agent.id,
        type: 'default',
        data: {
          label: (
            <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 10, padding: '8px 10px', width: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ color: style.icon }}>{agent.icon}</span>
                <span style={{ color: style.text, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{style.label}</span>
              </div>
              <div style={{ background: '#e2e8f0', height: 4, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ background: style.icon, height: '100%', width: `${conf}%`, borderRadius: 4 }} />
              </div>
              <p style={{ color: style.text, fontSize: 9, fontWeight: 700, margin: '4px 0 0', opacity: 0.7 }}>{Math.round(conf)}% confidence</p>
            </div>
          )
        },
        position: { x, y },
      });

      initialEdges.push({
        id: `e-claim-${agent.id}`,
        source: 'claim',
        target: agent.id,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });

      // Source nodes — use evidence first, fall back to search_results
      const evidenceSources = (agent.data.evidence || [])
        .filter(e => e.source || e.url || e.title)
        .slice(0, 3)
        .map(e => ({ title: e.title || e.source || 'Source', url: e.url || '', source: e.source || '' }));

      const searchSources = (agent.data.search_results || [])
        .filter(s => s.title || s.url)
        .slice(0, 3)
        .map(s => ({ title: s.title || s.source || 'Source', url: s.url || '', source: s.source || '' }));

      const sources = evidenceSources.length > 0 ? evidenceSources : searchSources;
      totalSources += sources.length;

      sources.forEach((source, sIdx) => {
        const sAngle = angle + (sIdx - 1) * 0.5;
        const sRadius = 380;
        const sx = 400 + sRadius * Math.cos(sAngle);
        const sy = 280 + sRadius * Math.sin(sAngle);
        const sId = `${agent.id}-src-${sIdx}`;

        initialNodes.push({
          id: sId,
          type: 'default',
          data: {
            label: (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', width: 130, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Globe size={9} color="#94a3b8" />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                    {source.title?.slice(0, 30) || 'Source'}
                  </span>
                </div>
                {source.url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Link2 size={8} color="#cbd5e1" />
                    <span style={{ fontSize: 8, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 105 }}>
                      {source.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}
                    </span>
                  </div>
                )}
              </div>
            )
          },
          position: { x: sx, y: sy },
        });

        initialEdges.push({
          id: `e-${agent.id}-${sId}`,
          source: agent.id,
          target: sId,
          style: { stroke: style.border, strokeWidth: 1.5, strokeDasharray: '4 3' },
        });
      });
    });

    return { nodes: initialNodes, edges: initialEdges, hasSources: totalSources > 0 };
  }, [claim, agentResults]);

  return (
    <div style={{ height: 520, width: '100%', background: 'rgba(248,250,252,0.7)', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>
        <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: '0 0 2px' }}>Citation Network</h4>
        <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontStyle: 'italic' }}>Mapping source relationships &amp; agent debate paths</p>
      </div>

      {/* Empty State: No Sources */}
      {!hasSources && agentResults && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <AlertCircle size={28} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0 }}>No evidence sources returned by agents</p>
          <p style={{ fontSize: 10, color: '#cbd5e1', margin: '4px 0 0' }}>The citation graph will populate once agents return source URLs</p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnScroll={false}
        zoomOnScroll={false}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        className="citation-graph"
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls showInteractive={false} className="bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden" />
      </ReactFlow>
    </div>
  );
};

export default CitationGraph;
