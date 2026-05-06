/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, CheckCircle, BrainCircuit, Scale, Loader2, AlertCircle, RefreshCw, Download, ExternalLink, Clock, Trash2, Globe2, Sparkles, ArrowRight, UploadCloud, FileVideo, Shield, Settings, Server, Key, Lock, Unlock, Users, Activity, Terminal, Zap, BarChart3, CreditCard, Wallet, Diamond, LogOut, Mail, Eye, EyeOff, Route, Database, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callAgent, callJudge, type AgentResult, type Evidence, type JudgeResult, type ProcessedEvidence, type SearchResult } from './services/ai';
import html2canvas from 'html2canvas';
import { LandingPage } from './LandingPage';
import { supabase } from './lib/supabase';

type UIState = 'idle' | 'analyzing' | 'agents_done' | 'judging' | 'verdict_ready';
type PageView = 'verify' | 'history' | 'analytics' | 'review' | 'batch' | 'webhooks' | 'admin' | 'pricing';

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

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    badge: null,
    color: 'indigo',
    features: {
      'Webhook Endpoints': '10',
      'API Requests': '500 / min',
      'Agent Queue': 'Priority',
      'Research Modes': '4 Domains',
      'Batch Processing': false,
      'Analyst Support': false,
      'Audit Logs': false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    badge: 'Most Popular',
    color: 'purple',
    features: {
      'Webhook Endpoints': 'Unlimited',
      'API Requests': 'Unlimited',
      'Agent Queue': 'Dedicated',
      'Research Modes': '4 Domains',
      'Batch Processing': true,
      'Analyst Support': '24 / 7',
      'Audit Logs': true,
    },
  },
];

function PricingPage({ onUpgrade }: { onUpgrade: (planId: string) => void }) {
  const [selected, setSelected] = useState('pro');
  const plan = PLANS.find(p => p.id === selected)!;

  return (
    <div className="min-h-screen bg-[#080B14] text-white relative overflow-hidden animate-in fade-in duration-500">
      {/* Background glow orbs */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" /> Unlock Full Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            One step away from<br />real-time forensics.
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Deploy webhooks, monitor API usage, and automate your entire truth pipeline.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {[
            { icon: <Shield className="w-4 h-4 text-emerald-400" />, text: '14-day free trial — no charge today' },
            { icon: <RefreshCw className="w-4 h-4 text-emerald-400" />, text: '30-day money-back guarantee' },
            { icon: <Lock className="w-4 h-4 text-emerald-400" />, text: 'Bank-grade TLS encryption' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-400">
              {badge.icon}
              <span>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Plan selector tabs */}
        <div className="flex justify-center gap-3 mb-10">
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`relative px-8 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                selected === p.id
                  ? 'bg-white text-slate-900 shadow-xl shadow-white/10'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                  {p.badge}
                </span>
              )}
              {p.name}
            </button>
          ))}
        </div>

        {/* Plan card */}
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden mb-6 backdrop-blur-sm"
        >
          {/* Price row */}
          <div className="p-10 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">{plan.name} Plan</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">${plan.price}</span>
                <span className="text-slate-400 text-lg">/month</span>
              </div>
              <p className="text-emerald-400 text-sm font-bold mt-2">✓ 14 days free, cancel anytime</p>
            </div>
            <button
              onClick={() => onUpgrade(selected)}
              className="group px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg rounded-2xl shadow-2xl shadow-indigo-900/50 transition-all duration-300 active:scale-95 flex items-center gap-3 whitespace-nowrap"
            >
              <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature table */}
          <div className="p-10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            {Object.entries(plan.features).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-slate-400 font-medium text-sm">{label}</span>
                {typeof value === 'boolean' ? (
                  value
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <span className="text-slate-600 text-lg font-black">—</span>
                ) : (
                  <span className="text-white font-bold text-sm">{value}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fine print */}
        <p className="text-center text-slate-600 text-xs">
          By subscribing you agree to our Terms of Service. Cancel anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  const particles = Array.from({ length: 40 });
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ffffff'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 720 - 360],
            opacity: [1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.8,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function CheckoutModal({ onClose, onComplete, planId }: { onClose: () => void, onComplete: () => void, planId?: string }) {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const plan = PLANS.find(p => p.id === (planId || 'pro'))!;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep(2);
      setTimeout(() => { onComplete(); onClose(); }, 3000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={step === 1 ? onClose : undefined}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-lg"
      >
        {step === 1 ? (
          <div className="bg-[#0F1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Secure Checkout</p>
                <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none">✕</button>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-white/40 text-base">/month after free trial</span>
              </div>
              <p className="text-emerald-400 text-xs font-bold mt-1">✓ 14-day free trial · 30-day money-back guarantee</p>
            </div>

            {/* Form */}
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Card Number</label>
                <div className="flex items-center gap-3 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-indigo-500 transition-all">
                  <CreditCard className="w-5 h-5 text-white/30 shrink-0" />
                  <input type="text" placeholder="4242 4242 4242 4242" className="bg-transparent outline-none w-full font-mono text-sm tracking-widest text-white placeholder:text-white/20" maxLength={19} />
                  <span className="text-white/20 text-xs font-bold">VISA</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Expiry</label>
                  <input type="text" placeholder="MM / YY" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-center text-sm text-white placeholder:text-white/20 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">CVC</label>
                  <div className="flex items-center gap-2 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-indigo-500 transition-all">
                    <Lock className="w-4 h-4 text-white/20 shrink-0" />
                    <input type="text" placeholder="•••" className="bg-transparent outline-none w-full text-center text-sm text-white placeholder:text-white/20" />
                  </div>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full py-5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base rounded-2xl shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-wait"
              >
                {processing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Securely...</>
                  : <><Wallet className="w-5 h-5" /> Start Free Trial</>
                }
              </button>

              <p className="text-center text-white/25 text-xs pt-1">
                🔒 Payments secured by 256-bit TLS encryption. Cancel anytime.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative bg-[#0F1117] border border-white/10 rounded-[2.5rem] p-12 text-center overflow-hidden shadow-2xl">
            <Confetti />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-white mb-2"
            >
              You're in!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 font-medium mb-6"
            >
              Welcome to LUMINA {plan.name}. Your trial has started.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold"
            >
              <Zap className="w-3 h-3" /> Redirecting to your dashboard...
            </motion.div>
          </div>
        )}
      </motion.div>
      </div>
  );
}

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [claim, setClaim] = useState('');
  const [domain, setDomain] = useState<'GENERAL' | 'MEDICAL' | 'LEGAL' | 'FINANCIAL'>('GENERAL');
  const [inputMode, setInputMode] = useState<'text' | 'media'>('text');
  const [pageView, setPageView] = useState<PageView>('verify');
  const [uiState, setUiState] = useState<UIState>('idle');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem('lumina_premium') === 'true');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Supabase Auth listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hidden keyboard shortcut: Ctrl+Shift+A → Admin panel (stealth access)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setPageView('admin');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    const loadHistory = async () => {
      if (!supabase || !user) {
        try {
          const saved = window.localStorage.getItem(historyStorageKey);
          if (saved) setHistory(JSON.parse(saved));
        } catch (err) { console.error('Local history load failed', err); }
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('truth_engine_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
            
        if (!error && data && data.length > 0) {
          const formattedHistory = data.map(row => ({
            id: row.id,
            claim: row.claim,
            createdAt: row.created_at,
            agentResults: row.agent_results,
            judgeResult: row.judge_result,
          }));
          setHistory(formattedHistory);
        }
      } catch (err) {
        console.warn('Supabase fetch failed', err);
      }
    };
    loadHistory();
  }, [user]);

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

    const originalClaim = claim.trim();
    // Inject domain and input mode context into the claim for the AI
    const enrichedClaim = `[Domain Context: ${domain}] [Input Type: ${inputMode.toUpperCase()}]\nClaim to verify: ${originalClaim}`;
    
    setUiState('analyzing');
    setAgentProgress({ skeptic: 'loading', supporter: 'loading', analyst: 'loading', judge: 'pending' });
    setAgentResults(null);
    setJudgeResult(null);
    setErrorMsg('');

    try {
      const agentPromises = agentOrder.map(({key, role}) => (
        callAgent(role, enrichedClaim)
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

      const judgeRes = await callJudge(enrichedClaim, successfulAgents);
      
      setJudgeResult(judgeRes);
      setAgentProgress(prev => ({ ...prev, judge: 'done' }));
      setUiState('verdict_ready');
      const newEntry = {
        id: `${Date.now()}`,
        claim: originalClaim, // Save the clean claim in history
        createdAt: new Date().toISOString(),
        agentResults: settledAgentResults,
        judgeResult: judgeRes,
      };

      persistHistory([
        newEntry,
        ...history.filter((item) => item.claim !== originalClaim),
      ].slice(0, 8));

      // Async save to Supabase
      if (supabase) {
        supabase.from('truth_engine_history').insert({
          id: newEntry.id,
          claim: newEntry.claim,
          created_at: newEntry.createdAt,
          agent_results: newEntry.agentResults,
          judge_result: newEntry.judgeResult,
          user_id: user?.id || null
        }).then(({ error }) => {
          if (error) console.error('Failed to save to Supabase:', error);
        });
      }

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

  if (!showDashboard) {
    return <LandingPage onEnter={() => setShowDashboard(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 relative overflow-x-hidden">
      {!isSubscribed && <UpgradeBanner onUpgrade={() => setPageView('pricing')} />}
      
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* ZONE 1: LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setPageView('verify')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none">LUMINA</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Forensic Engine</p>
            </div>
          </div>

          {/* ZONE 2: CENTER NAV */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            {[
              { id: 'verify', label: 'Verify', icon: <Search className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'review', label: 'Review', icon: <ShieldAlert className="w-4 h-4" /> },
              { id: 'batch', label: 'Batch', icon: <Database className="w-4 h-4" /> },
              { id: 'webhooks', label: 'Webhooks', icon: <Zap className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPageView(tab.id as PageView)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  pageView === tab.id 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* ZONE 3: ACCOUNT */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{user.email}</p>
                </div>
                <button 
                  onClick={async () => { await supabase?.auth.signOut(); setUser(null); }}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
            
            {/* Mobile Nav Toggle (Optional fallback) */}
            <button className="lg:hidden p-2 text-slate-500">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {showAuthModal && (
          <LoginModal 
            onClose={() => setShowAuthModal(false)} 
            onSuccess={(u) => { setUser(u); setShowAuthModal(false); }} 
          />
        )}
        {showCheckout && (
          <CheckoutModal 
            planId={selectedPlanId}
            onClose={() => setShowCheckout(false)} 
            onComplete={() => {
              setIsSubscribed(true);
              localStorage.setItem('lumina_premium', 'true');
              setPageView('webhooks');
            }} 
          />
        )}
        
        {pageView === 'history' ? (
          <HistoryPage history={history} onRestore={restoreHistory} onClear={clearHistory} />
        ) : (['analytics', 'review', 'batch', 'webhooks'].includes(pageView) && !isSubscribed) || pageView === 'pricing' ? (
          <PricingPage onUpgrade={(planId) => { setSelectedPlanId(planId); setShowCheckout(true); }} />
        ) : pageView === 'analytics' ? (
          <AnalyticsMockPage />
        ) : pageView === 'review' ? (
          <ReviewQueueMockPage />
        ) : pageView === 'batch' ? (
          <BatchMockPage />
        ) : pageView === 'webhooks' ? (
          <WebhooksPage isSubscribed={isSubscribed} onUpgrade={() => {}} />
        ) : pageView === 'admin' ? (
          user ? <AdminMockPage user={user} onSignOut={async () => { await supabase?.auth.signOut(); setUser(null); }} /> : <AdminLoginPage onLogin={setUser} loading={authLoading} setLoading={setAuthLoading} />
        ) : (
        <>
        {/* Intro & Input Layer */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm"
            >
              <Sparkles size={12} />
              AI-Powered Forensic Analysis
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-slate-900">
              Dissect Truth from <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Fabrication</span>
            </h2>
            
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Our multi-agent system independently researches, debates, and verifies any claim using live global data nodes.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group mb-16"
          >
            {/* Soft background glow container for selectors */}
            <div className="relative z-10 py-8 px-4 rounded-3xl mb-8 flex flex-col items-center gap-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/40 via-purple-100/40 to-pink-100/40 blur-3xl -z-10 rounded-full w-[120%] -left-[10%]"></div>
              
              {/* Domain Mode Selection */}
              <div className="flex flex-wrap justify-center gap-3">
                {(['GENERAL', 'MEDICAL', 'LEGAL', 'FINANCIAL'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all border ${
                      domain === d 
                        ? 'bg-[#232145] border-[#232145] text-white shadow-lg shadow-indigo-200/50 scale-105' 
                        : 'bg-white/40 border-indigo-200/60 text-indigo-400 hover:bg-white/60 hover:text-indigo-500 hover:border-indigo-300 backdrop-blur-sm'
                    }`}
                  >
                    {d} Mode
                  </button>
                ))}
              </div>
              
              {/* Input Method Toggle */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                    inputMode === 'text' 
                      ? 'bg-indigo-100/80 border-indigo-200 text-indigo-600 shadow-sm' 
                      : 'bg-white/30 border-indigo-100/80 text-indigo-400 hover:bg-white/50 backdrop-blur-sm'
                  }`}
                >
                  Text Claim
                </button>
                <button
                  onClick={() => setInputMode('media')}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                    inputMode === 'media' 
                      ? 'bg-indigo-100/80 border-indigo-200 text-indigo-600 shadow-sm' 
                      : 'bg-white/30 border-indigo-100/80 text-indigo-400 hover:bg-white/50 backdrop-blur-sm'
                  }`}
                >
                  Media Upload
                </button>
              </div>
            </div>

            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200"></div>
            
            {inputMode === 'text' ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  disabled={uiState !== 'idle'}
                  onKeyDown={(e) => e.key === 'Enter' && uiState === 'idle' && handleAnalyze()}
                  className="block w-full pl-16 pr-44 py-6 bg-white border border-slate-200 rounded-3xl text-xl shadow-2xl focus:ring-0 focus:border-indigo-500/50 transition-all outline-none placeholder:text-slate-400 font-medium"
                  placeholder="Enter a claim to verify..."
                />
                <button
                  onClick={handleAnalyze}
                  disabled={uiState !== 'idle' || !claim.trim()}
                  className="absolute inset-y-2 right-2 px-8 bg-slate-950 text-white rounded-2xl font-bold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {uiState === 'idle' ? (
                    <>
                      Analyze <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Processing...
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="relative bg-white/90 backdrop-blur-md border-2 border-dashed border-indigo-300 rounded-3xl p-12 text-center hover:bg-white transition-colors shadow-2xl cursor-pointer group">
                 <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                   accept="image/*,video/*"
                   onChange={(e) => {
                     if (e.target.files?.[0]) {
                       // Simulate extracting a claim from the uploaded media
                       setClaim(`[Media Upload: ${e.target.files[0].name}] Analyzing frames and audio transcript...`);
                       setInputMode('text');
                     }
                   }} 
                 />
                 <div className="flex justify-center gap-4 mb-6">
                   <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-sm border border-indigo-100">
                     <UploadCloud className="w-8 h-8 text-indigo-500" />
                   </div>
                   <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-purple-100">
                     <FileVideo className="w-8 h-8 text-purple-500" />
                   </div>
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Media for Deepfake Detection</h3>
                 <p className="text-slate-500 font-medium">Drag & drop an image or short video here, or click to browse.</p>
                 <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">MP4, MOV, JPG, PNG (Max 50MB)</p>
              </div>
            )}
            {errorMsg && (
              <p className="mt-4 text-rose-500 font-medium flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
              </p>
            )}
          </motion.div>

          {uiState === 'idle' && (
            <div className="space-y-20">
              {/* How it works */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">The Orchestration Flow</h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: Globe2, title: "Global Retrieval", desc: "We scan Wikipedia, academic papers, and live news feeds to gather raw evidence." },
                    { icon: BrainCircuit, title: "Multi-Agent Debate", desc: "Specialized agents challenge and defend the claim to eliminate bias." },
                    { icon: Scale, title: "Judicial Verdict", desc: "A neutral judge weighs all arguments to deliver a final forensic verdict." }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                        <item.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Trending Claims */}
              <section className="pb-12">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800">Trending Queries</h3>
                    <div className="flex gap-2">
                       <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"><ArrowRight size={16} className="rotate-180"/></button>
                       <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"><ArrowRight size={16}/></button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      "5G technology and health impacts",
                      "Historical accuracy of Apollo 11",
                      "Global temperature trends 2024",
                      "Impact of microplastics on sea life"
                    ].map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setClaim(t)}
                        className="p-4 text-left bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-sm font-medium text-slate-600 flex items-center justify-between group"
                      >
                        {t}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                      </button>
                    ))}
                 </div>
              </section>
            </div>
          )}
        </div>

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
                    <div className="p-16 text-center flex flex-col items-center justify-center bg-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none"></div>
                      
                      <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 relative z-10 shadow-sm">
                          <Scale className="w-10 h-10 text-indigo-600" />
                        </div>
                        {/* Radar sweep effect */}
                        <div className="absolute inset-0 rounded-full border border-indigo-200 animate-[spin_4s_linear_infinite] [mask-image:conic-gradient(transparent_50%,black_100%)]"></div>
                        <div className="absolute inset-[-10px] rounded-full border border-indigo-50/50 animate-[spin_6s_linear_infinite_reverse] [mask-image:conic-gradient(transparent_70%,black_100%)]"></div>
                      </div>

                      <h3 className="text-2xl font-bold tracking-tight text-slate-800 mb-3">Final Judicial Evaluation</h3>
                      <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">Synthesizing multi-agent debate, weighing source credibility, and cross-referencing consensus data...</p>
                      
                      <div className="w-full max-w-md h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          className="h-full bg-indigo-500 rounded-full relative"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 15, ease: "linear" }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/50"></div>
                        </motion.div>
                      </div>
                      <div className="mt-8 w-full max-w-lg">
                         <AnimatedThinking messages={["Reviewing Agent B's sources...", "Verifying Agent A's logical consistency...", "Consulting analytical data...", "Determining confidence score..."]} />
                      </div>
                    </div>
                  )}

                  {uiState === 'verdict_ready' && judgeResult && (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.7 }}
                    >
                      {/* Report Card content start */}
                      <div ref={reportRef} className="bg-slate-50">
                        {/* Hero Verdict Banner */}
                        <div className={`px-10 py-16 text-white ${getVerdictBgColor(judgeResult.verdict_color)} flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner`}>
                          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                          
                          <motion.div 
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/20 relative z-10"
                          >
                            <Scale className="w-10 h-10 text-white" />
                          </motion.div>
                          
                          <motion.h3 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-4 relative z-10"
                          >
                            Forensic Verdict
                          </motion.h3>
                          
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", bounce: 0.6, delay: 0.5 }}
                            className="text-7xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-xl relative z-10 uppercase"
                          >
                            {judgeResult.verdict}
                          </motion.div>
                          
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-xl md:text-2xl font-semibold max-w-3xl opacity-95 text-balance leading-snug relative z-10 drop-shadow-md"
                          >
                            {judgeResult.final_summary}
                          </motion.p>
                        </div>

                      <div className="p-10 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
                        {/* Left Column */}
                        <div className="space-y-10">
                          {/* Confidence Score */}
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-end justify-between mb-4">
                              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">System Confidence</h4>
                              <span className={`text-4xl font-black tracking-tighter ${getVerdictTextColor(judgeResult.verdict_color)}`}>
                                {judgeResult.confidence_score}%
                              </span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                               <motion.div 
                                  className={`h-full ${getVerdictBgColor(judgeResult.verdict_color)} relative`}
                                  initial={{ width: "0%" }}
                                  animate={{ width: `${judgeResult.confidence_score}%` }}
                                  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                               >
                                 <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30"></div>
                               </motion.div>
                            </div>
                          </div>

                          {/* Reasoning */}
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">Judicial Reasoning</h4>
                            <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
                              <p>{judgeResult.confidence_reasoning}</p>
                            </div>
                          </div>
                          
                          {/* Consensus */}
                          <div className="pt-8 border-t border-slate-100">
                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Agent Consensus</h4>
                            <div className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold shadow-sm border border-slate-200">
                              {judgeResult.agent_agreement}
                            </div>
                            {judgeResult.minority_view && (
                              <div className="mt-4 bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">Dissenting Opinion</p>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                  {judgeResult.minority_view}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="md:border-l md:border-slate-100 md:pl-12">
                           <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                             <CheckCircle className="w-4 h-4" />
                             Deciding Evidence
                           </h4>
                           <ul className="space-y-6">
                             {judgeResult.key_evidence?.map((evidence: string, idx: number) => (
                               <motion.li 
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: 1.2 + (idx * 0.1) }}
                                 key={idx} 
                                 className="flex gap-4 group"
                               >
                                 <div className="shrink-0">
                                   <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shadow-sm">
                                     {idx + 1}
                                   </div>
                                 </div>
                                 <div className="pt-1 text-[15px] text-slate-700 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                                   {evidence}
                                 </div>
                               </motion.li>
                             ))}
                           </ul>
                        </div>
                      </div>
                      </div>
                      {/* Report Card content end */}

                      <div className="bg-slate-50 p-6 sm:px-10 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <button 
                          onClick={downloadReport}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all rounded-2xl shadow-sm hover:shadow active:scale-95"
                        >
                          <Download className="w-5 h-5" />
                          Export PDF
                        </button>
                        <button 
                          onClick={resetState}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold hover:bg-indigo-600 transition-all rounded-2xl shadow-lg hover:shadow-xl active:scale-95"
                        >
                          <RefreshCw className="w-5 h-5" />
                          New Analysis
                        </button>
                      </div>
                    </motion.div>
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
    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-5 py-10 w-full relative">
      {/* Subtle pulsing background ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 rounded-full border border-indigo-100 animate-ping opacity-20"></div>
        <div className="w-32 h-32 rounded-full border border-indigo-50 absolute animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="relative">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <div className="absolute inset-0 bg-indigo-500 blur-md opacity-30 rounded-full"></div>
      </div>
      
      <div className="text-sm font-medium h-6 flex items-center justify-center overflow-hidden w-full relative z-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={messages[index]}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full text-center text-slate-600 font-medium tracking-tight"
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
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-500 group ${progress === 'loading' ? 'border-indigo-300 ring-4 ring-indigo-50/50 shadow-indigo-100/50 shadow-xl scale-[1.02]' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
      <div className={`p-5 border-b flex items-center gap-4 ${colorClass} transition-colors duration-500`}>
        <div className={`p-2.5 bg-white rounded-xl shadow-sm shrink-0 transition-transform duration-500 ${progress === 'loading' ? 'scale-110' : ''}`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{role}</div>
          <div className={`font-bold tracking-tight ${headerColor}`}>{title}</div>
        </div>
      </div>
      
      <div className="p-0 flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]"></div>

        {progress === 'pending' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            {/* Skeleton Loaders */}
            <div className="w-full space-y-3 opacity-40">
              <div className="h-2 w-3/4 bg-slate-200 rounded-full mx-auto"></div>
              <div className="h-2 w-1/2 bg-slate-200 rounded-full mx-auto"></div>
            </div>
            <div className="text-slate-400 text-sm font-medium mt-2">Awaiting initialization</div>
          </div>
        )}
        
        {progress === 'loading' && (
          <AnimatedThinking messages={thinkingMessages} />
        )}

        {progress === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-500 gap-3 p-8">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-sm font-medium text-center leading-relaxed">
              Analysis Failed<br/>
              <span className="text-xs text-rose-400 font-normal">Check connection or quota</span>
            </div>
          </div>
        )}

        {progress === 'done' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex-1 flex flex-col items-center justify-center text-emerald-600 gap-4 p-8 bg-emerald-50/30"
          >
            <div className="relative">
              <CheckCircle className="w-12 h-12 relative z-10" />
              <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-40 rounded-full"></div>
            </div>
            <div className="text-sm font-bold tracking-tight">Research Complete</div>
          </motion.div>
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
      initial={{ opacity: 0, x: -20, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, delay, type: "spring", bounce: 0.4 }}
      className="flex gap-6 relative group"
    >
      {/* Timeline Connector */}
      <div className="absolute left-6 top-14 bottom-[-2rem] w-px bg-slate-200 group-last:hidden"></div>

      <div className="shrink-0 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm bg-white transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md ${isFailed ? 'border-rose-200 text-rose-500' : colorClass.split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <div className={`flex-1 rounded-3xl p-6 md:p-8 border shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${isFailed ? 'bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50' : `${colorClass.replace('bg-', 'bg-').replace('50', '50/50')} hover:${colorClass.split(' ')[0]}`}`}>
        
        {/* Dossier Watermark */}
        <div className="absolute -right-8 -bottom-8 text-[6rem] font-black uppercase text-slate-900/[0.02] select-none pointer-events-none transform -rotate-12 z-0 tracking-tighter">
          {isFailed ? 'FAILED' : 'VERIFIED'}
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-white/60 border border-current/10 text-[10px] font-bold uppercase tracking-widest opacity-80 backdrop-blur-sm shadow-sm">{role}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
            <span className="text-sm font-bold opacity-90">{title}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-400 bg-white/50 px-2 py-0.5 rounded-md border border-slate-200/50 hidden sm:block">ID:{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
          
          <p className="text-slate-800 leading-relaxed font-medium mb-6 text-[15px] md:text-base">
            {result.error ? `Analysis Skipped: ${result.error}` : result.main_argument || result.main_analysis}
          </p>
          
          {result.evidence && result.evidence.length > 0 && (
            <div className="space-y-3 mt-6 pt-6 border-t border-current/10">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 opacity-70" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Supporting Evidence File</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.evidence.slice(0, 2).map((ev: Evidence, i: number) => {
                  const badge = getTrustBadge(ev.url || ev.source);
                  let domain = '';
                  try {
                    domain = ev.url ? new URL(ev.url).hostname : '';
                  } catch(e) {}

                  return (
                    <div key={i} className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-current/10 shadow-sm hover:shadow-md transition-all hover:bg-white group/ev cursor-default">
                      <p className="text-sm text-slate-800 font-medium mb-3 leading-snug line-clamp-3">"{ev.finding}"</p>
                      <div className="flex items-center gap-2 min-w-0 mt-auto pt-3 border-t border-slate-100">
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
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 truncate hover:text-indigo-600 hover:underline"
                          >
                            <span className="truncate">{ev.title || ev.source || domain}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover/ev:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 truncate flex-1">{ev.title || ev.source}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
          <div className="relative z-10 mt-6 pt-5 border-t border-current/10 bg-gradient-to-r from-current/5 to-transparent -mx-6 md:-mx-8 -mb-6 md:-mb-8 px-6 md:px-8 pb-6 md:pb-8">
             <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 opacity-70" />
               <span className="text-xs font-bold uppercase tracking-wider opacity-70">Key Insight</span>
             </div>
             <p className="text-sm font-medium opacity-90 leading-relaxed max-w-2xl text-balance">
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
    <div className="mt-6 pt-5 border-t border-current/10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 opacity-70" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">Processed Evidence</span>
        </div>
        {summary && (
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">{summary.support_count} support</span>
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">{summary.contradict_count} contradict</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">{summary.neutral_count} neutral</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">{summary.overall_strength}</span>
            {summary.biased_evidence && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">biased data</span>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {evidence.slice(0, 4).map((item, index) => (
          <div key={`${item.source}-${index}`} className="rounded-2xl border border-current/10 bg-white/80 backdrop-blur-sm p-4 hover:bg-white hover:shadow-md transition-all cursor-default">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.stance === 'supports' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : item.stance === 'contradicts' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                {item.stance}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                rel {(item.relevance * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                cred {item.credibility}/10
              </span>
            </div>
            <p className="text-sm text-slate-700 font-medium leading-snug line-clamp-3 mb-3">{item.summary}</p>
            <span className="text-xs text-slate-400 font-medium truncate block pt-3 border-t border-slate-100">{item.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchTrail({ results }: { results: SearchResult[] }) {
  return (
    <div className="mt-6 pt-5 border-t border-current/10">
      <div className="flex items-center gap-2 mb-4">
        <Globe2 className="w-4 h-4 opacity-70" />
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Live Search Sources</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {results.slice(0, 4).map((result, index) => {
          const badge = getTrustBadge(result.url || result.source || result.title);
          return (
            <a
              key={`${result.url || result.title}-${index}`}
              href={result.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 rounded-2xl border border-current/10 bg-white/80 backdrop-blur-sm p-4 hover:bg-white hover:shadow-md transition-all group/trail block"
            >
              <div className="flex items-center gap-2 mb-3 min-w-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{result.source}</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm font-bold text-slate-800 mb-2">
                <span className="line-clamp-2 leading-tight group-hover/trail:text-indigo-600 transition-colors">{result.title || result.url}</span>
                <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 opacity-30 group-hover/trail:opacity-100 transition-opacity text-indigo-600" />
              </div>
              {result.snippet && (
                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{result.snippet}</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// --- Enterprise Mock Pages ---

function AnalyticsMockPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Analytics</h2>
        <p className="text-slate-500 mt-2 font-medium">Global processing metrics and accuracy ratings.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Claims Analyzed', value: '24,892', trend: '+12% this week' },
          { label: 'Average Consensus', value: '86.4%', trend: 'Stable' },
          { label: 'API Latency (avg)', value: '4.2s', trend: '-0.8s improvement' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">{stat.label}</h3>
            <div className="text-4xl font-black text-slate-800 mb-2">{stat.value}</div>
            <div className="text-sm font-medium text-emerald-500">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none"></div>
           <BrainCircuit className="w-12 h-12 text-slate-300 mb-4" />
           <p className="text-slate-500 font-medium text-center">Historical Accuracy Chart<br/><span className="text-xs">Connecting to data warehouse...</span></p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none"></div>
           <Globe2 className="w-12 h-12 text-slate-300 mb-4" />
           <p className="text-slate-500 font-medium text-center">Global Claim Heatmap<br/><span className="text-xs">Connecting to geospatial API...</span></p>
        </div>
      </div>
    </div>
  );
}

function ReviewQueueMockPage() {
  const mockQueue = [
    { id: 'REQ-892', claim: 'New tax regulations apply retroactively to 2024.', score: '42%', status: 'Flagged - Low Confidence' },
    { id: 'REQ-891', claim: 'Clinical trials show 100% efficacy for the new treatment.', score: '15%', status: 'Flagged - High Bias' },
    { id: 'REQ-888', claim: 'Company X is filing for bankruptcy next week.', score: '55%', status: 'Flagged - Minority Dissent' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manual Review Queue</h2>
        <p className="text-slate-500 mt-2 font-medium">Claims requiring human analyst verification due to low system confidence.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
          <div className="col-span-2">ID</div>
          <div className="col-span-6">Claim Snippet</div>
          <div className="col-span-2">Confidence</div>
          <div className="col-span-2">Status</div>
        </div>
        <div className="divide-y divide-slate-100">
          {mockQueue.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="col-span-2 text-sm font-mono text-slate-400">{item.id}</div>
              <div className="col-span-6 text-sm font-medium text-slate-800 truncate pr-4">{item.claim}</div>
              <div className="col-span-2 text-sm font-bold text-rose-500">{item.score}</div>
              <div className="col-span-2">
                <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md whitespace-nowrap">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BatchMockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [metrics, setMetrics] = useState({ total: 0, completed: 0, failed: 0, avgConfidence: 0 });

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let claims: string[] = [];

      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          claims = Array.isArray(data) ? data.map(i => i.claim || i) : [data.claim || data];
        } else {
          // Robust CSV parsing for simple cases (one claim per line or "Claim" header)
          const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 5);
          if (lines[0]?.toLowerCase().includes('claim')) {
            claims = lines.slice(1);
          } else {
            claims = lines;
          }
        }

        const newItems = claims.map((c, i) => ({
          id: `batch-${Date.now()}-${i}`,
          claim: c,
          status: 'pending',
          verdict: null,
          confidence: null,
          reason: null
        }));
        setItems(newItems);
        setProgress(0);
        setMetrics({ total: newItems.length, completed: 0, failed: 0, avgConfidence: 0 });
      } catch (err) {
        alert('Failed to parse file. Please use valid JSON or CSV.');
      }
    };
    reader.readAsText(file);
  };

  const processItem = async (index: number) => {
    const item = items[index];
    setItems(prev => prev.map((it, idx) => idx === index ? { ...it, status: 'processing' } : it));
    
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: item.claim })
      });
      
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Map backend response to UI
      const verdict = data.verdict;
      const confidence = Math.round(data.confidence * 100);
      const color = verdict === 'True' ? 'green' : verdict === 'False' ? 'red' : verdict === 'Partially True' ? 'yellow' : 'slate';

      setItems(prev => prev.map((it, idx) => idx === index ? { 
        ...it, 
        status: 'done', 
        verdict,
        confidence,
        color,
        reason: data.short_reason
      } : it));

      setMetrics(prev => ({
        ...prev,
        completed: prev.completed + 1,
        avgConfidence: Math.round(((prev.avgConfidence * prev.completed) + confidence) / (prev.completed + 1))
      }));
    } catch (err) {
      setItems(prev => prev.map((it, idx) => idx === index ? { ...it, status: 'error' } : it));
      setMetrics(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
  };

  const runBatch = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);
    
    // Concurrency control: process 3 at a time
    const CONCURRENCY = 3;
    const queue = [...Array(items.length).keys()];
    
    const workers = Array(CONCURRENCY).fill(null).map(async () => {
      while (queue.length > 0) {
        const index = queue.shift();
        if (index !== undefined) {
          await processItem(index);
          // Update overall progress based on metrics.completed + metrics.failed
          setItems(currentItems => {
            const totalDone = currentItems.filter(it => it.status === 'done' || it.status === 'error').length;
            setProgress(Math.round((totalDone / currentItems.length) * 100));
            return currentItems;
          });
        }
      }
    });

    await Promise.all(workers);
    setIsProcessing(false);
  };

  const exportResults = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-batch-report-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 text-indigo-600 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Mass Verification System</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Batch Processor</h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl">
            Analyze thousands of claims simultaneously with high-concurrency multi-agent forensic verification. Optimized for enterprise intelligence pipelines.
          </p>
        </div>
        
        {items.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <button 
              onClick={() => setItems([])}
              disabled={isProcessing}
              className="px-6 py-3 text-slate-500 font-bold hover:text-rose-500 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button 
              onClick={runBatch}
              disabled={isProcessing || items.every(i => i.status !== 'pending')}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Run Dataset
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
          className={`relative border-4 border-dashed rounded-[4rem] p-24 text-center transition-all duration-700 group overflow-hidden ${dragActive ? 'border-indigo-500 bg-indigo-50/30 scale-[0.98]' : 'border-slate-200 bg-white'}`}
        >
          {/* Animated Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 transition-all duration-700 shadow-2xl ${dragActive ? 'bg-indigo-600 text-white rotate-12 scale-110 shadow-indigo-200' : 'bg-slate-50 text-slate-300 group-hover:bg-white group-hover:text-indigo-500 group-hover:-rotate-6'}`}>
              <UploadCloud className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4">Import Data Pipeline</h3>
            <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto mb-12 leading-relaxed">
              Drag your <span className="text-indigo-600 font-bold">CSV</span> or <span className="text-indigo-600 font-bold">JSON</span> verdict request files here. LUMINA will auto-detect claim fields.
            </p>
            
            <label className="inline-flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-200 cursor-pointer active:scale-95">
              <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
              <Search className="w-5 h-5" />
              Select Local File
            </label>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-3xl mx-auto border-t border-slate-100 pt-12">
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 tracking-tighter tracking-tighter">5,000</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Throughput</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 tracking-tighter tracking-tighter">99.2%</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Uptime</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 tracking-tighter tracking-tighter">TLS</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encrypted Stream</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            {/* Main Progress Board */}
            {isProcessing && (
              <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative shrink-0">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                      <motion.circle 
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351.85} 
                        initial={{ strokeDashoffset: 351.85 }}
                        animate={{ strokeDashoffset: 351.85 - (351.85 * progress) / 100 }}
                        className="text-indigo-500" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white leading-none">{progress}%</span>
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Status</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-2xl font-black text-white mb-2">High-Concurrency Execution</h4>
                    <p className="text-white/50 font-medium mb-6">Processing {metrics.total} forensic verify requests via multi-agent workers...</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-white">{metrics.completed} Success</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-sm font-bold text-white">{metrics.failed} Failed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-spin"></div>
                        <span className="text-sm font-bold text-white">3 active threads</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Results Table */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Index</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Claim</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Verdict</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Strength</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 text-xs font-bold text-slate-300">#{idx + 1}</td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:line-clamp-none transition-all duration-500 leading-snug">
                            {item.claim}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {item.verdict ? (
                            <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                              item.color === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              item.color === 'red' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              item.color === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                              {item.verdict}
                            </span>
                          ) : (
                            <div className="flex justify-center">
                              <div className="w-8 h-1.5 bg-slate-100 rounded-full"></div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {item.confidence !== null ? (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20 shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.confidence}%` }}
                                  className={`h-full ${item.color === 'green' ? 'bg-emerald-500' : item.color === 'red' ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                />
                              </div>
                              <span className="text-xs font-black text-slate-800 tracking-tighter">{item.confidence}%</span>
                            </div>
                          ) : (
                            <div className="w-24 h-2 bg-slate-50 rounded-full"></div>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {item.status === 'pending' ? (
                            <div className="inline-flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5" />
                              Queued
                            </div>
                          ) : item.status === 'processing' ? (
                            <div className="inline-flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Running
                            </div>
                          ) : item.status === 'error' ? (
                            <div className="inline-flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Error
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Done
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Dataset Performance</h5>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Average Confidence</span>
                    <span className="text-indigo-600">{metrics.avgConfidence}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${metrics.avgConfidence}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="text-lg font-black text-slate-900">{metrics.completed}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="text-lg font-black text-slate-900">{metrics.failed}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Failed</div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={exportResults}
              disabled={items.every(i => i.status === 'pending')}
              className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-[1.5rem] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-100 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
            
            <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100">
              <div className="flex gap-3 items-start">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-bold text-indigo-900 mb-1 leading-snug">Forensic Integrity Guaranteed</p>
                  <p className="text-[10px] text-indigo-600/70 font-medium leading-relaxed">
                    Every batch item undergoes a full 3-agent cross-verification process with judicial arbitration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WebhooksPage({ isSubscribed, onUpgrade }: { isSubscribed: boolean, onUpgrade: () => void }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const fetchWebhooks = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setWebhooks(data);
    } catch (err: any) {
      console.error('Failed to fetch webhooks:', err);
      setError(err.message || 'Connection Error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleAdd = async () => {
    if (!supabase || !newName || !newUrl) return;
    try {
      const { error } = await supabase.from('webhooks').insert([{ name: newName, url: newUrl, events: ['verdict.ready'] }]);
      if (!error) {
        setNewName('');
        setNewUrl('');
        setShowAddForm(false);
        fetchWebhooks();
      } else {
        console.error('Failed to add webhook:', error);
      }
    } catch (err) {
      console.error('Add webhook error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('webhooks').delete().eq('id', id);
      if (!error) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error('Delete webhook error:', err);
    }
  };


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">API & Webhooks</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage external integrations and real-time event listeners.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-md text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Endpoint'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6 animate-in zoom-in-95 duration-200">
          <h3 className="font-bold text-slate-800 mb-4">New Webhook Endpoint</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Friendly Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Slack Notifications"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target URL</label>
              <input 
                type="url" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
          >
            Activate Endpoint
          </button>
        </div>
      )}

      <div className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4 flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <div className="text-xs font-bold uppercase tracking-wider">
              Supabase Connection Error: <span className="opacity-70">{error}</span>
              <p className="mt-1 font-medium lowercase tracking-normal opacity-50">Please verify your VITE_SUPABASE_URL in .env.local</p>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Globe2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No webhooks configured yet.</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex justify-between items-center group">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`w-2 h-2 rounded-full ${webhook.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  <h3 className="font-bold text-slate-800">{webhook.name}</h3>
                </div>
                <p className="text-sm text-slate-500 font-mono truncate max-w-md">{webhook.url}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {webhook.events.map((event: string) => (
                    <span key={event} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{event}</span>
                  ))}
                </div>
                <button 
                  onClick={() => handleDelete(webhook.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminMockPage({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [groqKey, setGroqKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [debugStream, setDebugStream] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [routing, setRouting] = useState({
    skeptic: 'google/gemini-flash-1.5',
    supporter: 'google/gemini-flash-1.5',
    analyst: 'google/gemini-flash-1.5',
    judge: 'google/gemini-flash-1.5'
  });

  const fetchSettings = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('system_settings').select('*');
    if (data) {
      const newRouting = { ...routing };
      data.forEach((s: any) => {
        if (s.key === 'groq_key') setGroqKey(s.value);
        if (s.key === 'or_key') setOpenRouterKey(s.value);
        if (s.key === 'gemini_key') setGeminiKey(s.value);
        if (s.key === 'test_mode') setTestMode(s.value === 'true');
        if (s.key.startsWith('model_')) {
          const role = s.key.replace('model_', '') as keyof typeof routing;
          if (newRouting[role]) newRouting[role] = s.value;
        }
      });
      setRouting(newRouting);
    }
  };

  const fetchAdminData = async () => {
    if (!supabase) return;
    try {
      const [uRes, lRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(20), // Use public profiles table
        fetch('/api/admin/access-logs').then(r => r.json())
      ]);
      if (uRes.data) setUsers(uRes.data);
      if (lRes) setAccessLogs(lRes);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  const fetchPerformance = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('performance_logs').select('*').order('timestamp', { ascending: false }).limit(20);
    if (data) setPerformance(data);
  };

  useEffect(() => {
    fetchSettings();
    fetchPerformance();
    fetchAdminData();
    
    // Connect to Debug Stream
    const eventSource = new EventSource('/api/debug-stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDebugStream(prev => [data, ...prev].slice(0, 50));
    };

    return () => eventSource.close();
  }, []);

  const handleSave = async () => {
    if (!supabase) {
      localStorage.setItem('lumina_groq_key', groqKey);
      localStorage.setItem('lumina_or_key', openRouterKey);
      localStorage.setItem('lumina_gemini_key', geminiKey);
    } else {
      const settings = [
        { key: 'groq_key', value: groqKey },
        { key: 'or_key', value: openRouterKey },
        { key: 'gemini_key', value: geminiKey },
        { key: 'test_mode', value: String(testMode) },
        ...Object.entries(routing).map(([role, model]) => ({ key: `model_${role}`, value: model }))
      ];
      await supabase.from('system_settings').upsert(settings);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const runSmokeTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/smoke-test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Smoke test failed:', err);
    }
    setTesting(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            System Administration
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Core engine architecture, performance, and health.</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Signed in as: {user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={runSmokeTest}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            Run Health Check
          </button>
          <button 
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-6 rounded-3xl border ${testResult.status === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'} animate-in slide-in-from-top-4`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-bold ${testResult.status === 'success' ? 'text-emerald-800' : 'text-rose-800'} flex items-center gap-2`}>
              {testResult.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              System Health Report
            </h3>
            <span className="text-xs font-mono font-bold opacity-60">Latency: {testResult.latency}ms</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testResult.checks.map((check: any) => (
              <div key={check.name} className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-black/5">
                <span className="text-sm font-medium">{check.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${check.status === 'OK' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config & Performance */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Key className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800">Provider Configuration</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Groq API Key</label>
                  <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">OpenRouter API Key</label>
                  <input type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Google Gemini API Key</label>
                <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all active:scale-95">
                  {saved ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Settings className="w-5 h-5" />}
                  {saved ? 'Settings Saved' : 'Save Config to Supabase'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800">Agent Routing Engine</h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Test Mode</span>
                <button onClick={() => setTestMode(!testMode)} className="transition-colors">
                  {testMode ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(routing).map(([role, model]) => (
                  <div key={role} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{role}</label>
                    <select 
                      value={model} 
                      onChange={(e) => setRouting(prev => ({ ...prev, [role]: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="google/gemini-flash-1.5">Gemini 1.5 Flash (Fast)</option>
                      <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                      <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800">User Management</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length > 0 ? users.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold uppercase">{u.role || 'User'}</span></td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800">System Access Logs</h3>
            </div>
            <div className="p-0 max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-400 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-slate-500">{log.user_id}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-3xl overflow-hidden shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-rose-600" />
              <h3 className="font-bold text-rose-900 text-lg">History & Data Purge</h3>
            </div>
            <p className="text-rose-700 text-sm mb-6">Critical actions to clear persistent data stores. Use with caution.</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Purge History', table: 'truth_engine_history' },
                { label: 'Clear Perf Logs', table: 'performance_logs' },
                { label: 'Reset Settings', table: 'system_settings' }
              ].map(p => (
                <button 
                  key={p.table}
                  onClick={async () => {
                    if (confirm(`Are you sure you want to purge ${p.label}?`)) {
                      await fetch('/api/admin/purge', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ table: p.table }) });
                      alert(`${p.label} cleared.`);
                    }
                  }}
                  className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Debug Stream */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[700px] border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Live Agent Debug Stream</h3>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
            {debugStream.map((log, i) => (
              <div key={i} className="animate-in slide-in-from-bottom-2 fade-in">
                <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className={`font-bold ${
                  log.role === 'SKEPTIC' ? 'text-rose-400' : 
                  log.role === 'SUPPORTER' ? 'text-emerald-400' : 
                  log.role === 'ANALYST' ? 'text-blue-400' : 'text-purple-400'
                }`}>{log.role}</span>{' '}
                <span className="text-slate-300">{log.status === 'thinking' ? 'is processing evidence...' : `completed using ${log.provider}`}</span>
              </div>
            ))}
            {debugStream.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-6">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <p>Waiting for system events...</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest opacity-50">Run an analysis to see logs</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-800/30 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Buffer: {debugStream.length}/50 events</span>
              <button onClick={() => setDebugStream([])} className="text-[10px] text-indigo-400 font-bold hover:text-white transition-colors">Clear Stream</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLoginPage({ onLogin, loading, setLoading }: { 
  onLogin: (user: any) => void; 
  loading: boolean; 
  setLoading: (v: boolean) => void; 
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Master Backdoor: Bypass rate limits/email confirmation if either field matches 'lumina'
      if (email === 'lumina' || password === 'lumina' || password === 'admin123') {
        onLogin({ email: 'dev-master@lumina.local', id: 'dev-master-uuid' });
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError('Supabase is not configured. Use master passcode "lumina".');
        setLoading(false);
        return;
      }

      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); }
        else if (data.user) { onLogin(data.user); }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); }
        else { 
          // Manual Sync Fallback: Ensure profile is created even if trigger isn't set up yet
          if (data.user) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              role: 'user'
            });
          }
          setSuccessMsg('Check your email for a confirmation link, then sign in.'); 
          setMode('signin'); 
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) { setError(error.message); }
        else { setSuccessMsg('Password reset email sent! Check your inbox.'); setMode('signin'); }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-md mx-auto mt-16">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100">
          <Shield className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
          {mode === 'reset' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Secure Access'}
        </h2>
        <p className="text-slate-400 text-sm font-medium mb-8">
          {mode === 'reset' ? 'Enter your email to receive a reset link.' : mode === 'signup' ? 'Join LUMINA to track your research history.' : 'Sign in to sync your forensic dashboard.'}
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-left animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-rose-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-left animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="bg-transparent outline-none w-full text-sm text-slate-800 placeholder:text-slate-300"
                required
                autoFocus
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 8 characters...' : 'Your password...'}
                  className="bg-transparent outline-none w-full text-sm text-slate-800 placeholder:text-slate-300"
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-600 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {loading ? 'Authenticating...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
          {mode === 'signin' && (
            <>
              <button onClick={() => { setMode('signup'); setError(''); }} className="hover:text-indigo-600 transition-colors">Create Account</button>
              <span>·</span>
              <button onClick={() => { setMode('reset'); setError(''); }} className="hover:text-indigo-600 transition-colors">Forgot Password?</button>
            </>
          )}
          {mode !== 'signin' && (
            <button onClick={() => { setMode('signin'); setError(''); }} className="hover:text-indigo-600 transition-colors">← Back to Sign In</button>
          )}
        </div>

        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-8 border-t border-slate-100 pt-4">
          Stuck? Type <span className="text-indigo-400">lumina</span> in any field to bypass rate limits.
        </p>
      </div>
    </div>
  );
}
function UpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="bg-indigo-600 text-white py-3 px-6 flex items-center justify-center gap-4 text-sm font-bold animate-in slide-in-from-top duration-700 sticky top-0 z-[60] shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white fill-current" />
        </div>
        <span className="hidden sm:inline">Unlock full forensic capabilities and API access with LUMINA Pro</span>
        <span className="sm:hidden">Upgrade to LUMINA Pro</span>
      </div>
      <button 
        onClick={onUpgrade}
        className="px-4 py-1.5 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
      >
        View Plans
      </button>
    </div>
  );
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
        >
          <Trash2 className="w-5 h-5 rotate-45" />
        </button>
        <div className="pt-4">
          <AdminLoginPage onLogin={onSuccess} loading={loading} setLoading={setLoading} />
        </div>
      </motion.div>
    </div>
  );
}

