import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

export default function AppIntro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[120] overflow-hidden bg-white text-slate-900"
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1], x: [0, 20, 0], y: [0, -18, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-100 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.02, 1, 1.03], x: [0, -24, 0], y: [0, 16, 0] }}
        transition={{ duration: 7.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-28 h-[30rem] w-[30rem] rounded-full bg-cyan-100 blur-3xl"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,255,0.12),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(6,182,212,0.12),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f4faff_54%,#edf8ff_100%)]" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{
          y: ['100%', '0%', '-112%']
        }}
        transition={{ delay: 1.08, duration: 1, times: [0, 0.34, 1], ease: [0.22, 0.9, 0.24, 1] }}
        className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(180deg,#1d4ed8_0%,#00b7ff_45%,#72efff_100%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.92, 0] }}
        transition={{ delay: 1.08, duration: 1, times: [0, 0.24, 1], ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.28),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_48%)]"
      />

      <motion.div
        animate={{
          scale: [1, 1, 1.035, 1],
          y: [0, 0, -7, 0]
        }}
        transition={{ duration: 4, times: [0, 0.52, 0.62, 0.76], ease: 'easeInOut' }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <div className="mt-2 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, x: -320, rotate: -620, scaleX: 1.58, scaleY: 0.64, skewX: -12 }}
            animate={{
              opacity: 1,
              x: 0,
              rotate: 0,
              skewX: [-12, 8, -4, 0],
              scaleX: [1.58, 0.78, 1.14, 0.96, 1.03, 1],
              scaleY: [0.64, 1.22, 0.92, 1.04, 0.98, 1]
            }}
            transition={{ delay: 0.08, duration: 1.45, ease: [0.2, 0.9, 0.22, 1] }}
            className="relative"
          >
            <motion.div
              animate={{
                borderRadius: ['26%', '34%', '24%', '32%', '28%'],
                filter: [
                  'drop-shadow(0 10px 18px rgba(37,99,255,0.12))',
                  'drop-shadow(0 16px 30px rgba(0,183,255,0.18))',
                  'drop-shadow(0 10px 18px rgba(37,99,255,0.12))'
                ]
              }}
              transition={{ delay: 0.22, duration: 1.06, ease: 'easeInOut' }}
              className="relative will-change-transform"
            >
              <motion.div
                animate={{ opacity: [1, 1, 0, 1] }}
                transition={{ duration: 4, times: [0, 0.52, 0.62, 0.78], ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <BrandLogo size={92} withText={false} iconFill="white" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0, 0, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.52, 0.62, 0.78], ease: 'easeInOut' }}
              >
                <BrandLogo size={92} withText={false} squareFill="#ffffff" iconFill="#0f6dff" />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.95, duration: 0.5, ease: 'easeOut' }}
            className="mt-6"
          >
            <div className="relative">
              <motion.div
                animate={{ opacity: [1, 1, 0, 1] }}
                transition={{ duration: 4, times: [0, 0.52, 0.62, 0.78], ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <BrandLogo
                  size={72}
                  textClassName="text-[2.8rem] sm:text-[4rem] tracking-[0.12em]"
                />
              </motion.div>
              <motion.div
                animate={{ opacity: [0, 0, 1, 0], color: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }}
                transition={{ duration: 4, times: [0, 0.52, 0.62, 0.78], ease: 'easeInOut' }}
              >
                <BrandLogo
                  size={72}
                  squareFill="#ffffff"
                  iconFill="#0f6dff"
                  useSolidText
                  textClassName="text-[2.8rem] sm:text-[4rem] tracking-[0.12em]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, color: ['#64748b', '#64748b', '#ffffff', '#64748b'] }}
          transition={{ delay: 1.08, duration: 1.04, times: [0, 0.24, 0.62, 1], ease: 'easeInOut' }}
          className="mt-5 max-w-xl text-sm font-semibold sm:text-base"
        >
          Exchange skills. Build trust. Grow together.
        </motion.p>

        <div className="mt-10 w-full max-w-xs">
          <motion.div
            animate={{ backgroundColor: ['#e2e8f0', '#e2e8f0', 'rgba(255,255,255,0.36)', '#e2e8f0'] }}
            transition={{ delay: 1.08, duration: 1.04, times: [0, 0.24, 0.62, 1], ease: 'easeInOut' }}
            className="h-1.5 overflow-hidden rounded-full"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3.7, ease: 'easeInOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-300 via-cyan-300 to-cyan-100"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, color: ['#94a3b8', '#94a3b8', '#ffffff', '#94a3b8'] }}
            transition={{ delay: 1.16, duration: 0.98, times: [0, 0.24, 0.62, 1], ease: 'easeInOut' }}
            className="mt-3 text-[11px] uppercase tracking-[0.22em]"
          >
            Loading Wertech
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
