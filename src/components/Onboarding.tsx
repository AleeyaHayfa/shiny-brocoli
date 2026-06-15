import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { Lock, Sparkles, Trophy, Users, User, ArrowRight } from 'lucide-react';
import { playSystemSound } from './SystemAlert';

interface OnboardingProps {
  onComplete: (stats: PlayerStats) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState<string>('24');
  const [height, setHeight] = useState<string>('150'); // defaulted as requested
  const [currentWeight, setCurrentWeight] = useState<string>('68');
  const [targetWeight, setTargetWeight] = useState<string>('60');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [goal] = useState<'recomp' | 'fat_loss' | 'muscle_gain'>('recomp');
  const [isAwakening, setIsAwakening] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSystemSound('levelup');
    setIsAwakening(true);

    const stats: PlayerStats = {
      age: Number(age) || 24,
      height: Number(height) || 150,
      currentWeight: Number(currentWeight) || 68,
      targetWeight: Number(targetWeight) || 60,
      bodyFat: bodyFat !== '' ? Number(bodyFat) : undefined,
      goal
    };

    // Immersive RPG cinematic lag before final completing
    setTimeout(() => {
      onComplete(stats);
    }, 2200);
  };

  return (
    <div className="w-full max-w-sm px-4 py-8 mx-auto bg-scanlines min-h-screen flex flex-col justify-center">
      {isAwakening ? (
        <div className="text-center space-y-6 py-12" id="awakening-loader">
          <div className="w-24 h-24 rounded-none border-2 border-system-cyan border-t-transparent animate-spin mx-auto flex items-center justify-center shadow-neon-cyan">
            <Trophy size={40} className="text-system-cyan animate-pulse" />
          </div>
          <h2 className="font-display text-3xl font-black italic tracking-widest text-system-cyan uppercase glow-cyan">
            Aura Recalibrating...
          </h2>
          <div className="font-mono text-[10px] text-gray-500 space-y-1.5 bg-system-dark p-4 rounded-sm border border-system-border">
            <p>CONSTRUCTING PERSONALIZED EXERCISE MATRIX...</p>
            <p>LOCKING NO-COOK MALAYSIAN NUTRITIONAL TARGETS...</p>
            <p className="text-system-cyan glow-cyan">PLAYER AWAKENING REGISTERED IN DATABASE.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" id="onboarding-form">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-system-violet/15 border border-system-violet/30 rounded-none text-[10px] uppercase font-mono tracking-widest text-system-violet">
              <Sparkles size={11} className="text-system-violet animate-pulse" /> Welcome, Awakened Player
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-widest italic uppercase text-white glow-cyan">
              The System
            </h1>
            <p className="font-mono text-xs text-gray-400">
              INITIATE SYSTEM AWAKENING BY SPECIFYING LEVEL-1 PHYSICAL METRICS.
            </p>
          </div>

          <div className="space-y-4">
            {/* Player Info Fields in dynamic grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Player Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={12}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-system-black font-mono text-sm border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 font-mono text-[10px] text-gray-600">Yrs</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Height Metric
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={80}
                    max={250}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-system-black font-mono text-sm border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 font-mono text-[10px] text-gray-600">cm</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Current Weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="w-full bg-system-black font-mono text-sm border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 font-mono text-[10px] text-gray-600">kg</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  Target Weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full bg-system-black font-mono text-sm border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 font-mono text-[10px] text-gray-600">kg</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold tracking-widest uppercase text-gray-400">
                Body Fat % <span className="text-gray-600 italic">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={2}
                  max={60}
                  placeholder="e.g. 18"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="w-full bg-system-black font-mono text-sm border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none transition-all"
                />
                <span className="absolute right-3 top-2.5 font-mono text-[10px] text-gray-600">%</span>
              </div>
            </div>

            {/* Equipment lockdown constraint */}
            <div className="p-4 bg-system-dark border border-system-violet/30 bg-scanlines rounded-none space-y-2">
              <div className="flex items-center gap-2.5 text-system-violet">
                <Lock size={16} className="animate-pulse" />
                <span className="font-display text-sm font-extrabold tracking-widest uppercase italic">
                  Class Constraint Active
                </span>
              </div>
              <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
                CLASS IS LOCKED TO <b className="text-white">HOME-BASED (NO EQUIPMENT)</b>. WORKOUTS USE BODYWEIGHT AND CAN BE COMPLETED ANYWHERE.
              </p>
            </div>
          </div>

          <button
            type="submit"
            id="awakening-submit-btn"
            className="w-full mt-2 py-4 px-6 font-display font-black tracking-widest text-[#050505] bg-gradient-to-r from-system-cyan via-system-blue to-system-violet hover:brightness-110 shadow-neon-cyan transition-all uppercase italic rounded-none flex items-center justify-center gap-2 cursor-pointer"
          >
            Awaken Player <ArrowRight size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
