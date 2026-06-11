import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0a0a0a] font-mono overflow-hidden"
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 p-12 flex flex-col justify-center gap-6">
        <div className="overflow-hidden">
          <motion.div
            className="border-l-4 border-[#22c55e] bg-[#0d0f0a] p-6 w-[60vw]"
            initial={{ x: '-100%' }}
            animate={{ x: phase >= 1 ? '0%' : '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="text-[#22c55e] text-[1.5vw] font-bold mb-2">GITHUB</div>
            <div className="text-[#f8fafc] text-[2vw]">PR #492 merged to main</div>
          </motion.div>
        </div>

        <div className="overflow-hidden self-end">
          <motion.div
            className="border-r-4 border-[#d97706] bg-[#0d0f0a] p-6 w-[50vw] text-right"
            initial={{ x: '100%' }}
            animate={{ x: phase >= 2 ? '0%' : '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="text-[#d97706] text-[1.5vw] font-bold mb-2">SLACK</div>
            <div className="text-[#f8fafc] text-[2vw]">@team decided to use RS256</div>
          </motion.div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="border-l-4 border-[#ef4444] bg-[#0d0f0a] p-6 w-[70vw]"
            initial={{ x: '-100%' }}
            animate={{ x: phase >= 3 ? '0%' : '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="text-[#ef4444] text-[1.5vw] font-bold mb-2">LINEAR</div>
            <div className="text-[#f8fafc] text-[2vw]">Blocker: API spec updated in CORE-11</div>
          </motion.div>
        </div>

        {phase >= 4 && (
          <motion.div 
            className="absolute inset-0 bg-[#0a0a0a]/80 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-hidden">
              <motion.h2 
                className="text-[8vw] font-bold text-[#ef4444] border-y-4 border-[#ef4444] py-4"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                OVERWHELM
              </motion.h2>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
