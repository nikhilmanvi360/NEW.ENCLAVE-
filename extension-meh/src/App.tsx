/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Search, XCircle, HelpCircle, Sparkles, ShieldCheck, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyClaim, FactCheckResponse } from './lib/factchecker';

export default function App() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!claim.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await verifyClaim(claim);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred while verifying the claim.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'True': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'False': return 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      case 'Partially True': return 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30 shadow-[0_0_15px_rgba(100,116,139,0.15)]';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'True': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'False': return <XCircle className="w-6 h-6 text-rose-400" />;
      case 'Partially True': return <AlertCircle className="w-6 h-6 text-amber-400" />;
      default: return <HelpCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center p-0 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Extension Container */}
      <div className="w-full h-full bg-slate-900/60 backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 relative z-10">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 leading-tight flex items-center gap-2">
              Fact Check AI 
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">Neural Analysis</p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {/* Input Section */}
          <div className="flex flex-col gap-3 shrink-0">
            <textarea
              id="claim"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Paste a claim or statement here to verify..."
              className="w-full h-[120px] p-4 bg-slate-950/50 border border-slate-700/50 rounded-xl resize-none focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm shadow-inner placeholder:text-slate-500"
              disabled={loading}
            />
            <button
              onClick={handleVerify}
              disabled={!claim.trim() || loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Processing...' : 'Verify Claim'}
              </span>
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {/* Loading State with Scanning Animation */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center py-6"
                >
                  <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 border-[2px] border-indigo-500/20 rounded-full animate-ping [animation-duration:2s]"></div>
                    <div className="absolute inset-2 border-[2px] border-purple-500/30 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full border-t-[3px] border-indigo-400 animate-spin [animation-duration:1.5s]"></div>
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center backdrop-blur-md">
                      <Cpu className="w-5 h-5 text-indigo-300 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center font-mono space-y-2">
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-sm text-indigo-300 font-semibold tracking-wider uppercase"
                    >
                      Analyzing Data
                    </motion.div>
                    <p className="text-xs text-slate-500 px-4">cross-referencing knowledge graphs...</p>
                  </div>
                </motion.div>
              )}

              {/* Result Section */}
              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col gap-5 pb-4"
                >
                  {/* Verdict Header */}
                  <div className={`p-5 rounded-xl border flex flex-col gap-3 relative overflow-hidden backdrop-blur-sm ${getVerdictStyle(result.verdict)}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      {getVerdictIcon(result.verdict)}
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2 bg-white/5 rounded-lg">
                        {getVerdictIcon(result.verdict)}
                      </div>
                      <h2 className="font-bold text-xl tracking-tight">{result.verdict}</h2>
                    </div>
                    
                    <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mt-1 relative z-10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-current opacity-80"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider opacity-80 relative z-10 mt-1">
                      <span>Confidence Score</span>
                      <span>{Math.round(result.confidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Reason & Points */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-4 bg-slate-800/30 border border-slate-700/50 p-5 rounded-xl"
                  >
                    <div className="space-y-2">
                      <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Summary
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {result.short_reason}
                      </p>
                    </div>

                    {result.key_points && result.key_points.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-slate-700/50">
                        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          Key Findings
                        </h3>
                        <ul className="space-y-2.5 mt-2">
                          {result.key_points.map((point, index) => (
                            <motion.li 
                              key={index} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + (index * 0.1) }}
                              className="flex gap-2.5 text-sm text-slate-300 items-start"
                            >
                              <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </div>
  );
}
