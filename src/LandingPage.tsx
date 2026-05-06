import React from 'react';
import { motion } from 'motion/react';
import { 
  Music2, 
  Facebook, 
  Twitter, 
  Youtube, 
  Instagram, 
  Github,
  ArrowRight, 
  Sparkles,
  BrainCircuit,
  Globe2,
  Shield,
  Activity
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <main className="relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[0]"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4" type="video/mp4" />
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-7xl px-6 flex-1 flex flex-col items-center">
        
        {/* Upper CTA Section */}
        <div className="mt-32 md:mt-48 text-center flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 text-xs font-medium text-white/90 uppercase tracking-widest"
          >
            <Sparkles size={14} className="text-indigo-400" />
            Empowering Global Truth
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] drop-shadow-2xl"
          >
            Clarity in a World <br /> of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Complexity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-white font-medium max-w-2xl leading-relaxed bg-black/40 backdrop-blur-md px-8 py-5 rounded-3xl border border-white/10 shadow-2xl drop-shadow-lg"
          >
            The world's most advanced multi-agent AI engine for real-time fact-checking and forensic data analysis. Join the mission for global clarity.
          </motion.p>

          <motion.button
            onClick={onEnter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all group"
          >
            Enter Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Premium Glassmorphic Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="relative w-full overflow-hidden rounded-[3rem] p-12 sm:p-20 shadow-2xl border border-white/20 mt-32 md:mt-64 mb-10"
        >
          {/* Dynamic Background Image */}
          <div 
            className="absolute inset-0 z-0 scale-110 blur-[1px]"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070")', 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            }}
          ></div>
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xl z-10"></div>
          
          <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 sm:gap-20">
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-lg text-white">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Lumina</h2>
              </div>
              <p className="text-indigo-50/70 text-base font-medium leading-relaxed max-w-sm">
                Lumina is a decentralized multi-agent orchestration engine designed for high-fidelity truth discovery and automated forensic analysis.
              </p>
              <div className="flex items-center gap-6 pt-4 text-white/50">
                <button className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors"><Github className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors"><Globe2 className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 opacity-80">Technology</h4>
              <ul className="space-y-4">
                {['Agent Routing', 'Semantic Search', 'Batch Pipeline', 'Webhook Engine', 'API Specs'].map(item => (
                  <li key={item}><button className="text-sm font-bold text-indigo-50/60 hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 opacity-80">Research</h4>
              <ul className="space-y-4">
                {['Forensic Truth', 'AI Transparency', 'Open Research', 'Ethics & Safety', 'Verification Guide'].map(item => (
                  <li key={item}><button className="text-sm font-bold text-indigo-50/60 hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 opacity-80">Legal</h4>
              <ul className="space-y-4">
                {['Privacy Policy', 'Terms of Use', 'Security Reports', 'GDPR Compliance', 'Cookie Policy'].map(item => (
                  <li key={item}><button className="text-sm font-bold text-indigo-50/60 hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Row from Screenshot */}
          <div className="relative z-20 mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">© 2024 Lumina Forensic Labs</p>
            <div className="flex gap-8 items-center opacity-40 text-white">
              <Globe2 className="w-4 h-4" />
              <div className="w-1 h-1 rounded-full bg-white/50"></div>
              <Shield className="w-4 h-4" />
              <div className="w-1 h-1 rounded-full bg-white/50"></div>
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
};
