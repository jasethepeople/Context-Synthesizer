import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);
  const text = "Did anyone touch the auth middleware?";

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 bg-[#0a0a0a] font-mono p-16"
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="text-[#22c55e] text-[2vw] mb-12 border-b border-[#22c55e]/30 pb-4">
        REVERSE QUERY MODE
      </div>

      <div className="mb-12">
        <div className="text-[#d97706] text-[1.5vw] mb-2">QUERY:</div>
        <div className="text-[3vw] text-[#f8fafc] font-bold border-l-4 border-[#d97706] pl-6 py-2 bg-[#111]">
          {phase >= 1 && (
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
            >
              {text.split('').map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0 }}
                >
                  {char}
                </motion.span>
              ))}
              <motion.span 
                className="inline-block w-4 h-8 bg-[#d97706] ml-2 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {phase >= 2 && (
          <motion.div 
            className="flex-1 bg-[#0d0f0a] border border-[#22c55e] p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-[4vw] font-bold text-[#22c55e] leading-none mb-2">94%</div>
            <div className="text-[#f8fafc] text-[1.5vw] uppercase tracking-widest">Confidence Score</div>
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div 
            className="flex-2 flex flex-col gap-4 flex-[2]"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-[#111] border-l-2 border-[#d97706] p-4 text-[1.5vw] text-[#9ca3af]">
              <span className="text-[#f8fafc]">src/middleware/auth.ts</span> modified by @jchen
            </div>
            <div className="bg-[#111] border-l-2 border-[#22c55e] p-4 text-[1.5vw] text-[#9ca3af]">
              PR <span className="text-[#f8fafc]">#842</span>: "Update JWT validation strategy"
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
