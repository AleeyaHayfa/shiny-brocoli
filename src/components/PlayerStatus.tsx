import React, { useState } from 'react';
import { PlayerStats, WeightLog, SystemStatus } from '../types';
import { TrendingDown, Scale, Target, Trophy, Clock, Plus, BarChart2, Calendar, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { playSystemSound } from './SystemAlert';

interface PlayerStatusProps {
  stats: PlayerStats;
  system: SystemStatus;
  weightLogs: WeightLog[];
  onAddWeightLog: (weight: number) => void;
  completedQuestsCount: number;
  onUpdateSystemStatus?: (newSystem: SystemStatus) => void;
  onUpdateStats?: (newStats: PlayerStats) => void;
}

export default function PlayerStatus({ stats, system, weightLogs, onAddWeightLog, completedQuestsCount, onUpdateSystemStatus, onUpdateStats }: PlayerStatusProps) {
  const [newWeight, setNewWeight] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Profile edit sub-states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>(stats.username || 'SHADOW_PLAYER');
  const [editAge, setEditAge] = useState<string>(String(stats.age));
  const [editHeight, setEditHeight] = useState<string>(String(stats.height));
  const [editTargetWeight, setEditTargetWeight] = useState<string>(String(stats.targetWeight));
  
  const [historyTab, setHistoryTab] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState<number>(() => {
    return Math.min(4, Math.ceil((system.currentDay || 1) / 7));
  });
  const [hoveredDayInfo, setHoveredDayInfo] = useState<{ day: number; score: number; isFuture: boolean } | null>(null);

  const submitWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(newWeight);
    if (!wt || wt <= 10 || wt >= 500) {
      setErrorMsg('Enter a valid weight in kg.');
      playSystemSound('warning');
      return;
    }
    setErrorMsg('');
    onAddWeightLog(wt);
    setNewWeight('');
    playSystemSound('levelup');
  };

  // ----------------------------------------------------
  // Dynamic Symmetrical SVG Line Chart Calculations (Weight)
  // ----------------------------------------------------
  const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const minWeight = sortedLogs.length > 0 ? Math.min(...sortedLogs.map(l => l.weight)) - 1 : 55;
  const maxWeight = sortedLogs.length > 0 ? Math.max(...sortedLogs.map(l => l.weight)) + 1 : 75;
  const weightRange = maxWeight - minWeight || 1;

  // Render variables for safe viewBox
  const width = 340;
  const height = 150;
  const padding = 25;

  const points = sortedLogs.map((log, index) => {
    const x = padding + (index / Math.max(sortedLogs.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((log.weight - minWeight) / weightRange) * (height - padding * 2);
    return { x, y, weight: log.weight, label: log.date };
  });

  // Polyline points
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  // ----------------------------------------------------
  // Dynamic Solo Leveling Spider Radar Chart Calculations
  // ----------------------------------------------------
  // Let's model player stats mathematically:
  // STR: Strength (average workout log checks)
  // STM: Stamina (streak level)
  // INT: Diet Discipline (average nutrition checks)
  // AGI: Agility (level completion rate)
  // VIT: Vitality (proximity of bodyweight to target weight)
  const weightDiff = Math.abs(stats.currentWeight - stats.targetWeight);
  const vitFactor = Math.max(20, Math.round(100 - weightDiff * 3)); // Proximity progress

  const radarStats = [
    { title: 'STR', value: 35 + Math.min(65, stats.age + (system.level * 4)), desc: 'Strength / Workouts' },
    { title: 'STM', value: Math.min(100, 30 + (system.streak * 10)), desc: 'Stamina / Streak' },
    { title: 'INT', value: Math.min(100, 45 + (completedQuestsCount * 2)), desc: 'Nutrition / Wisdom' },
    { title: 'AGI', value: 40 + Math.min(60, system.level * 6), desc: 'Agility / Overload' },
    { title: 'VIT', value: vitFactor, desc: 'Vitality / Goal' }
  ];

  // Radar points computation (5-sided pentagon)
  // R = 50 scale, centered at 100,100
  const radarWidth = 200;
  const radarHeight = 200;
  const radarCenter = 100;
  const maxRadius = 65;

  const angleStep = (Math.PI * 2) / 5;
  const radarPoints = radarStats.map((st, idx) => {
    const angle = idx * angleStep - Math.PI / 2; // offset to top-most center
    const pct = st.value / 100;
    const r = maxRadius * pct;
    const x = radarCenter + r * Math.cos(angle);
    const y = radarCenter + r * Math.sin(angle);
    
    // Poly-corners helper (for concentric grid backgrounds)
    const gridPoints = [0.25, 0.5, 0.75, 1.0].map(gridPct => {
      const gR = maxRadius * gridPct;
      return {
        x: radarCenter + gR * Math.cos(angle),
        y: radarCenter + gR * Math.sin(angle)
      };
    });

    return { x, y, labelX: radarCenter + (maxRadius + 12) * Math.cos(angle), labelY: radarCenter + (maxRadius + 10) * Math.sin(angle), gridPoints, label: st.title };
  });

  const radarPolygonStr = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  // SVG grid lines for concentric pentagons
  const gridStrings = [0, 1, 2, 3].map(gridIdx => {
    return radarPoints.map(p => `${p.gridPoints[gridIdx].x},${p.gridPoints[gridIdx].y}`).join(' ');
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateStats) return;
    
    playSystemSound('levelup');
    onUpdateStats({
      ...stats,
      username: editUsername.trim() || 'SHADOW_PLAYER',
      age: Number(editAge) || stats.age,
      height: Number(editHeight) || stats.height,
      targetWeight: Number(editTargetWeight) || stats.targetWeight,
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6" id="player-status-view">
      {/* Player Identity Banner */}
      <div className="p-4 rounded-sm border border-system-border bg-system-black relative overflow-hidden bg-scanlines flex items-center justify-between">
        <div>
          <span className="font-mono text-[9px] text-system-cyan uppercase tracking-[0.2em] block mb-0.5">PLAYER IDENTIFICATION</span>
          <h2 className="font-display text-xl font-black text-white italic tracking-wide uppercase">
            {stats.username || 'SHADOW_PLAYER'}
          </h2>
          <span className="font-mono text-[9px] text-gray-500 block mt-1">
            Age {stats.age} Yrs &middot; Height {stats.height}cm
          </span>
        </div>
        <button
          onClick={() => {
            playSystemSound('click');
            setIsEditingProfile(!isEditingProfile);
          }}
          className="px-2.5 py-1.5 font-display text-[9px] font-bold text-system-cyan border border-system-cyan/35 hover:bg-system-cyan/15 rounded-none uppercase italic transition-all cursor-pointer"
        >
          {isEditingProfile ? '✕ Close' : '⚙️ Edit Profile'}
        </button>
      </div>

      {isEditingProfile && (
        <form onSubmit={handleSaveProfile} className="p-4 rounded-sm border border-system-cyan/50 bg-system-dark space-y-4 animate-fade-in" id="profile-alignment-form">
          <h3 className="font-display text-xs font-bold tracking-[0.2em] text-system-cyan uppercase italic flex items-center gap-1">
            <Sparkles size={12} className="animate-pulse" /> Alignment Adjustment
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-mono text-[9px] font-bold text-gray-500 uppercase tracking-widest block font-bold">
                Update Username
              </label>
              <input
                type="text"
                required
                maxLength={18}
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="w-full bg-system-black font-mono text-xs border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none focus:border-system-cyan/80"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-mono text-[9px] font-bold text-gray-500 uppercase tracking-widest block font-bold">
                  Age (Yrs)
                </label>
                <input
                  type="number"
                  required
                  min={12}
                  max={100}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full bg-system-black font-mono text-xs border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] font-bold text-gray-500 uppercase tracking-widest block font-bold">
                  Height (cm)
                </label>
                <input
                  type="number"
                  required
                  min={80}
                  max={250}
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  className="w-full bg-system-black font-mono text-xs border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] font-bold text-gray-550 uppercase tracking-widest block font-bold">
                  Target (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  className="w-full bg-system-black font-mono text-xs border border-system-border focus:border-system-cyan rounded-none px-3 py-2 text-white outline-none"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-system-cyan/70 to-system-blue/40 hover:from-system-cyan hover:to-system-blue border border-system-cyan/40 hover:border-system-cyan text-white font-display text-[9.5px] font-black tracking-widest uppercase italic transition-all rounded-none cursor-pointer"
          >
            Confirm Calibration Changes
          </button>
        </form>
      )}

      {/* Target Weight Proximity Widget */}
      <div className="p-4 rounded-sm border border-system-border bg-system-dark relative overflow-hidden bg-scanlines grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center border-r border-system-border pr-2">
          <Scale size={16} className="text-system-cyan mb-1" />
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Weight</span>
          <span className="font-display text-lg font-black text-white italic">{stats.currentWeight}kg</span>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-system-border px-2 text-center">
          <Target size={16} className="text-system-violet mb-1" />
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Target</span>
          <span className="font-display text-lg font-black text-system-violet italic">{stats.targetWeight}kg</span>
        </div>
        <div className="flex flex-col items-center justify-center pl-2 text-center">
          <TrendingDown size={16} className="text-system-pink mb-1" />
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">To Go</span>
          <span className="font-display text-lg font-black text-system-pink italic">
            {stats.currentWeight > stats.targetWeight 
              ? `-${Math.abs(stats.currentWeight - stats.targetWeight).toFixed(1)}kg` 
              : `+${Math.abs(stats.targetWeight - stats.currentWeight).toFixed(1)}kg`}
          </span>
        </div>
      </div>

      {/* Gamified Radar Spider Chart */}
      <div className="p-5 rounded-sm border border-system-border bg-system-card flex flex-col items-center justify-center text-center relative overflow-hidden">
        <h3 className="font-display text-xs font-bold tracking-[0.2em] text-system-cyan uppercase italic mb-3 flex items-center gap-1.5">
          <Trophy size={12} /> CHARACTER STATS
        </h3>
        
        <div className="relative w-52 h-52">
          <svg width={radarWidth} height={radarHeight} className="overflow-visible select-none">
            {/* Pentagon Grid Backgrounds */}
            {gridStrings.map((gridStr, i) => (
              <polygon
                key={i}
                points={gridStr}
                fill="none"
                stroke="rgba(0, 240, 255, 0.08)"
                strokeWidth="1"
              />
            ))}

            {/* Central spokes */}
            {radarPoints.map((p, idx) => (
              <line
                key={idx}
                x1={radarCenter}
                y1={radarCenter}
                x2={p.gridPoints[3].x}
                y2={p.gridPoints[3].y}
                stroke="rgba(0, 240, 255, 0.12)"
                strokeWidth="1"
              />
            ))}

            {/* Filled attribute area */}
            <polygon
              points={radarPolygonStr}
              fill="rgba(0, 240, 255, 0.22)"
              stroke="rgb(0, 240, 255)"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]"
            />

            {/* Cyan dots on corners */}
            {radarPoints.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#00F0FF"
                className="animate-pulse"
              />
            ))}

            {/* Labels */}
            {radarPoints.map((p, idx) => (
              <text
                key={idx}
                x={p.labelX}
                y={p.labelY}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="font-display font-black text-[12px] italic tracking-wide"
                fill={idx % 2 === 0 ? '#00F0FF' : '#8A2BE2'}
              >
                {p.label}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend descriptor details */}
        <div className="w-full grid grid-cols-5 gap-1 mt-1 pb-1 border-t border-system-border pt-4">
          {radarStats.map((st, i) => (
            <div key={i} className="flex flex-col">
              <span className="font-display text-[10px] font-bold text-white italic">{st.title}</span>
              <span className="font-mono text-xs font-black text-system-cyan glow-cyan">{st.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* QUEST CLEARING CRITICAL HISTORY (WEEKLY & MONTHLY VIEWS) */}
      <div className="p-4 rounded-sm border border-system-border bg-system-card relative overflow-hidden bg-scanlines space-y-4" id="quest-history-panel">
        <div className="flex justify-between items-center border-b border-system-border pb-3">
          <h3 className="font-display text-xs font-bold tracking-[0.2em] text-system-cyan uppercase italic flex items-center gap-1.5 font-black">
            <Calendar size={13} className="animate-pulse" /> QUEST CLEARING HISTORY
          </h3>
          
          {/* Toggles */}
          <div className="flex bg-[#0a0a0e] border border-system-border p-0.5 rounded-sm">
            <button
              onClick={() => {
                playSystemSound('click');
                setHistoryTab('weekly');
              }}
              className={`px-2.5 py-1 text-[9px] font-display font-medium uppercase italic tracking-widest transition-all cursor-pointer ${
                historyTab === 'weekly' ? 'bg-system-cyan/15 text-system-cyan border border-system-cyan/30 font-black' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => {
                playSystemSound('click');
                setHistoryTab('monthly');
              }}
              className={`px-2.5 py-1 text-[9px] font-display font-medium uppercase italic tracking-widest transition-all cursor-pointer ${
                historyTab === 'monthly' ? 'bg-system-cyan/15 text-system-cyan border border-system-cyan/30 font-black' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {historyTab === 'weekly' ? (
          /* WEEKLY VIEW COMPONENT */
          <div className="space-y-4" id="weekly-completion-viewport">
            {/* Week Selector buttons */}
            <div className="flex gap-1 justify-between bg-system-dark/60 p-1 border border-system-border rounded-sm">
              {[1, 2, 3, 4].map((wkNum) => {
                const isCurrentWk = Math.ceil((system.currentDay || 1) / 7) === wkNum;
                const isActiveWk = selectedHistoryWeek === wkNum;
                return (
                  <button
                    key={wkNum}
                    type="button"
                    onClick={() => {
                      playSystemSound('click');
                      setSelectedHistoryWeek(wkNum);
                    }}
                    className={`flex-1 text-center py-1 font-mono text-[9px] uppercase font-bold transition-all cursor-pointer ${
                      isActiveWk 
                        ? 'bg-system-cyan text-system-black font-extrabold shadow-neon-cyan' 
                        : isCurrentWk
                        ? 'text-system-cyan border border-dashed border-system-cyan/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Wk {wkNum} {isCurrentWk && '★'}
                  </button>
                );
              })}
            </div>

            {/* 7-Day Pipeline Circles */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {Array.from({ length: 7 }).map((_, idx) => {
                const dayOffset = (selectedHistoryWeek - 1) * 7;
                const dayNum = dayOffset + idx + 1;
                const dayKey = `Day ${dayNum}`;
                const hasValue = system.questCompletionHistory && system.questCompletionHistory[dayKey] !== undefined;
                const completionVal = hasValue ? system.questCompletionHistory[dayKey] : 0;
                const isFuture = dayNum >= (system.currentDay || 1);
                
                // Color levels representing score
                let scoreColorClass = 'text-gray-600 border-system-border/40 bg-system-dark/30';
                if (!isFuture) {
                  if (completionVal === 100) scoreColorClass = 'text-system-cyan border-system-cyan bg-system-cyan/10 glow-cyan';
                  else if (completionVal >= 50) scoreColorClass = 'text-system-violet border-system-violet bg-system-violet/10';
                  else if (completionVal > 0) scoreColorClass = 'text-system-pink border-system-pink bg-system-pink/10';
                }

                return (
                  <div key={idx} className="flex flex-col items-center space-y-1">
                    <span className="font-mono text-[80%] text-gray-500 select-none">{idx === 0 ? 'M' : idx === 1 ? 'T' : idx === 2 ? 'W' : idx === 3 ? 'T' : idx === 4 ? 'F' : idx === 5 ? 'S' : 'S'}</span>
                    <div 
                      className={`w-9 h-9 border rounded-sm flex flex-col items-center justify-center font-mono relative ${scoreColorClass}`}
                      title={`${dayKey}: ${isFuture ? 'Locked' : `${completionVal}% Clear`}`}
                    >
                      {isFuture ? (
                        <Lock size={10} className="text-gray-700" />
                      ) : (
                        <span className="font-display font-black text-[10px] leading-none mb-1">
                          {completionVal}%
                        </span>
                      )}
                      
                      <span className="absolute bottom-0 text-[6.5px] tracking-tighter text-gray-400">D{String(dayNum).padStart(2, '0')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-center font-mono text-gray-500 pt-1">
              Currently on Protocol: <span className="text-system-cyan font-bold">Week {Math.ceil((system.currentDay || 1) / 7)}</span>, <span className="text-white font-bold">Day {system.currentDay || 1}</span>
            </div>
          </div>
        ) : (
          /* MONTHLY VIEW COMPONENT */
          <div className="space-y-4" id="monthly-completion-viewport">
            {/* Grid display for 30 consecutive protocol days */}
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayKey = `Day ${dayNum}`;
                const hasValue = system.questCompletionHistory && system.questCompletionHistory[dayKey] !== undefined;
                const completionVal = hasValue ? system.questCompletionHistory[dayKey] : 0;
                const isFuture = dayNum >= (system.currentDay || 1);

                // Determine precise rendering classes based on completion level
                let colorClass = 'bg-[#121217] border-system-border/30 text-gray-750'; // Untouched/Future
                let glowFilter = {};

                if (!isFuture) {
                  if (completionVal === 100) {
                    colorClass = 'bg-system-cyan text-system-black border-system-cyan font-black';
                    glowFilter = { filter: 'drop-shadow(0 0 5px #00F0FF)' };
                  } else if (completionVal >= 80) {
                    colorClass = 'bg-system-cyan/25 text-system-cyan border-system-cyan/40 font-bold';
                  } else if (completionVal >= 40) {
                    colorClass = 'bg-system-violet/30 text-system-violet border-system-violet/40';
                  } else if (completionVal > 0) {
                    colorClass = 'bg-system-pink/20 text-system-pink border-system-pink/35';
                  } else {
                    colorClass = 'bg-red-500/5 text-gray-500 border-red-500/10';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playSystemSound('click');
                      setHoveredDayInfo({ day: dayNum, score: completionVal, isFuture });
                    }}
                    style={glowFilter}
                    className={`h-9 border flex flex-col items-center justify-center rounded-sm font-mono transition-transform active:scale-95 cursor-pointer relative ${colorClass}`}
                  >
                    <span className="text-[7.5px] text-gray-500 block leading-none absolute top-1 left-1">D{String(dayNum).padStart(2, '0')}</span>
                    {isFuture ? (
                      <Lock size={8} className="text-gray-800 mt-1" />
                    ) : (
                      <span className="text-[10px] font-black mt-2 leading-none">{completionVal}%</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Status / Decisive Tally Panel */}
            <div className="bg-system-dark/80 p-3 border border-system-border rounded-sm space-y-1.5 text-center font-mono micro-panel min-h-12 flex items-center justify-center">
              {hoveredDayInfo ? (
                <div className="flex justify-between items-center text-[10px] text-white w-full">
                  <span>DAY {String(hoveredDayInfo.day).padStart(2, '0')} STATUS:</span>
                  <span className={`${
                    hoveredDayInfo.isFuture ? 'text-gray-500' : hoveredDayInfo.score === 100 ? 'text-system-cyan font-black uppercase tracking-wider glow-cyan animate-pulse' : hoveredDayInfo.score >= 50 ? 'text-system-violet' : 'text-system-pink'
                  }`}>
                    {hoveredDayInfo.isFuture ? 'PROTOCOLS LOCKED' : hoveredDayInfo.score === 100 ? '★ S-RANK PERFECT CLEAR' : `${hoveredDayInfo.score}% PROTOCOLS CLEARED`}
                  </span>
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 text-center uppercase tracking-widest">
                  💡 Select any day box above to inspect historic logs
                </div>
              )}
            </div>

            {/* S-Rank Clears Counter widgets */}
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase text-gray-400">
              <div className="p-2 border border-system-border/30 bg-system-black/40 rounded-sm flex justify-between items-center">
                <span>⭐ S-Rank Clears:</span>
                <span className="text-system-cyan font-bold font-display text-xs">
                  {Object.values(system.questCompletionHistory || {}).filter(v => v === 100).length} Clears
                </span>
              </div>
              <div className="p-2 border border-system-border/30 bg-system-black/40 rounded-sm flex justify-between items-center">
                <span>⚡ Active Day Count:</span>
                <span className="text-white font-bold font-display text-xs">
                  Day {system.currentDay || 1}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MOCK DEVELOPMENT / PROTOCOL SEEDERS */}
        {onUpdateSystemStatus && (
          <div className="flex gap-2 pt-3 border-t border-system-border/40 justify-between items-center flex-wrap">
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">
              SYSTEM CONSOLE
            </span>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  playSystemSound('levelup');
                  const mockHistory: { [key: string]: number } = {};
                  // Seed random completion records for 30 days
                  for (let i = 1; i <= 30; i++) {
                    const rnd = Math.random();
                    let score = 0;
                    if (rnd > 0.6) score = 100;
                    else if (rnd > 0.4) score = 80;
                    else if (rnd > 0.2) score = 50;
                    else if (rnd > 0.1) score = 25;
                    mockHistory[`Day ${i}`] = score;
                  }
                  
                  // Advance level and currentDay for massive visual reward
                  onUpdateSystemStatus({
                    ...system,
                    questCompletionHistory: mockHistory,
                    currentDay: 31,
                    streak: 12,
                    level: Math.max(system.level, 6),
                    exp: 30,
                  });
                }}
                className="px-2 py-1 font-mono text-[8px] text-system-cyan border border-system-cyan/30 bg-system-cyan/5 hover:bg-system-cyan/15 cursor-pointer flex items-center gap-1 uppercase font-bold"
                title="Populate historical logs to test weekly/monthly displays"
              >
                <Sparkles size={10} className="animate-pulse" /> Seed 30 Days
              </button>
              
              <button
                type="button"
                onClick={() => {
                  playSystemSound('warning');
                  onUpdateSystemStatus({
                    ...system,
                    questCompletionHistory: {},
                    currentDay: 1,
                    streak: 0
                  });
                  setHoveredDayInfo(null);
                }}
                className="px-2 py-1 font-mono text-[8px] text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 cursor-pointer uppercase font-bold"
                title="Wipe completion archives"
              >
                <RefreshCw size={10} /> Clear Logs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Weight History Line Chart */}
      <div className="p-4 rounded-sm border border-system-border bg-system-dark space-y-3">
        <h3 className="font-display text-xs font-bold tracking-[0.2em] text-system-violet uppercase italic flex items-center gap-1.5">
          <BarChart2 size={13} /> WEIGHT LOG CHRONOLOGY
        </h3>

        {sortedLogs.length < 2 ? (
          <div className="text-center py-6 font-mono text-[10px] text-gray-500">
            Log weight continuously for graph metrics.
          </div>
        ) : (
          <div className="relative w-full overflow-hidden flex items-center justify-center">
            <svg width={width} height={height} className="overflow-visible">
              {/* Grid Horizontal Guide Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const y = padding + p * (height - padding * 2);
                return (
                  <line
                    key={i}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="rgba(138, 43, 226, 0.08)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Glowing Line */}
              <polyline
                fill="none"
                stroke="#8A2BE2"
                strokeWidth="2.5"
                points={pointsStr}
                className="drop-shadow-[0_0_5px_rgba(138,43,226,0.5)]"
              />

              {/* Interactive Circles / Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#050505"
                    stroke="#8A2BE2"
                    strokeWidth="2"
                    className="hover:scale-125 transition-transform cursor-pointer"
                  />
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-bold"
                    fill="rgba(255,255,255,0.85)"
                  >
                    {p.weight}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* Input Form to log current weights */}
        <form onSubmit={submitWeight} className="space-y-2 pt-2.5 border-t border-system-border" id="weight-logging-form">
          <label className="font-mono text-[9px] font-bold text-gray-500 uppercase block tracking-widest">
            Register Current Weight Logs
          </label>
          <div className="flex gap-2.5">
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 64.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="flex-1 bg-system-black font-mono text-xs border border-system-border focus:border-system-violet/85 rounded-none px-3.5 py-2 text-white outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2 border border-system-violet/50 hover:bg-system-violet/10 hover:text-system-violet text-system-violet rounded-none text-xs font-display font-extrabold italic uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus size={12} /> Log
            </button>
          </div>
          {errorMsg && (
            <p className="font-mono text-[9px] text-red-500">{errorMsg}</p>
          )}
        </form>
      </div>
    </div>
  );
}
