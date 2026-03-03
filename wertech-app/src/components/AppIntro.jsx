import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function AppIntro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3400);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[120] overflow-hidden bg-slate-950 text-white"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.04, 1, 1.04], rotate: [0, -3, 0] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-36 -right-32 h-[26rem] w-[26rem] rounded-full bg-orange-400/25 blur-3xl"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(236,72,153,0.24),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.2),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(249,115,22,0.2),transparent_40%)]" />

      <button
        type="button"
        onClick={onDone}
        className="absolute right-6 top-6 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/85 transition-all hover:bg-white/20"
      >
        Skip Intro
      </button>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/30 bg-fuchsia-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-fuchsia-100"
        >
          Smart Barter Network
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          className="mt-7"
        >
          <BrandLogo size={72} textClassName="text-[2.8rem] sm:text-[4rem] tracking-[0.12em]" tone="light" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-4 max-w-xl text-sm font-medium text-pink-50/85 sm:text-base"
        >
          Turning local skills, goods, and trust into a living exchange economy.
        </motion.p>

        <div className="mt-12 w-full max-w-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-orange-300 to-cyan-300"
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-3 text-xs uppercase tracking-[0.22em] text-white/55"
          >
            Initializing Community Protocol
          </motion.p>
        </div>

        <motion.button
          type="button"
          onClick={onDone}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-9 inline-flex items-center gap-2 rounded-2xl border border-fuchsia-200/30 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-wider text-fuchsia-50 transition-all hover:bg-white/20"
        >
          Enter Platform <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
