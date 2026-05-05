import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Scale, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Types for the courtroom API response format
interface DebateMessage {
  agent: 'pro' | 'con' | 'neutral';
  round: number;
  message: string;
}

interface Source {
  source: string;
  summary: string;
}

interface CourtroomResult {
  debate: DebateMessage[];
  verdict: string;
  confidence: number;
  reasoning: string;
  uncertainty: string;
  sources: Source[];
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface LandingPageProps {
  onEnterDashboard: (claim: string) => void;
}

export default function LandingPage({ onEnterDashboard }: LandingPageProps) {
  const [claim, setClaim] = useState('');
  const [status, setStatus] = useState<'input' | 'loading' | 'debate' | 'verdict'>('input');
  const [result, setResult] = useState<CourtroomResult | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<DebateMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const startAnalysis = async () => {
    if (!claim.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      setVisibleMessages([]);
      setCurrentStep(0);
      setStatus('debate');
    } catch (error) {
      console.error('Analysis failed:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      setStatus('input');
    }
  };

  // Step-by-step reveal logic with 1.5s delay for cinematic effect
  useEffect(() => {
    if (status === 'debate' && result) {
      if (currentStep < result.debate.length) {
        const timer = setTimeout(() => {
          setVisibleMessages(prev => [...prev, result.debate[currentStep]]);
          setCurrentStep(prev => prev + 1);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setStatus('verdict'), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, currentStep, result]);

  const reset = () => {
    setStatus('input');
    setVisibleMessages([]);
    setCurrentStep(0);
    setClaim('');
    setResult(null);
    setErrorMsg('');
  };

  return (
    <main className="min-h-screen text-slate-50 flex flex-col items-center justify-center p-4 overflow-hidden relative"
      style={{ background: '#020617' }}>

      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]"
          style={{ background: 'rgba(29,78,216,0.15)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]"
          style={{ background: 'rgba(109,40,217,0.15)' }} />
      </div>

      <AnimatePresence mode="wait">

        {/* ─── INPUT STATE ─── */}
        {status === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl text-center space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-block p-4 rounded-2xl mb-2"
                style={{ background: 'rgba(59,130,246,0.1)' }}
              >
                <Scale className="w-14 h-14 text-blue-500" />
              </motion.div>
              <h1 className="text-6xl font-black tracking-tighter"
                style={{ background: 'linear-gradient(to right, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ENCLAVE
              </h1>
              <p className="text-slate-400 text-lg">Multi-Agent AI Truth Protocol</p>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Three specialized AI agents autonomously research, debate, and fact-check any claim using live evidence.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"
                style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }} />
              <div className="relative flex items-center rounded-xl overflow-hidden border"
                style={{ background: '#0f172a', borderColor: '#1e293b' }}>
                <input
                  type="text"
                  placeholder="Enter a claim to analyze..."
                  className="w-full bg-transparent px-6 py-5 text-lg outline-none"
                  style={{ color: '#f8fafc' }}
                  value={claim}
                  onChange={e => setClaim(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startAnalysis()}
                />
                <button
                  onClick={startAnalysis}
                  disabled={!claim.trim()}
                  className="mr-3 p-3 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#2563eb', color: 'white' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-400 text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </p>
            )}

            {/* Example chips */}
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-slate-600">Try:</span>
              {['Aspirin prevents heart attacks', '5G towers cause cancer', 'The moon landing was faked'].map(ex => (
                <button key={ex} onClick={() => setClaim(ex)}
                  className="px-3 py-1 rounded-full border transition-colors"
                  style={{ borderColor: '#1e293b', color: '#64748b', background: 'transparent' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#3b82f6'; (e.target as HTMLElement).style.color = '#93c5fd'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#1e293b'; (e.target as HTMLElement).style.color = '#64748b'; }}>
                  {ex}
                </button>
              ))}
            </div>

            {/* CTA to full dashboard */}
            <div className="pt-4 border-t" style={{ borderColor: '#1e293b' }}>
              <button
                onClick={() => onEnterDashboard('')}
                className="text-sm transition-colors"
                style={{ color: '#3b82f6' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#93c5fd'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = '#3b82f6'; }}>
                Open Full Research Dashboard →
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── LOADING STATE ─── */}
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="absolute inset-0 blur-xl animate-pulse rounded-full"
                style={{ background: 'rgba(59,130,246,0.3)' }} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Assembling Agents</h2>
              <p className="text-slate-400">Retrieving evidence and initializing debate protocol...</p>
            </div>
          </motion.div>
        )}

        {/* ─── DEBATE + VERDICT STATE ─── */}
        {(status === 'debate' || status === 'verdict') && (
          <motion.div
            key="courtroom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl flex flex-col gap-6"
            style={{ height: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Scale className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">ENCLAVE · Case Analysis</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">
                    {claim.length > 60 ? claim.substring(0, 60) + '…' : claim}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 rounded-full text-xs font-mono text-blue-400 border"
                  style={{ background: '#0f172a', borderColor: '#1e293b' }}>
                  PROTOCOL ACTIVE
                </span>
                <button onClick={() => onEnterDashboard(claim)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={{ borderColor: '#3b82f6', color: '#60a5fa', background: 'transparent' }}>
                  Full Dashboard →
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              <AnimatePresence>
                {visibleMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.agent === 'pro' ? -20 : msg.agent === 'con' ? 20 : 0, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      'flex flex-col gap-2 max-w-[80%]',
                      msg.agent === 'pro' ? 'self-start' :
                        msg.agent === 'con' ? 'self-end items-end' :
                          'self-center items-center max-w-[90%]'
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full" style={{
                        background: msg.agent === 'pro' ? '#22c55e' : msg.agent === 'con' ? '#ef4444' : '#3b82f6'
                      }} />
                      <span style={{ color: msg.agent === 'pro' ? '#22c55e' : msg.agent === 'con' ? '#ef4444' : '#3b82f6' }}>
                        {msg.agent === 'pro' ? 'Supporter' : msg.agent === 'con' ? 'Skeptic' : 'Analyst'}
                      </span>
                      <span className="text-slate-600">· Round {msg.round}</span>
                    </div>
                    <div className="p-4 rounded-2xl text-sm leading-relaxed" style={{
                      background: msg.agent === 'pro' ? 'rgba(34,197,94,0.05)' :
                        msg.agent === 'con' ? 'rgba(239,68,68,0.05)' : 'rgba(59,130,246,0.05)',
                      border: `1px solid ${msg.agent === 'pro' ? 'rgba(34,197,94,0.2)' :
                        msg.agent === 'con' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                      borderRadius: msg.agent === 'pro' ? '1rem 1rem 1rem 0' :
                        msg.agent === 'con' ? '1rem 1rem 0 1rem' : '1rem',
                      textAlign: msg.agent === 'con' ? 'right' : msg.agent === 'neutral' ? 'center' : 'left'
                    }}>
                      {msg.message}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Verdict Card */}
              {status === 'verdict' && result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-8 rounded-3xl relative overflow-hidden"
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(59,130,246,0.3)',
                    boxShadow: '0 0 30px rgba(59,130,246,0.2)'
                  }}>
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <CheckCircle2 className="w-32 h-32" />
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.2)' }}>
                        <ShieldAlert className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Final Verdict</p>
                        <h2 className="text-4xl font-black italic">{result.verdict}</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Confidence Score</span>
                            <span className="font-mono">{Math.round(result.confidence * 100)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${result.confidence * 100}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full"
                              style={{ background: 'linear-gradient(to right, #2563eb, #818cf8)' }}
                            />
                          </div>
                        </div>
                        <div className="p-4 rounded-xl border" style={{ background: 'rgba(2,6,23,0.5)', borderColor: '#1e293b' }}>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Judge's Reasoning</h4>
                          <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-xl border" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                          <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Uncertainty Analysis</span>
                          </div>
                          <p className="text-sm text-slate-300">{result.uncertainty}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase">Key Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.sources.map((s, i) => (
                              <div key={i} className="px-3 py-1 rounded-lg text-xs text-slate-400 border"
                                style={{ background: '#1e293b', borderColor: '#334155' }}>
                                {s.source}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => onEnterDashboard(claim)}
                        className="flex-1 py-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95"
                        style={{ background: '#2563eb', color: 'white' }}>
                        Open Full Research Dashboard
                      </button>
                      <button
                        onClick={reset}
                        className="px-6 py-4 rounded-xl font-bold border transition-all hover:scale-[1.02] active:scale-95"
                        style={{ borderColor: '#1e293b', color: '#94a3b8', background: 'transparent' }}>
                        New Claim
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
