import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
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
      className="absolute inset-0 bg-[#0a0a0a] font-mono"
      initial={{ y: '100%' }}
      animate={{ y: '0%' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="h-full flex flex-col justify-center px-16">
        <div className="mb-8 overflow-hidden">
          <motion.div
            className="text-[#ef4444] text-[2vw] font-bold tracking-widest border border-[#ef4444] inline-block px-4 py-1"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.3 }}
          >
            TIER 1: ACTIONABLE BLOCKERS
          </motion.div>
        </div>

        <div className="border-l-4 border-[#ef4444] pl-8 space-y-6">
          <div className="overflow-hidden">
            <motion.p 
              className="text-[3vw] text-[#f8fafc] font-bold"
              initial={{ y: '100%' }}
              animate={{ y: phase >= 1 ? '0%' : '100%' }}
              transition={{ duration: 0.3 }}
            >
              AUTH-88 MERGED INTO MAIN.
            </motion.p>
          </div>
          
          <div className="overflow-hidden">
            <motion.p 
              className="text-[2.5vw] text-[#d97706]"
              initial={{ y: '100%' }}
              animate={{ y: phase >= 2 ? '0%' : '100%' }}
              transition={{ duration: 0.3 }}
            >
              &gt; Your PR conflicts on line 47.
            </motion.p>
          </div>
          
          <div className="overflow-hidden mt-8">
            <motion.div 
              className="font-mono text-[#4b5563] text-[1.5vw] bg-[#111] p-4 border border-[#333]"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 3 ? 1 : 0 }}
              transition={{ duration: 0.1 }}
            >
              <span className="text-[#ef4444]">- function validateToken(token)</span><br/>
              <span className="text-[#22c55e]">+ async function validateToken(token, options)</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
