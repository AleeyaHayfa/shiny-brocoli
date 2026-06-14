import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Terminal, Volume2, VolumeX } from 'lucide-react';

// Implements web-audio retro rpg sound generator
export function playSystemSound(type: 'levelup' | 'quest' | 'click' | 'warning') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!ctx) return;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'quest') {
      // 2-tone level up start-like beep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(600, ctx.currentTime);
      osc1.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } else if (type === 'levelup') {
      // Breathtaking retro sci-fi arpeggio ascent
      let time = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.3);
        time += 0.06;
      });
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (error) {
    console.error('Audio synthesizer failed to trigger due to browser interaction limits.');
  }
}

interface LevelUpProps {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpProps) {
  const [muted, setMuted] = React.useState(false);

  useEffect(() => {
    if (!muted) {
      playSystemSound('levelup');
    }
  }, [level, muted]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative w-full max-w-md p-8 border border-system-cyan/40 bg-scanlines bg-system-dark text-center rounded-sm overflow-hidden"
          id="levelup-alert-card"
        >
          {/* Hexagonal corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-system-cyan"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-system-cyan"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-system-cyan"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-system-cyan"></div>

          {/* Glowing header banner */}
          <div className="relative mb-6">
            <span className="inline-block px-4 py-1 text-xs font-mono font-bold tracking-widest text-[#050505] bg-system-cyan uppercase italic rounded-none shadow-neon-cyan">
              System Notification
            </span>
            <button 
              onClick={() => {
                setMuted(!muted);
                playSystemSound('click');
              }}
              className="absolute right-0 top-0 text-gray-500 hover:text-system-cyan"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex items-center justify-center mx-auto mb-6 w-20 h-20 rounded-full border border-system-cyan bg-system-cyan/10 text-system-cyan shadow-neon-cyan"
          >
            <Sparkles size={40} className="animate-pulse" />
          </motion.div>

          {/* Immersive RPG Texts */}
          <h2 className="font-display text-4xl font-extrabold tracking-widest uppercase italic text-system-cyan glow-cyan mb-2">
            Level Up!
          </h2>
          <p className="font-mono text-xs text-gray-400 mb-6 tracking-wide">
            THE SYSTEM RECOGNIZED YOUR COMPLETED DAILY QUESTS. YOUR BODY AFFINITY IS ASCENDING.
          </p>

          <div className="p-4 rounded-none border border-system-border bg-system-black mb-6 inline-flex flex-col items-center justify-center min-w-[200px]">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
              Current Tier
            </span>
            <span className="font-display text-5xl font-black text-white italic tracking-tighter">
              Lvl {level}
            </span>
            <span className="font-mono text-[10px] text-system-cyan tracking-wider mt-2.5 bg-system-cyan/10 px-2.5 py-0.5 rounded-none border border-system-cyan/20">
              ROLE: S-RANK HEIR
            </span>
          </div>

          {/* RPG Stats growth mockup */}
          <div className="space-y-2.5 max-w-xs mx-auto mb-8 font-mono text-xs text-left text-gray-300">
            <div className="flex justify-between items-center border-b border-system-border pb-1.5">
              <span className="text-gray-500 font-bold">STRENGTH [STR]</span>
              <span className="text-system-cyan font-bold">+1.2 Points</span>
            </div>
            <div className="flex justify-between items-center border-b border-system-border pb-1.5">
              <span className="text-gray-500 font-bold">STAMINA [STM]</span>
              <span className="text-system-cyan font-bold">+1.5 Points</span>
            </div>
            <div className="flex justify-between items-center border-b border-system-border pb-1.5">
              <span className="text-gray-500 font-bold">INTELLIGENCE [INT]</span>
              <span className="text-system-cyan font-bold">+1.0 Points</span>
            </div>
          </div>

          <button
            onClick={() => {
              playSystemSound('click');
              onClose();
            }}
            id="levelup-close-btn"
            className="w-full py-3.5 px-6 font-display font-black tracking-widest text-[#050505] bg-gradient-to-r from-system-cyan to-system-blue hover:brightness-110 active:scale-95 transition-all uppercase italic rounded-none border border-cyan-300 shadow-neon-cyan"
          >
            Accept Growth
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface PenaltyProps {
  onClose: () => void;
}

export function PenaltyAlert({ onClose }: PenaltyProps) {
  useEffect(() => {
    playSystemSound('warning');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 border border-red-500/40 bg-system-dark rounded-sm text-center relative"
        id="penalty-alert-card"
      >
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500"></div>
        
        <div className="flex items-center justify-center mx-auto mb-6 w-16 h-16 rounded-full border border-red-500 bg-red-950/20 text-red-500">
          <Shield size={32} className="animate-bounce" />
        </div>

        <span className="px-3 py-1 text-xs font-mono font-bold tracking-widest bg-red-600 text-white rounded-none uppercase italic">
          System Warning
        </span>

        <h2 className="font-display text-3xl font-extrabold tracking-wide uppercase italic text-red-500 mt-4 mb-2">
          Penalty Zone Threat!
        </h2>
        <p className="font-mono text-xs text-gray-400 mb-6">
          QUEST COMPLETION LEVEL DRIPPED TO ZERO FOR TODAY. COMMENCE ADAPTATION OR RISK ATTRIBUTES PENALIZATION!
        </p>

        <div className="p-4 rounded-none border border-red-500/20 bg-red-950/10 text-red-100 text-xs font-mono space-y-1 mb-8">
          <p>PENALTY TASK: COMPLETE 5 MINUTES PLANK EXTENSION HOLD ASAP TO PREVENT LEVEL DECAY RISK.</p>
        </div>

        <button
          onClick={() => {
            playSystemSound('click');
            onClose();
          }}
          className="w-full py-3 px-6 font-display font-black text-white bg-red-700 hover:bg-red-600 rounded-none transition-all uppercase italic tracking-widest shadow-lg"
        >
          Confirm Challenge
        </button>
      </motion.div>
    </div>
  );
}
