import React, { useEffect, useState } from 'react';
import { PlayerStats, WeeklyPlan, Quest, CustomDietTracker } from '../types';
import { CheckSquare, Square, Award, Flame, Calendar, RefreshCw, Star, Info, Zap, Skull, Plus, Minus, Trash2, Apple, Sparkles } from 'lucide-react';
import { playSystemSound } from './SystemAlert';

interface DashboardProps {
  stats: PlayerStats;
  plan: WeeklyPlan;
  quests: Quest[];
  onQuestToggle: (questId: string) => void;
  onResetDaily: () => void;
  streak: number;
  dietTrackers: CustomDietTracker[];
  onUpdateDietTracker: (id: string, current: number) => void;
  onAddDietTracker: (name: string, target: number, unit: string) => void;
  onDeleteDietTracker: (id: string) => void;
  currentDay?: number;
  isRestDay?: boolean;
  onToggleRestDay?: () => void;
}

export default function Dashboard({ stats, plan, quests, onQuestToggle, onResetDaily, streak, dietTrackers = [], onUpdateDietTracker, onAddDietTracker, onDeleteDietTracker, currentDay = 1, isRestDay = false, onToggleRestDay }: DashboardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTrackerName, setNewTrackerName] = useState<string>('');
  const [newTrackerTarget, setNewTrackerTarget] = useState<number | ''>(1);
  const [newTrackerUnit, setNewTrackerUnit] = useState<string>('glasses');

  const handleSubmitTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackerName.trim()) return;
    const targetVal = newTrackerTarget === '' ? 1 : Number(newTrackerTarget) || 1;
    onAddDietTracker(newTrackerName, targetVal, newTrackerUnit);
    setNewTrackerName('');
    setNewTrackerTarget(1);
    setNewTrackerUnit('glasses');
    setShowAddForm(false);
  };

  useEffect(() => {
    // Calculates countdown timer to next midnight dynamically
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 65));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeRemaining(`${pad(hours)}H : ${pad(minutes)}M : ${pad(seconds)}S`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Split quests for clean visual displays
  const workoutQuests = quests.filter((q) => q.category === 'workout');
  const nutritionQuests = quests.filter((q) => q.category === 'nutrition');
  const completedCount = quests.filter((q) => q.completed).length;
  const progressPercent = quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0;

  return (
    <div className="space-y-6" id="dashboard-quests-view">
      {/* Dynamic Grid - Daily Chronometer (Countdown Timer & Streak) */}
      <div className="grid grid-cols-2 gap-3.5" id="chronometer-widgets">
        {/* Streak Panel */}
        <div className="p-4 rounded-sm border border-system-border bg-system-dark flex flex-col justify-between relative overflow-hidden bg-scanlines">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-[0.15em]">
              Active Streak
            </span>
            <Flame size={14} className={streak > 0 ? 'text-system-pink animate-pulse' : 'text-gray-700'} />
          </div>
          <div className="mt-4">
            <span className="font-display text-4xl font-black italic tracking-tighter text-white">
              {streak} Days
            </span>
          </div>
          <div className="mt-2 font-mono text-[8px] text-system-pink uppercase tracking-wide">
            {streak > 2 ? '🔥 streak multiplier active!' : 'Complete daily quests'}
          </div>
        </div>

        {/* Midnight Reset Clock */}
        <div className="p-4 rounded-sm border border-system-border bg-system-dark flex flex-col justify-between relative overflow-hidden bg-scanlines">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-system-cyan uppercase tracking-[0.15em] font-black">
              PROTOCOL DAY {String(currentDay).padStart(2, '0')}
            </span>
            <Calendar size={13} className="text-system-cyan animate-pulse" />
          </div>
          <div className="mt-4">
            <span className="font-mono text-base font-bold tracking-[0.15em] text-gray-400">
              {timeRemaining || '00:00:00'}
            </span>
          </div>
          <button
            onClick={() => {
              playSystemSound('warning');
              onResetDaily();
            }}
            id="force-midnight-reset-btn"
            className="mt-2 font-mono text-[8px] text-system-cyan hover:text-white flex items-center gap-1 uppercase tracking-wider transition-all font-bold text-left"
          >
            <RefreshCw size={9} /> End & Archive Day {currentDay} Protocol
          </button>
        </div>
      </div>

      {/* High-Visibility Recovery / Rest Day Protocol Panel */}
      {onToggleRestDay && (
        <div className={`p-5 rounded-sm border bg-[#09090d] relative overflow-hidden bg-scanlines transition-all duration-300 ${
          isRestDay 
            ? 'border-system-violet/80 bg-system-violet/[0.04] shadow-[0_0_20px_rgba(138,43,226,0.25)]' 
            : 'border-system-border hover:border-system-violet/40'
        }`} id="rest-day-control-panel">
          {/* Decorative Corner Tabs */}
          <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${isRestDay ? 'border-system-violet' : 'border-system-border/40'}`}></div>
          <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${isRestDay ? 'border-system-violet/40' : 'border-system-border/20'}`}></div>
          <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${isRestDay ? 'border-system-violet/40' : 'border-system-border/20'}`}></div>
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isRestDay ? 'border-system-violet' : 'border-system-border/40'}`}></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Award size={16} className={isRestDay ? 'text-system-violet animate-bounce' : 'text-gray-500'} />
                <span className={`font-display font-black text-xs uppercase tracking-[0.14em] italic ${isRestDay ? 'text-system-violet glow-purple' : 'text-gray-300'}`}>
                  {isRestDay ? '⚡ REGENERATION PROTOCOL LIVE' : '⭐ RECOVERY STREAK SHIELD'}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onToggleRestDay}
              className={`px-5 py-2.5 font-display text-xs font-black uppercase italic tracking-widest cursor-pointer rounded-none border transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px] ${
                isRestDay
                  ? 'bg-system-violet text-white border-system-violet shadow-[0_0_15px_#8A2BE2] animate-pulse font-extrabold'
                  : 'bg-system-black hover:bg-system-violet/15 border-system-border hover:border-system-violet text-gray-400 hover:text-system-violet'
              }`}
            >
              <Award size={14} className={isRestDay ? 'animate-spin' : ''} />
              {isRestDay ? 'ACTIVE: REST DAY' : 'INITIATE REST DAY'}
            </button>
          </div>
        </div>
      )}

      {/* Quest Completion Progress Block with Circular Dial */}
      <div className={`p-5 rounded-sm border bg-system-card relative overflow-hidden bg-scanlines flex items-center gap-5 transition-all duration-300 ${isRestDay ? 'border-system-violet/50 shadow-[0_0_15px_rgba(138,43,226,0.15)] bg-system-violet/5' : 'border-system-border'}`} id="daily-quest-summary-container">
        {/* Decorative corner indicators */}
        <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${isRestDay ? 'border-system-violet' : 'border-system-cyan'}`}></div>
        <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${isRestDay ? 'border-system-violet/40' : 'border-system-cyan/40'}`}></div>
        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${isRestDay ? 'border-system-violet/40' : 'border-system-cyan/40'}`}></div>
        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isRestDay ? 'border-system-violet' : 'border-system-cyan'}`}></div>
 
        {/* Circular Progress Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-24 h-24" id="circular-progress-ring-wrapper">
          {/* Inner Glow effect container */}
          <div className={`absolute inset-0 rounded-full animate-pulse ${isRestDay ? 'bg-system-violet/5 border border-system-violet/10' : 'bg-system-cyan/5 border border-system-cyan/10'}`}></div>
          
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-system-black/80"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Secondary subtle decorative border circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={isRestDay ? "stroke-system-violet/25" : "stroke-system-border/30"}
              strokeWidth="1"
              strokeDasharray="4 4"
              fill="transparent"
            />
            {/* Active Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`${isRestDay ? 'stroke-system-violet' : 'stroke-system-cyan'} transition-all duration-700 ease-out`}
              strokeWidth="6"
              strokeDasharray="251.2"
              strokeDashoffset={isRestDay ? 0 : 251.2 - (251.2 * progressPercent) / 100}
              strokeLinecap="square"
              fill="transparent"
              style={{
                filter: isRestDay ? 'drop-shadow(0px 0px 6px #8A2BE2)' : 'drop-shadow(0px 0px 6px #00F0FF)',
              }}
            />
          </svg>
          
          {/* Central Overlay percentage */}
          <div className="absolute flex flex-col items-center justify-center font-mono leading-none">
            {isRestDay ? (
              <>
                <span className="font-display text-base font-black tracking-tighter text-system-violet glow-purple">
                  REST
                </span>
                <span className="text-[7px] text-system-violet font-bold uppercase tracking-widest mt-0.5 animate-pulse">
                  ACTIVE
                </span>
              </>
            ) : (
              <>
                <span className="font-display text-lg font-black tracking-tighter text-white glow-cyan">
                  {progressPercent}%
                </span>
                <span className="text-[7px] text-system-cyan font-bold uppercase tracking-widest mt-0.5 animate-pulse">
                  Ratio
                </span>
              </>
            )}
          </div>
        </div>
 
        {/* Text descriptions */}
        <div className="flex-1 space-y-1.5" id="quest-summary-text-block">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] uppercase font-mono tracking-widest font-bold ${
            isRestDay 
              ? 'bg-system-violet/10 border border-system-violet/25 text-system-violet' 
              : 'bg-system-cyan/10 border border-system-cyan/25 text-system-cyan'
          }`}>
            <Zap size={9} className="animate-pulse" /> {isRestDay ? 'Regeneration Protocol Active' : 'System Quest Deck'}
          </div>
          <div>
            <h4 className="font-display font-black text-sm tracking-widest text-white uppercase italic">
              {isRestDay ? 'Active Standing Recovery' : 'Daily Clearing Protocol'}
            </h4>
            <p className="font-mono text-[9.5px] text-gray-400 leading-normal max-w-sm">
              {isRestDay 
                ? 'Your rest day is active. Daily quests are paused and your streak is fully protected.'
                : 'Complete all workout and diet quests below before midnight to level up your stats.'}
            </p>
          </div>
          
          {/* Cleared Stats Indicator */}
          <div className="flex items-center gap-4 pt-1 text-[10px] font-mono text-gray-500">
            {isRestDay ? (
              <div>
                <span className="text-gray-400">STREAK CONTROL: </span>
                <span className="text-system-violet font-bold font-display italic text-xs">MAINTAINED & SECURED (STABLE)</span>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-gray-400">CLEARED: </span>
                  <span className="text-system-cyan font-bold font-display italic text-xs">{completedCount}</span>
                  <span className="text-gray-600"> / {quests.length}</span>
                </div>
                <div className="w-1 h-3 bg-system-border/40"></div>
                <div>
                  <span className="text-gray-400">REMAINING: </span>
                  <span className="text-system-pink font-bold font-display italic text-xs">{quests.length - completedCount}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Rest Day System Level Alert */}
      {isRestDay && (
        <div className="p-4 rounded-sm border border-system-violet/40 bg-system-violet/5 space-y-2 relative overflow-hidden bg-scanlines animate-pulse" id="rest-active-glowing-banner">
          <div className="absolute top-0 right-0 p-1.5 font-mono text-[7px] text-system-violet/60 font-black uppercase tracking-widest bg-system-violet/10">
            PAUSED
          </div>
          <div className="flex items-center gap-2">
            <Award className="text-system-violet animate-bounce" size={16} />
            <span className="font-display font-black text-xs uppercase tracking-[0.15em] text-system-violet glow-purple italic">
              REST DAY ACTIVE
            </span>
          </div>
          <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
            All daily requirements are paused. Today is marked as fully compliant, and your <span className="text-white font-bold">{streak}-day streak</span> is protected!
          </p>
        </div>
      )}

      {/* Category 1: Physical Quests */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-system-cyan pl-1">
          <div className="w-2 h-2 bg-system-cyan shadow-[0_0_8px_#00F0FF] rounded-none"></div>
          <h3 className="font-display font-bold uppercase tracking-[0.15em] text-sm italic">
            Physical Quests (Workouts)
          </h3>
        </div>

        <div className="space-y-3" id="workout-quests-list">
          {workoutQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => onQuestToggle(quest.id)}
              className={`w-full p-4 rounded-sm border text-left flex items-start gap-4 transition-all ${
                quest.completed
                  ? 'bg-system-cyan/10 border-l-4 border-system-cyan border-y-system-border border-r-system-border'
                  : 'bg-system-dark border-system-border hover:border-gray-800'
              }`}
            >
              <div className="pt-0.5">
                {quest.completed ? (
                  <div className="w-5 h-5 bg-system-cyan flex items-center justify-center rounded-none shadow-neon-cyan select-none">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#050505] fill-none stroke-[3]"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 border border-white/20 hover:border-system-cyan transition-colors rounded-none"></div>
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`font-display font-black text-sm tracking-wide uppercase italic ${quest.completed ? 'text-system-cyan glow-cyan' : 'text-white'}`}>
                    {quest.title}
                  </h4>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-system-cyan/10 text-system-cyan font-bold whitespace-nowrap">
                    +{quest.expReward} EXP
                  </span>
                </div>
                <p className="font-mono text-[10px] text-gray-400 leading-normal">
                  {quest.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category 2: Nutritional Quests */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-system-violet pl-1">
          <div className="w-2 h-2 bg-system-violet shadow-[0_0_8px_rgb(138,43,226)] rounded-none"></div>
          <h3 className="font-display font-bold uppercase tracking-[0.15em] text-sm italic">
            Nutritional Quests (Malaysian No-Cook)
          </h3>
        </div>

        <div className="space-y-3" id="nutrition-quests-list">
          {nutritionQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => onQuestToggle(quest.id)}
              className={`w-full p-4 rounded-sm border text-left flex items-start gap-4 transition-all ${
                quest.completed
                  ? 'bg-system-violet/15 border-l-4 border-system-violet border-y-system-border border-r-system-border'
                  : 'bg-system-dark border-system-border hover:border-gray-800'
              }`}
            >
              <div className="pt-0.5">
                {quest.completed ? (
                  <div className="w-5 h-5 bg-system-violet flex items-center justify-center rounded-none shadow-neon-purple select-none">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#050505] fill-none stroke-[3]"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 border border-white/20 hover:border-system-violet transition-colors rounded-none"></div>
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`font-display font-black text-sm tracking-wide uppercase italic ${quest.completed ? 'text-system-violet glow-purple' : 'text-white'}`}>
                    {quest.title}
                  </h4>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-system-violet/10 text-system-violet font-bold whitespace-nowrap">
                    +{quest.expReward} EXP
                  </span>
                </div>
                <p className="font-mono text-[10px] text-gray-400 leading-normal">
                  {quest.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Diet / Elixir Intake Trackers */}
      <div className="space-y-4 font-mono text-xs" id="custom-diet-trackers-module">
        <div className="flex justify-between items-center text-system-violet pl-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-system-violet shadow-[0_0_8px_rgb(138,43,226)] rounded-none"></div>
            <h3 className="font-display font-bold uppercase tracking-[0.15em] text-sm italic">
              Alchemical Lab (Diet Trackers)
            </h3>
          </div>
          <button
            onClick={() => {
              playSystemSound('click');
              setShowAddForm(!showAddForm);
            }}
            className="px-2.5 py-1 text-[9px] font-display font-extrabold uppercase italic tracking-wider text-system-violet border border-system-violet/30 hover:bg-system-violet/10 rounded-none transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            {showAddForm ? '✕ Close' : '+ Forge Custom'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmitTracker} className="p-4 bg-system-dark border border-system-violet/40 rounded-sm space-y-3.5 animate-fade-in" id="diet-forge-form">
            <h4 className="font-display text-[10px] font-extrabold tracking-widest text-system-violet uppercase italic flex items-center gap-1">
              <Sparkles size={11} className="animate-spin" /> FORGE EXPERIMENTAL RECOVERY DIET ELIXIR
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Diet / Tracker Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eggs Consumed, Water Intake, Apple Cider"
                  value={newTrackerName}
                  onChange={(e) => setNewTrackerName(e.target.value)}
                  className="w-full bg-system-black border border-system-border focus:border-system-violet px-3 py-2 text-white text-xs rounded-none outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Daily Target Goal</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTrackerTarget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTrackerTarget(val === '' ? '' : parseInt(val) || '');
                    }}
                    className="w-full bg-system-black border border-system-border focus:border-system-violet px-3 py-2 text-white text-xs rounded-none outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="e.g. portion, glass, eggs, shot"
                    value={newTrackerUnit}
                    onChange={(e) => setNewTrackerUnit(e.target.value)}
                    className="w-full bg-system-black border border-system-border focus:border-system-violet px-3 py-2 text-white text-xs rounded-none outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-system-violet/60 to-system-blue/40 hover:from-system-violet hover:to-system-blue border border-system-violet/50 hover:border-system-violet text-white font-display text-[10px] font-extrabold tracking-widest uppercase italic transition-all active:scale-95 rounded-none cursor-pointer"
            >
              Forge Diet Elixir (+15 XP Clear Bonus)
            </button>
          </form>
        )}

        <div className="space-y-3" id="diet-trackers-list">
          {dietTrackers.length === 0 ? (
            <div className="p-4 border border-system-border bg-system-dark/30 text-center text-gray-500 font-mono text-[10px] italic">
              NO CONFIGURED DIET TRACKERS. AWAKEN TO FORGE YOUR RECOVERY TARGETS.
            </div>
          ) : (
            dietTrackers.map((tracker) => {
              const isGoalComplete = tracker.current >= tracker.target;
              const ratioPercent = Math.min(100, Math.round((tracker.current / tracker.target) * 100));
              
              return (
                <div
                  key={tracker.id}
                  className={`p-4 border rounded-sm transition-all ${
                    isGoalComplete
                      ? 'bg-system-violet/10 border-l-4 border-system-violet border-y-system-border border-r-system-border shadow-[0_0_15px_rgba(138,43,226,0.15)]'
                      : 'bg-system-dark border-system-border'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className={`font-display font-medium text-sm tracking-wide uppercase italic flex items-center gap-1.5 ${
                        isGoalComplete ? 'text-system-violet glow-purple font-black' : 'text-white'
                      }`}>
                        {tracker.name}
                        {isGoalComplete && (
                          <span className="text-[9px] px-1.5 py-0.2 select-none border border-system-violet bg-system-violet/10 text-system-violet animate-pulse font-mono font-bold tracking-widest italic rounded-sm">
                            CLEAR
                          </span>
                        )}
                      </h4>
                      <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                        Target: {tracker.target} {tracker.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateDietTracker(tracker.id, tracker.current - 1)}
                        disabled={tracker.current <= 0}
                        className="w-7 h-7 bg-system-black border border-system-border hover:border-system-violet hover:text-system-violet flex items-center justify-center text-xs font-bold font-mono transition-colors disabled:opacity-30 disabled:hover:border-system-border cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono text-sm font-bold text-white px-2 min-w-[32px] text-center select-none">
                        {tracker.current}
                      </span>
                      <button
                        onClick={() => onUpdateDietTracker(tracker.id, tracker.current + 1)}
                        className="w-7 h-7 bg-system-black border border-system-border hover:border-system-violet hover:text-system-violet flex items-center justify-center text-xs font-bold font-mono transition-colors cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => onDeleteDietTracker(tracker.id)}
                        className="w-7 h-7 bg-system-black border border-system-border hover:border-red-500 hover:text-red-500 flex items-center justify-center text-xs font-bold font-mono transition-colors ml-1 text-gray-500 cursor-pointer"
                        title="Delete Tracker"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="relative w-full h-1 bg-system-black rounded-none overflow-hidden border border-system-border/40">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isGoalComplete ? 'bg-system-violet shadow-neon-purple' : 'bg-system-violet/60'
                      }`}
                      style={{ width: `${ratioPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Extreme System Warnings (System Quests) */}
      <div className="p-4 bg-red-950/10 border border-red-950/40 bg-scanlines rounded-sm flex gap-3.5" id="system-penalty-warning">
        <div className="pt-0.5 text-red-500">
          <Skull size={18} className="animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-display text-xs font-bold uppercase text-red-500 tracking-[0.2em] italic">
            Active System Penalty Protocol
          </h4>
          <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
            Failure to complete all daily quests before midnight triggers system penalty protocols. Stay consistent to protect your raw physical stats level.
          </p>
        </div>
      </div>
    </div>
  );
}
