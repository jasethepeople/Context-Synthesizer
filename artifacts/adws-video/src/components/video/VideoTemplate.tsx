import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';

const SCENE_DURATIONS = { 
  open: 5000, 
  flood: 4000, 
  graph: 6000, 
  tier1: 6000, 
  tier2: 6000, 
  reverseQuery: 8000, 
  close: 8000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[#0a0a0a] font-mono">
      {/* Persistent global layers */}
      
      {/* 3% opacity grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none z-0"></div>
      
      {/* Persistent amber line that shifts */}
      <motion.div 
        className="absolute h-[2px] bg-[#d97706] z-50 shadow-[0_0_10px_#d97706]"
        animate={{
          left: ['0%', '20%', '0%', '10%', '0%', '5%', '25%'][currentScene],
          width: ['100%', '80%', '100%', '60%', '100%', '90%', '50%'][currentScene],
          bottom: ['15%', '25%', '15%', '10%', '15%', '20%', '15%'][currentScene],
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="open" />}
        {currentScene === 1 && <Scene2 key="flood" />}
        {currentScene === 2 && <Scene3 key="graph" />}
        {currentScene === 3 && <Scene4 key="tier1" />}
        {currentScene === 4 && <Scene5 key="tier2" />}
        {currentScene === 5 && <Scene6 key="query" />}
        {currentScene === 6 && <Scene7 key="close" />}
      </AnimatePresence>
    </div>
  );
}
