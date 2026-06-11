import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0d0f0a] flex items-center font-mono px-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="border-l-2 border-[#d97706] pl-8">
        <motion.h1 
          className="text-[5.5vw] font-bold text-[#f8fafc] leading-none tracking-tight"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -30 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          DEEP FOCUS
        </motion.h1>

        <motion.div 
          className="text-[4vw] font-bold text-[#d97706] mt-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : -30 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          IS SACRED.
        </motion.div>
        
        <motion.p 
          className="text-[1.8vw] text-[#22c55e] mt-10 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          &gt; But while you build, the org keeps moving.
        </motion.p>
      </div>
    </motion.div>
  );
}
