import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0a0a0a] flex flex-col justify-center items-center font-mono"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[80%] max-w-4xl text-center">
        <div className="overflow-hidden mb-8">
          <motion.h2 
            className="text-[4vw] font-bold text-[#f8fafc] leading-none"
            initial={{ y: '100%' }}
            animate={{ y: phase >= 1 ? '0%' : '100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            THE COST OF CONTEXT SWITCHING
          </motion.h2>
        </div>
        
        <div className="overflow-hidden mb-16">
          <motion.p 
            className="text-[2vw] text-[#22c55e]"
            initial={{ y: '100%' }}
            animate={{ y: phase >= 2 ? '0%' : '100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            SOLVED BY ADWS
          </motion.p>
        </div>

        <motion.div
          className="relative inline-block"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: phase >= 3 ? 1 : 0.8, opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          <div className="text-[8vw] font-bold text-[#d97706] tracking-tighter">
            ADWS
          </div>
          <div className="absolute top-0 left-full ml-4 text-[1vw] text-[#f8fafc] text-left border-l border-[#d97706] pl-4">
            <div>ASYNC</div>
            <div>DEEP WORK</div>
            <div>SYNTHESIZER</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
