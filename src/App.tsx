/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, CheckCircle, BrainCircuit, Scale, Loader2, AlertCircle, RefreshCw, Download, ExternalLink, Clock, Trash2, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callAgent, callJudge, type AgentResult, type Evidence, type JudgeResult, type ProcessedEvidence, type SearchResult } from './services/ai';
import html2canvas from 'html2canvas';

type UIState = 'idle' | 'analyzing' | 'agents_done' | 'judging' | 'verdict_ready';
type PageView = 'verify' | 'history';

type AgentProgress = 'pending' | 'loading' | 'done' | 'error';
type AgentKey = 'skeptic' | 'supporter' | 'analyst';
type AgentResults = Record<AgentKey, AgentResult>;
type HistoryEntry = {
  id: string;
  claim: string;
  createdAt: string;
  agentResults: AgentResults;
  judgeResult: JudgeResult;
};

const historyStorageKey = 'truth-engine-history-v1';
const agentOrder: Array<{key: AgentKey; role: 'SKEPTIC' | 'SUPPORTER' | 'ANALYST'}> = [
  {key: 'skeptic', role: 'SKEPTIC'},
  {key: 'supporter', role: 'SUPPORTER'},
  {key: 'analyst', role: 'ANALYST'},
];

export default function App() {
  const [claim, setClaim] = useState('');
  const [pageView, setPageView] = useState<PageView>('verify');
  const [uiState, setUiState] = useState<UIState>('idle');
  const [agentProgress, setAgentProgress] = useState<{
    skeptic: AgentProgress;
    supporter: AgentProgress;
    analyst: AgentProgress;
    judge: AgentProgress;
  }>({
    skeptic: 'pending',
    supporter: 'pending',
    analyst: 'pending',
    judge: 'pending'
  });

  const [agentResults, setAgentResults] = useState<AgentResults | null>(null);

  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timelineStep, setTimelineStep] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(historyStorageKey);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  const persistHistory = (nextHistory: HistoryEntry[]) => {
    setHistory(nextHistory);
    window.localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
  };

  const downloadReport = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `verdict-report-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to snapshot report', err);
    }
  };

  const handleAnalyze = async () => {
    if (!claim.trim()) return;

    const currentClaim = claim.trim();
    setUiState('analyzing');
    setAgentProgress({ skeptic: 'loading', supporter: 'loading', analyst: 'loading', judge: 'pending' });
    setAgentResults(null);
    setJudgeResult(null);
    setErrorMsg('');

    try {
      const agentPromises = agentOrder.map(({key, role}) => (
        callAgent(role, currentClaim)
          .then((result) => {
            setAgentProgress(prev => ({ ...prev, [key]: 'done' }));
            return result;
          })
          .catch((err) => {
            setAgentProgress(prev => ({ ...prev, [key]: 'error' }));
            return createFailedAgentResult(role, err instanceof Error ? err.message : 'Agent request failed.');
          })
      ));

      const [skepticRes, supporterRes, analystRes] = await Promise.all(agentPromises);
      const successfulAgents = [skepticRes, supporterRes, analystRes].filter(result => !result.error);

      if (successfulAgents.length < 2) {
        throw new Error('At least two agents must complete before the judge can produce a verdict.');
      }
      
      const settledAgentResults = {
        skeptic: skepticRes,
        supporter: supporterRes,
        analyst: analystRes,
      };

      setAgentResults(settledAgentResults);

      setUiState('agents_done');
      
      // Animate timeline steps
      setTimelineStep(1);
      await new Promise(r => setTimeout(r, 2500));
      setTimelineStep(2);
      await new Promise(r => setTimeout(r, 2500));
      setTimelineStep(3);
      await new Promise(r => setTimeout(r, 2500));

      setUiState('judging');
      setAgentProgress(prev => ({ ...prev, judge: 'loading' }));

      const judgeRes = await callJudge(currentClaim, successfulAgents);
      
      setJudgeResult(judgeRes);
      setAgentProgress(prev => ({ ...prev, judge: 'done' }));
      setUiState('verdict_ready');
      persistHistory([
        {
          id: `${Date.now()}`,
          claim: currentClaim,
          createdAt: new Date().toISOString(),
          agentResults: settledAgentResults,
          judgeResult: judgeRes,
        },
        ...history.filter((item) => item.claim !== currentClaim),
      ].slice(0, 8));

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An error occurred during analysis. Please try again.");
      setUiState('idle');
    }
  };

  const resetState = () => {
    setClaim('');
    setUiState('idle');
    setAgentResults(null);
    setJudgeResult(null);
    setTimelineStep(0);
    setAgentProgress({ skeptic: 'pending', supporter: 'pending', analyst: 'pending', judge: 'pending' });
  };

  const restoreHistory = (entry: HistoryEntry) => {
    setPageView('verify');
    setClaim(entry.claim);
    setAgentResults(entry.agentResults);
    setJudgeResult(entry.judgeResult);
    setTimelineStep(3);
    setUiState('verdict_ready');
    setErrorMsg('');
    setAgentProgress({ skeptic: 'done', supporter: 'done', analyst: 'done', judge: 'done' });
  };

  const clearHistory = () => {
    persistHistory([]);
  };

  const getVerdictBgColor = (color: string) => {
    switch (color?.toLowerCase()) {
      case 'green': return 'bg-emerald-500';
      case 'red': return 'bg-rose-500';
      case 'yellow': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getVerdictTextColor = (color: string) => {
    switch (color?.toLowerCase()) {
      case 'green': return 'text-emerald-500';
      case 'red': return 'text-rose-500';
      case 'yellow': return 'text-amber-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-indigo-600" />
            <h1 className="font-bold text-xl tracking-tight">Multi-Agent Truth Engine</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageView('verify')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${pageView === 'verify' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Verify
            </button>
            <button
              onClick={() => setPageView('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${pageView === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Clock className="w-4 h-4" />
              History
              {history.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pageView === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {pageView === 'history' ? (
          <HistoryPage history={history} onRestore={restoreHistory} onClear={clearHistory} />
        ) : (
        <>
        {/* Intro & Input Layer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: uiState === 'idle' ? 1 : 0.8, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          {uiState === 'idle' && (
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-800">
              Dissect Misinformation with AI
            </h2>
          )}
          {uiState === 'idle' && (
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Three specialized AI agents independently research, analyze, and debate your claim using live web search before a central Judge delivers a verdict.
            </p>
          )}

          <div className="relative group max-w-3xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              disabled={uiState !== 'idle'}
              onKeyDown={(e) => e.key === 'Enter' && uiState === 'idle' && handleAnalyze()}
              className="block w-full pl-12 pr-32 py-5 border-2 border-slate-200 rounded-2xl text-lg shadow-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white disabled:bg-slate-100 disabled:opacity-70 disabled:cursor-not-allowed outline-none"
              placeholder="Enter a claim (e.g., '5G towers cause cancer')"
            />
            <button
              onClick={handleAnalyze}
              disabled={uiState !== 'idle' || !claim.trim()}
              className="absolute inset-y-2 right-2 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Initialize run
            </button>
          </div>
          {errorMsg && (
            <p className="mt-4 text-rose-500 font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errorMsg}
            </p>
          )}
        </motion.div>

        {/* Agents & Timeline Area */}
        <AnimatePresence mode="wait">
          {uiState === 'analyzing' && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Agent A: Skeptic */}
                <AgentCard 
                  title="The Skeptic" 
                  role="Agent A (Meta Llama 3.3)"
                  icon={<ShieldAlert className="w-6 h-6 text-rose-500" />}
                  colorClass="border-rose-200 bg-rose-50/50"
                  headerColor="text-rose-700"
                  progress={agentProgress.skeptic}
                  thinkingMessages={["Scanning for logical fallacies...", "Searching counter-evidence...", "Analyzing rhetoric..."]}
                />

                {/* Agent C: Analyst */}
                <AgentCard 
                  title="The Analyst" 
                  role="Agent C (Google via OpenRouter)"
                  icon={<Search className="w-6 h-6 text-blue-500" />}
                  colorClass="border-blue-200 bg-blue-50/50"
                  headerColor="text-blue-700"
                  progress={agentProgress.analyst}
                  thinkingMessages={["Cross-referencing dates...", "Checking statistical data...", "Consulting scientific consensus..."]}
                />

                {/* Agent B: Supporter */}
                <AgentCard 
                  title="The Supporter" 
                  role="Agent B (Meta Llama 3.1)"
                  icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
                  colorClass="border-emerald-200 bg-emerald-50/50"
                  headerColor="text-emerald-700"
                  progress={agentProgress.supporter}
                  thinkingMessages={["Searching supporting context...", "Finding validating sources...", "Strengthening arguments..."]}
                />
              </div>
              
              {/* Ticker Tape */}
              <div className="w-full max-w-4xl mx-auto mt-8 overflow-hidden bg-white rounded-xl border border-slate-200 py-3 shadow-sm relative">
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                <motion.div 
                  animate={{ x: [600, -1000] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="whitespace-nowrap flex gap-12 text-xs font-mono font-medium text-slate-500"
                >
                  <span className="text-rose-600">[SKEPTIC] Interrogating logical fallacies...</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600">[SUPPORTER] Cross-referencing credible sources...</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-blue-600">[ANALYST] Fact-checking statistical data...</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700">[SYSTEM] Connecting to Live Search nodes...</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {(uiState === 'agents_done' || uiState === 'judging' || uiState === 'verdict_ready') && agentResults && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mt-12 space-y-8"
            >
              <h3 className="text-xl font-bold tracking-tight text-slate-800 text-center mb-8">Debate Timeline</h3>
              
              <AnimatePresence>
                {timelineStep >= 1 && (
                  <TimelineMessage 
                    key="timeline-step-1"
                    role="Agent B The Supporter" 
                    title="Defending the claim"
                    icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                    colorClass="bg-emerald-50 border-emerald-200 text-emerald-800"
                    result={agentResults.supporter}
                    delay={0}
                  />
                )}
                {timelineStep >= 2 && (
                  <TimelineMessage 
                    key="timeline-step-2"
                    role="Agent A The Skeptic" 
                    title="Presenting Counter Argument"
                    icon={<ShieldAlert className="w-5 h-5 text-rose-500" />}
                    colorClass="bg-rose-50 border-rose-200 text-rose-800"
                    result={agentResults.skeptic}
                    delay={0}
                  />
                )}
                {timelineStep >= 3 && (
                  <TimelineMessage 
                    key="timeline-step-3"
                    role="Agent C The Analyst" 
                    title="Objective Findings"
                    icon={<Search className="w-5 h-5 text-blue-500" />}
                    colorClass="bg-blue-50 border-blue-200 text-blue-800"
                    result={agentResults.analyst}
                    delay={0}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Judge Area */}
        <AnimatePresence>
          {(uiState === 'judging' || uiState === 'verdict_ready') && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute -top-12 left-1/2 w-px h-12 bg-slate-300 transform -translate-x-1/2"></div>
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
                  
                  {uiState === 'judging' && (
                    <div className="p-12 text-center flex flex-col items-center justify-center bg-slate-50">
                      <Scale className="w-12 h-12 text-indigo-500 mb-6 animate-pulse" />
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Judge is Evaluating Evidence</h3>
                      <p className="text-slate-500">Weighing arguments, checking source credibility, and cross-referencing consensus...</p>
                      
                      <div className="w-64 h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 15, ease: "linear" }}
                        />
                      </div>
                      <div className="mt-6 w-full">
                         <AnimatedThinking messages={["Reviewing Agent B's sources...", "Verifying Agent A's logical consistency...", "Consulting analytical data...", "Determining confidence score..."]} />
                      </div>
                    </div>
                  )}

                  {uiState === 'verdict_ready' && judgeResult && (
                    <div>
                      {/* Report Card content start */}
                      <div ref={reportRef} className="bg-white">
                        <div className={`px-10 py-12 text-white ${getVerdictBgColor(judgeResult.verdict_color)} flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-white/10 opacity-50 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]"></div>
                          <Scale className="w-14 h-14 mb-4 opacity-90 relative z-10" />
                          <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2 relative z-10">Final Verdict</h3>
                          <div className="text-6xl font-black mb-4 tracking-tight drop-shadow-sm animate-stamp relative z-10 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                            {judgeResult.verdict}
                          </div>
                          <p className="text-xl font-medium max-w-2xl opacity-90 text-balance leading-relaxed relative z-10">
                            {judgeResult.final_summary}
                          </p>
                        </div>

                      <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Confidence Score</h4>
                            <span className={`text-2xl font-bold ${getVerdictTextColor(judgeResult.verdict_color)}`}>
                              {judgeResult.confidence_score}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                             <motion.div 
                                className={`h-full ${getVerdictBgColor(judgeResult.verdict_color)}`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${judgeResult.confidence_score}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                             />
                          </div>

                          <div className="mb-6">
                            <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Reasoning</h4>
                            <p className="text-slate-700 leading-relaxed text-sm">
                              {judgeResult.confidence_reasoning}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Consensus</h4>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                              {judgeResult.agent_agreement}
                            </div>
                            {judgeResult.minority_view && (
                              <p className="mt-2 text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
                                Dissent: {judgeResult.minority_view}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-l border-slate-100 pl-10">
                           <h4 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">Deciding Evidence</h4>
                           <ul className="space-y-4">
                             {judgeResult.key_evidence?.map((evidence: string, idx: number) => (
                               <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                 <div className="min-w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                                   {idx + 1}
                                 </div>
                                 <span className="leading-relaxed">{evidence}</span>
                               </li>
                             ))}
                           </ul>
                        </div>
                      </div>
                      </div>
                      {/* Report Card content end */}

                      <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between">
                        <button 
                          onClick={downloadReport}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors rounded-xl shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download Report
                        </button>
                        <button 
                          onClick={resetState}
                          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Verify another claim
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </>
        )}
      </main>
    </div>
  );
}

function AnimatedThinking({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 py-8">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      <div className="text-sm font-medium h-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={messages[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full text-center text-slate-500"
          >
            {messages[index]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentCard({ 
  title, role, icon, colorClass, headerColor, progress, thinkingMessages
}: { 
  title: string; role: string; icon: React.ReactNode; colorClass: string; headerColor: string;
  progress: AgentProgress; thinkingMessages: string[];
}) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${progress === 'loading' ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
      <div className={`p-4 border-b flex items-center gap-3 ${colorClass}`}>
        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{role}</div>
          <div className={`font-bold ${headerColor}`}>{title}</div>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col bg-slate-50/30">
        {progress === 'pending' && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Waiting for initialization...
          </div>
        )}
        
        {progress === 'loading' && (
          <AnimatedThinking messages={thinkingMessages} />
        )}

        {progress === 'error' && (
          <div className="flex-1 flex items-center justify-center text-rose-500 text-sm text-center">
            Failed to fetch analysis.<br/>Please try again.
          </div>
        )}

        {progress === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center text-emerald-600 gap-3 py-6">
            <CheckCircle className="w-10 h-10" />
            <div className="text-sm font-bold">Research Complete</div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTrustBadge(url: string) {
  const lower = url.toLowerCase();

  if (lower.includes('wikipedia.org') || lower === 'wikipedia') {
    return { label: 'Wikipedia', color: 'bg-violet-100 text-violet-800 border-violet-200' };
  }
  
  if (lower.includes('.gov') || lower.includes('.edu') || lower.includes('who.int') || lower.includes('cdc.gov') || lower.includes('nih.gov')) {
    return { label: 'High Trust', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  
  if (lower.includes('reuters.com') || lower.includes('apnews.com') || lower.includes('nytimes.com') || lower.includes('bbc.com') || lower.includes('wsj.com') || lower.includes('bloomberg.com') || lower.includes('nature.com') || lower.includes('science.org')) {
    return { label: 'Reputable News', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
  
  if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('reddit.com') || lower.includes('facebook.com') || lower.includes('medium.com') || lower.includes('tiktok.com')) {
    return { label: 'Social / Low Trust', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  
  return { label: 'Standard', color: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function createFailedAgentResult(role: 'SKEPTIC' | 'SUPPORTER' | 'ANALYST', error: string): AgentResult {
  const defaults = {
    SKEPTIC: {agent: 'Skeptic', stance: 'FAILED', main_argument: 'The Skeptic could not complete this run.'},
    SUPPORTER: {agent: 'Supporter', stance: 'FAILED', main_argument: 'The Supporter could not complete this run.'},
    ANALYST: {agent: 'Analyst', stance: 'FAILED', main_analysis: 'The Analyst could not complete this run.'},
  } as const;

  return {
    ...defaults[role],
    evidence: [],
    search_results: [],
    error,
    key_context: 'The judge will continue with the completed agent results.',
  };
}

function HistoryPage({ history, onRestore, onClear }: { history: HistoryEntry[]; onRestore: (entry: HistoryEntry) => void; onClear: () => void }) {
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-3">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Saved Verdicts</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Claim History</h2>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Review previous runs, restore a completed verdict, or clear locally stored results.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white/70 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 mb-2">No saved verdicts yet</h3>
          <p className="text-sm text-slate-500">Completed analyses will be stored here automatically.</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_120px_120px_150px] gap-4 px-5 py-3 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Claim</span>
            <span>Verdict</span>
            <span>Confidence</span>
            <span>Saved</span>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onRestore(entry)}
                className="w-full grid grid-cols-1 md:grid-cols-[1fr_120px_120px_150px] gap-3 md:gap-4 px-5 py-4 text-left hover:bg-indigo-50/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{entry.claim}</div>
                  <div className="text-sm text-slate-500 mt-1 line-clamp-2">{entry.judgeResult.final_summary}</div>
                </div>
                <div>
                  <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${entry.judgeResult.verdict_color === 'green' ? 'bg-emerald-100 text-emerald-700' : entry.judgeResult.verdict_color === 'red' ? 'bg-rose-100 text-rose-700' : entry.judgeResult.verdict_color === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {entry.judgeResult.verdict}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-700">{entry.judgeResult.confidence_score}%</div>
                <div className="text-sm text-slate-500">
                  {new Date(entry.createdAt).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TimelineMessage({ role, title, icon, colorClass, result, delay }: { role: string; title: string; icon: React.ReactNode; colorClass: string; result: AgentResult, delay: number, key?: string }) {
  const isFailed = Boolean(result.error);
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-4"
    >
      <div className="shrink-0 mt-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm bg-white`}>
          {icon}
        </div>
      </div>
      <div className={`flex-1 rounded-2xl rounded-tl-none p-5 border shadow-sm relative overflow-hidden ${isFailed ? 'bg-rose-50 border-rose-200 text-rose-800' : colorClass} transition-all`}>
        {/* Dossier Watermark */}
        <div className="absolute -right-4 -bottom-6 text-[5rem] font-black uppercase text-slate-900/[0.03] select-none pointer-events-none transform -rotate-12 z-0">
          CLASSIFIED
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{role}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
            <span className="text-sm font-bold opacity-90">{title}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-400">ID:{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
          
          <p className="text-slate-800 leading-relaxed font-medium mb-4 text-[15px]">
            {result.error ? `Skipped: ${result.error}` : result.main_argument || result.main_analysis}
          </p>
          
          {result.evidence && result.evidence.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-current/10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-2">Supporting Evidence File</span>
              {result.evidence.slice(0, 2).map((ev: Evidence, i: number) => {
                const badge = getTrustBadge(ev.url || ev.source);
                let domain = '';
                try {
                  domain = ev.url ? new URL(ev.url).hostname : '';
                } catch(e) {}

                return (
                  <div key={i} className="bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-current/10 shadow-sm hover:bg-white transition-colors">
                    <p className="text-sm text-slate-800 font-medium mb-2 leading-snug">"{ev.finding}"</p>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {domain && (
                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-4 h-4 rounded-full opacity-80" alt="" />
                      )}
                      {ev.url ? (
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 truncate hover:text-indigo-600 hover:underline"
                        >
                          <span className="truncate">{ev.title || ev.source || domain}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 truncate flex-1">{ev.title || ev.source}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {result.search_results && result.search_results.length > 0 && (
          <SearchTrail results={result.search_results} />
        )}

        {result.processed_evidence && result.processed_evidence.length > 0 && (
          <ProcessedEvidencePanel
            evidence={result.processed_evidence}
            summary={result.evidence_summary}
          />
        )}
        
        {(result.weakness_of_claim || result.strongest_point || result.key_context) && (
          <div className="relative z-10 mt-4 pt-3 border-t border-current/10">
             <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1">Key Insight</span>
             <p className="text-sm italic opacity-90">
               {result.weakness_of_claim || result.strongest_point || result.key_context}
             </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProcessedEvidencePanel({ evidence, summary }: { evidence: ProcessedEvidence[]; summary: AgentResult['evidence_summary'] }) {
  return (
    <div className="mt-4 pt-3 border-t border-current/10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Processed Evidence</span>
        {summary && (
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{summary.support_count} support</span>
            <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700">{summary.contradict_count} contradict</span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">{summary.neutral_count} neutral</span>
            <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{summary.overall_strength}</span>
            {summary.biased_evidence && (
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">biased</span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {evidence.slice(0, 5).map((item, index) => (
          <div key={`${item.source}-${index}`} className="rounded-xl border border-current/10 bg-white/60 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.stance === 'supports' ? 'bg-emerald-100 text-emerald-700' : item.stance === 'contradicts' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                {item.stance}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                rel {item.relevance.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                cred {item.credibility}/10
              </span>
              <span className="text-xs opacity-60 truncate">{item.source}</span>
            </div>
            <p className="text-sm text-slate-700 leading-snug">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchTrail({ results }: { results: SearchResult[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-current/10">
      <div className="flex items-center gap-2 mb-2">
        <Globe2 className="w-4 h-4 opacity-70" />
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Live Search Sources</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {results.slice(0, 4).map((result, index) => {
          const badge = getTrustBadge(result.url || result.source || result.title);
          return (
            <a
              key={`${result.url || result.title}-${index}`}
              href={result.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 rounded-xl border border-current/10 bg-white/60 p-3 hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-xs opacity-60 truncate">{result.source}</span>
              </div>
              <div className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                <span className="line-clamp-2">{result.title || result.url}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-50" />
              </div>
              {result.snippet && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.snippet}</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
