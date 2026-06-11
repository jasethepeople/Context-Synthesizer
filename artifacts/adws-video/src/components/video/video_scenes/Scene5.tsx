import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0d0f0a] font-mono"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="h-full flex flex-col justify-center px-16">
        <div className="mb-8 overflow-hidden self-end">
          <motion.div
            className="text-[#d97706] text-[2vw] font-bold tracking-widest border border-[#d97706] inline-block px-4 py-1"
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.3 }}
          >
            TIER 2: ALIGNMENT SHIFTS
          </motion.div>
        </div>

        <div className="border-r-4 border-[#d97706] pr-8 space-y-6 text-right w-full">
          <div className="overflow-hidden flex justify-end">
            <motion.p 
              className="text-[3vw] text-[#f8fafc] font-bold"
              initial={{ y: '100%' }}
              animate={{ y: phase >= 1 ? '0%' : '100%' }}
              transition={{ duration: 0.3 }}
            >
              TEAM DECIDED: RS256.
            </motion.p>
          </div>
          
          <div className="overflow-hidden flex justify-end">
            <motion.p 
              className="text-[2.5vw] text-[#22c55e]"
              initial={{ y: '100%' }}
              animate={{ y: phase >= 2 ? '0%' : '100%' }}
              transition={{ duration: 0.3 }}
            >
              &gt; Your HS256 tokens invalidated in 48h.
            </motion.p>
          </div>
          
          <div className="overflow-hidden mt-8 flex justify-end">
            <motion.div 
              className="font-mono text-[#9ca3af] text-[1.5vw] bg-[#111] p-4 border border-[#d97706] text-left max-w-2xl"
              initial={{ scaleX: 0, originX: 1 }}
              animate={{ scaleX: phase >= 3 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              [Slack] @sarah: "Moving to RS256 for all new endpoints by Friday."<br/>
              [Linear] CORE-11 updated: Deprecate HS256.
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
