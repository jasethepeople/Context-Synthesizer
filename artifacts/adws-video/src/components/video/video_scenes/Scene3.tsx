import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0d0f0a] font-mono"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'inset(100% 0 0 0)' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div 
        className="absolute inset-0 opacity-50 bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/circuit-bg.png)` }}
      />
      
      <div className="absolute inset-0 bg-[#0d0f0a]/60" />

      <div className="relative z-10 w-full h-full p-16 flex flex-col justify-between">
        <div className="overflow-hidden">
          <motion.h2
            className="text-[4vw] font-bold text-[#d97706] tracking-tighter"
            initial={{ y: '-100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.4 }}
          >
            ADWS ABSORBS THE NOISE
          </motion.h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-[40vw] h-[40vw] max-h-[60vh] max-w-[60vh]">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Edges */}
              {phase >= 1 && (
                <>
                  <motion.path d="M 50 50 L 20 20" stroke="#d97706" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                  <motion.path d="M 50 50 L 80 30" stroke="#22c55e" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                  <motion.path d="M 50 50 L 30 80" stroke="#f8fafc" strokeWidth="0.5" opacity="0.3" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                  <motion.path d="M 50 50 L 80 80" stroke="#d97706" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                  <motion.path d="M 20 20 L 80 30" stroke="#22c55e" strokeWidth="0.2" opacity="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                </>
              )}

              {/* Nodes */}
              {phase >= 2 && (
                <>
                  <motion.circle cx="50" cy="50" r="4" fill="#0d0f0a" stroke="#d97706" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: 'spring' }} />
                  <motion.circle cx="20" cy="20" r="3" fill="#0d0f0a" stroke="#22c55e" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: 'spring', delay: 0.1 }} />
                  <motion.circle cx="80" cy="30" r="3" fill="#0d0f0a" stroke="#f8fafc" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: 'spring', delay: 0.2 }} />
                  <motion.circle cx="30" cy="80" r="2.5" fill="#0d0f0a" stroke="#d97706" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: 'spring', delay: 0.3 }} />
                  <motion.circle cx="80" cy="80" r="3.5" fill="#0d0f0a" stroke="#22c55e" strokeWidth="1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: 'spring', delay: 0.4 }} />
                </>
              )}
            </svg>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="text-[2.5vw] text-[#22c55e] border border-[#22c55e] px-4 py-2 inline-block bg-[#22c55e]/10"
            initial={{ y: '100%' }}
            animate={{ y: phase >= 3 ? '0%' : '100%' }}
            transition={{ duration: 0.3 }}
          >
            [ BUILDING EPISTEMIC GRAPH ]
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
