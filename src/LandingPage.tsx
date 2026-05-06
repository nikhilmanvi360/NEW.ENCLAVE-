import React from 'react';
import { motion } from 'motion/react';
import { 
  Music2, 
  Facebook, 
  Twitter, 
  Youtube, 
  Instagram, 
  ArrowRight, 
  Sparkles 
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

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white mt-32 md:mt-64 mb-10"
        >
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
            {/* Column 1: Logo & Description */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
                </svg>
                <span className="text-xl font-medium tracking-tight text-white">LUMINA</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm text-white font-medium drop-shadow-sm">
                Lumina provides premium clarity on global events and cosmic wonders - shared with all for free.
              </p>
            </div>

            {/* Column 2: Links */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">Discover</h4>
                <ul className="text-xs space-y-2 text-white/90">
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Labs & Workshops</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Deep Dive Series</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Global Circle</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Resource Vault</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Future Roadmap</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">The Mission</h4>
                <ul className="text-xs space-y-2 text-white/90">
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Origin Story</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">The Collective</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Newsroom Hub</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Join the Team</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">Concierge</h4>
                <ul className="text-xs space-y-2 text-white/90">
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Get in Touch</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Legal Privacy</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">User Agreement</a></li>
                  <li><a href="#" className="hover:text-white hover:underline transition-colors">Report Concern</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {[Music2, Facebook, Twitter, Youtube, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="opacity-80 hover:opacity-100 transition-colors text-white">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
};
