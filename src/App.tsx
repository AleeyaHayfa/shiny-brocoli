import React, { useState, useEffect } from 'react';
import { PlayerStats, WeeklyPlan, Quest, WeightLog, SystemStatus, CustomDietTracker } from './types';
import { generatePlan } from './data/planGenerator';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import OracleTerminal from './components/OracleTerminal';
import PlayerStatus from './components/PlayerStatus';
import { LevelUpModal, PenaltyAlert, playSystemSound } from './components/SystemAlert';
import { Trophy, Dumbbell, User, Zap, Terminal as TermIcon, ShieldAlert, Sparkles, RefreshCw, Award } from 'lucide-react';

export default function App() {
  // 1. Core States loaded from localStorage
  const [stats, setStats] = useState<PlayerStats | null>(() => {
    const raw = localStorage.getItem('shadow_fitness_stats');
    return raw ? JSON.parse(raw) : null;
  });

  const [system, setSystem] = useState<SystemStatus>(() => {
    const raw = localStorage.getItem('shadow_fitness_status');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          currentDay: 1,
          questCompletionHistory: {},
          isRestDay: false,
          ...parsed
        };
      } catch (e) {
        console.error("Failed to parse system status:", e);
      }
    }
    return {
      level: 1,
      exp: 0,
      requiredExp: 100,
      streak: 0,
      lastActiveDate: null,
      questCompletionHistory: {},
      currentDay: 1,
      isRestDay: false
    };
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const raw = localStorage.getItem('shadow_fitness_weights');
    if (raw) return JSON.parse(raw);
    
    // Seed default initial progression logs if empty
    if (stats) {
      return [
        { date: 'June 01', weight: stats.currentWeight },
        { date: 'June 07', weight: stats.currentWeight - 0.5 }
      ];
    }
    return [];
  });

  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const raw = localStorage.getItem('shadow_fitness_week');
    return raw ? parseInt(raw) : 1;
  });

  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    const raw = localStorage.getItem('shadow_fitness_plan');
    if (raw) return JSON.parse(raw);
    return {
      workouts: [],
      nutrition: {
        calories: 1800,
        protein: 120,
        carbs: 200,
        fat: 55,
        recommendations: []
      }
    };
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    const raw = localStorage.getItem('shadow_fitness_quests');
    return raw ? JSON.parse(raw) : [];
  });

  const [dietTrackers, setDietTrackers] = useState<CustomDietTracker[]>(() => {
    try {
      const raw = localStorage.getItem('shadow_fitness_diet_trackers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse diet trackers from localStorage:", e);
    }
    return [
      { id: 'diet_1', name: 'Water Intake', current: 0, target: 8, unit: 'glasses' },
      { id: 'diet_2', name: 'Apple Cider Vinegar', current: 0, target: 1, unit: 'shot' },
      { id: 'diet_3', name: 'Eggs Consumed', current: 0, target: 5, unit: 'eggs' },
    ];
  });

  // Navigation state: 'quests' | 'oracle' | 'player'
  const [activeTab, setActiveTab] = useState<'quests' | 'oracle' | 'player'>('quests');

  // Trigger modals
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);
  const [justLeveledUpTo, setJustLeveledUpTo] = useState<number>(1);
  const [showPenalty, setShowPenalty] = useState<boolean>(false);

  // 2. Synchronize memory variables with physical LocalStorage dumps
  useEffect(() => {
    if (stats) {
      localStorage.setItem('shadow_fitness_stats', JSON.stringify(stats));
    }
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_status', JSON.stringify(system));
  }, [system]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_weights', JSON.stringify(weightLogs));
  }, [weightLogs]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_week', String(currentWeek));
  }, [currentWeek]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_quests', JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_plan', JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem('shadow_fitness_diet_trackers', JSON.stringify(dietTrackers));
  }, [dietTrackers]);

  // Seeding quests from current week's Workout/Nutrition Matrix
  useEffect(() => {
    if (stats && quests.length === 0) {
      seedQuestsForDay(plan);
    }
  }, [stats, plan]);

  // Seeding Quests Helper
  const seedQuestsForDay = (currentPlan: WeeklyPlan) => {
    const generatedQuests: Quest[] = [];

    // Select the first workout day as today's active quest if available
    const todayWorkout = currentPlan.workouts && currentPlan.workouts.length > 0 ? currentPlan.workouts[0] : null;

    // Add Workout Quests
    if (todayWorkout && todayWorkout.exercises) {
      todayWorkout.exercises.forEach((ex, idx) => {
        generatedQuests.push({
          id: `workout_${idx}`,
          category: 'workout',
          title: `Exercise: ${ex.name}`,
          description: `Perform ${ex.sets} sets of ${ex.reps}. ${ex.instruction}`,
          completed: false,
          expReward: 25 + idx * 5
        });
      });
    }

    // Add Nutrition Quests
    if (currentPlan.nutrition && currentPlan.nutrition.recommendations) {
      currentPlan.nutrition.recommendations.forEach((meal, idx) => {
        const optionText = meal.options && meal.options.length > 0 ? meal.options[0].split(':')[0] : 'Choose wholesome choices';
        generatedQuests.push({
          id: `nutrition_${idx}`,
          category: 'nutrition',
          title: `Eat: ${meal.meal} Target`,
          description: `Adhere to Smart Choice: ${optionText}`,
          completed: false,
          expReward: 15
        });
      });
    }

    setQuests(generatedQuests);
  };

  // 3. User Trigger Actions (Core logic loop)
  const handleOnboardingComplete = (newStats: PlayerStats) => {
    setStats(newStats);
    // Seed initial progress weight logs based on new stats
    const list = [
      { date: 'Day 1 Base', weight: newStats.currentWeight }
    ];
    setWeightLogs(list);
    
    // Generate active plan as a clean slate (empty workouts and no meal items)
    const emptyPlan: WeeklyPlan = {
      workouts: [],
      nutrition: {
        calories: 1800,
        protein: 120,
        carbs: 200,
        fat: 55,
        recommendations: []
      }
    };
    setPlan(emptyPlan);
    setCurrentWeek(1);
    seedQuestsForDay(emptyPlan);
    playSystemSound('levelup');
  };

  const handleQuestToggle = (questId: string) => {
    playSystemSound('click');
    
    setQuests((prev) => {
      const updated = prev.map((q) => {
        if (q.id === questId) {
          const nextState = !q.completed;
          
          // Adjust player experience points based on toggle actions
          let expGain = nextState ? q.expReward : -q.expReward;
          adjustExperience(expGain);

          return { ...q, completed: nextState };
        }
        return q;
      });
      return updated;
    });
  };

  const adjustExperience = (gain: number) => {
    setSystem((prev) => {
      let newExp = prev.exp + gain;
      let newLevel = prev.level;
      let reqExp = prev.requiredExp;
      let leveledUp = false;

      // Experience overflow logic for sequential Level-up animation triggers
      if (newExp >= reqExp) {
        newExp = newExp - reqExp;
        newLevel += 1;
        reqExp = Math.round(reqExp * 1.3); // increase capacity bounds exponentially
        leveledUp = true;
      } else if (newExp < 0) {
        // Safe check preventing negative experience points in level bounds
        if (newLevel > 1) {
          newLevel -= 1;
          reqExp = Math.round(reqExp / 1.3);
          newExp = reqExp + newExp;
        } else {
          newExp = 0;
        }
      }

      if (leveledUp) {
        setJustLeveledUpTo(newLevel);
        setShowLevelUp(true);
      }

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        requiredExp: reqExp
      };
    });
  };

  const handleUpdateDietTracker = (id: string, current: number) => {
    playSystemSound('click');
    setDietTrackers((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const clamped = Math.max(0, current);
          const oldComplete = item.current >= item.target;
          const newComplete = clamped >= item.target;
          
          if (!oldComplete && newComplete) {
            adjustExperience(15); // +15 EXP for achieving tracker goals!
            playSystemSound('levelup');
          } else if (oldComplete && !newComplete) {
            adjustExperience(-15); // deduct if revoked
          }
          
          return { ...item, current: clamped };
        }
        return item;
      });
      return updated;
    });
  };

  const handleAddDietTracker = (name: string, target: number, unit: string) => {
    playSystemSound('quest');
    setDietTrackers((prev) => {
      const next = [
        ...prev,
        {
          id: `diet_${Date.now()}`,
          name,
          current: 0,
          target: Math.max(1, target),
          unit: unit || 'portions'
        }
      ];
      return next;
    });
  };

  const handleDeleteDietTracker = (id: string) => {
    playSystemSound('warning');
    setDietTrackers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDaily = () => {
    // Calculate completion ratio right now for history before resetting
    const completedVal = quests.filter((q) => q.completed).length;
    const totalVal = quests.length;
    const progressVal = totalVal > 0 ? Math.round((completedVal / totalVal) * 100) : 0;

    // Reset all quests completed status for midnight chronometers
    setQuests((prev) => prev.map((q) => ({ ...q, completed: false })));

    // Reset daily logs intake trackers as well
    setDietTrackers((prev) => prev.map((t) => ({ ...t, current: 0 })));
    
    // Increment active streak & register status history
    setSystem((prev) => {
      const allCompleted = quests.every((q) => q.completed);
      
      let newStreak = prev.streak;
      if (prev.isRestDay) {
        // Current streak is maintained intact rather than reset or incremented
        newStreak = prev.streak;
      } else {
        newStreak = allCompleted ? prev.streak + 1 : 0;
        if (!allCompleted && prev.streak > 0) {
          setShowPenalty(true);
        }
      }

      const activeDayKey = `Day ${prev.currentDay || 1}`;
      const newHistory = {
        ...prev.questCompletionHistory,
        [activeDayKey]: prev.isRestDay ? 100 : progressVal
      };

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: new Date().toLocaleDateString(),
        questCompletionHistory: newHistory,
        currentDay: (prev.currentDay || 1) + 1,
        isRestDay: false // reset rest protocol for the next active cycle
      };
    });
    
    playSystemSound('quest');
  };

  const handleToggleRestDay = () => {
    playSystemSound('click');
    setSystem((prev) => {
      const nextState = !prev.isRestDay;
      if (nextState) {
        playSystemSound('levelup');
      } else {
        playSystemSound('warning');
      }
      return {
        ...prev,
        isRestDay: nextState,
      };
    });
  };

  const handleAddWeightLog = (wt: number) => {
    // Append a standard daily timestamp log
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setWeightLogs((prev) => [...prev, { date: dateStr, weight: wt }]);
    
    // Update player current weight
    if (stats) {
      setStats({ ...stats, currentWeight: wt });
    }
  };

  const handlePlanUpdated = (newPlan: WeeklyPlan, newWeekNum: number) => {
    setPlan(newPlan);
    setCurrentWeek(newWeekNum);
    localStorage.setItem('shadow_fitness_plan', JSON.stringify(newPlan));
    seedQuestsForDay(newPlan);
  };

  const handleSystemWipe = () => {
    if (confirm('WIPE ALL PLAYER ATTRIBUTE HISTORY AND SYSTEM PROGRESS? This Action is irreversible.')) {
      localStorage.clear();
      setStats(null);
      setSystem({
        level: 1,
        exp: 0,
        requiredExp: 100,
        streak: 0,
        lastActiveDate: null,
        questCompletionHistory: {}
      });
      setWeightLogs([]);
      setCurrentWeek(1);
      setQuests([]);
      setDietTrackers([
        { id: 'diet_1', name: 'Water Intake', current: 0, target: 8, unit: 'glasses' },
        { id: 'diet_2', name: 'Apple Cider Vinegar', current: 0, target: 1, unit: 'shot' },
        { id: 'diet_3', name: 'Eggs Consumed', current: 0, target: 5, unit: 'eggs' },
      ]);
      playSystemSound('warning');
    }
  };

  // Determine Level Hierarchy Titles
  const getSubTitle = (lvl: number) => {
    if (lvl >= 10) return 'SHADOW GENERAL';
    if (lvl >= 7) return 'S-RANK ASSASSIN';
    if (lvl >= 4) return 'AWAKENED APPRENTICE';
    return 'E-RANK RECRUIT';
  };

  // Layout selection
  if (!stats) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Calculate high-level stats completed quests
  const completedQuestsCount = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  const xpPercent = Math.min(100, Math.round((system.exp / system.requiredExp) * 100));

  return (
    <div className="min-h-screen bg-system-black text-[#E0E0E0] flex flex-col justify-between max-w-md mx-auto relative border-x border-system-border shadow-2xl pb-16 bg-scanlines select-none" id="app-viewport">
      
      {/* 4. Realtime TOP RPG HUD Bar */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-system-border p-4 space-y-3.5" id="rpg-hud-panel">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm border border-system-cyan/70 bg-system-cyan/10 text-system-cyan shadow-neon-cyan flex items-center justify-center font-display text-lg font-black italic">
              Lvl {system.level}
            </div>
            <div className="flex flex-col">
              <span className="text-system-cyan text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 flex items-center gap-1.5 flex-wrap">
                <span>SYSTEM INTERFACE v4.2</span>
                <span className="text-gray-650 font-normal">|</span>
                <span className="text-gray-400 font-mono text-[9.5px] font-medium tracking-normal">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
              </span>
              <h1 className="font-display text-lg font-black tracking-tight text-white uppercase italic flex items-center gap-1.5 leading-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-system-cyan to-system-violet">
                  {getSubTitle(system.level)}
                </span>
                <Sparkles size={11} className="text-system-cyan animate-pulse" />
              </h1>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-0.5">Active Mult</span>
            <span className="inline-block px-1.5 py-0.5 font-display text-xs font-black text-system-pink bg-system-pink/10 border border-system-pink/20 rounded-sm italic uppercase">
              ×{(1.0 + system.streak * 0.1).toFixed(1)} STR
            </span>
          </div>
        </div>

        {/* EXP Bar widget */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center font-mono text-[9px] font-bold uppercase tracking-widest text-system-violet">
            <span>EXPERIENCE POINTS</span>
            <span className="text-system-cyan font-bold tracking-wider">{system.exp} / {system.requiredExp} EXP</span>
          </div>
          <div className="relative w-full h-2.5 bg-system-black rounded-sm overflow-hidden border border-system-violet/30">
            <div 
              className="h-full bg-gradient-to-r from-system-violet to-system-cyan transition-all duration-500 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main interactive container */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'quests' && (
          <Dashboard 
            stats={stats}
            plan={plan}
            quests={quests}
            onQuestToggle={handleQuestToggle}
            onResetDaily={handleResetDaily}
            streak={system.streak}
            dietTrackers={dietTrackers}
            onUpdateDietTracker={handleUpdateDietTracker}
            onAddDietTracker={handleAddDietTracker}
            onDeleteDietTracker={handleDeleteDietTracker}
            currentDay={system.currentDay || 1}
            isRestDay={system.isRestDay || false}
            onToggleRestDay={handleToggleRestDay}
          />
        )}

        {activeTab === 'oracle' && (
          <OracleTerminal 
            stats={stats}
            currentWeek={currentWeek}
            plan={plan}
            onPlanUpdated={handlePlanUpdated}
          />
        )}

        {activeTab === 'player' && (
          <PlayerStatus 
            stats={stats}
            system={system}
            weightLogs={weightLogs}
            onAddWeightLog={handleAddWeightLog}
            completedQuestsCount={completedQuestsCount}
            onUpdateSystemStatus={(newSystem) => setSystem(newSystem)}
          />
        )}
      </main>

      {/* 5. Mobile Tabbed Navigation System */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#050505]/95 backdrop-blur-md border-t border-system-border py-3 px-4 grid grid-cols-3 gap-1 z-40 shadow-xl" id="bottom-bar-nav">
        <button
          onClick={() => {
            playSystemSound('click');
            setActiveTab('quests');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'quests' ? 'text-system-cyan glow-cyan scale-105 font-bold' : 'text-gray-500 hover:text-white'
          }`}
          id="nav-btn-quests"
        >
          <Dumbbell size={18} />
          <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase">Quests</span>
        </button>

        <button
          onClick={() => {
            playSystemSound('click');
            setActiveTab('oracle');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'oracle' ? 'text-system-cyan glow-cyan scale-105 font-bold' : 'text-gray-500 hover:text-white'
          }`}
          id="nav-btn-oracle"
        >
          <TermIcon size={18} />
          <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase">Oracle</span>
        </button>

        <button
          onClick={() => {
            playSystemSound('click');
            setActiveTab('player');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'player' ? 'text-system-cyan glow-cyan scale-105 font-bold' : 'text-gray-500 hover:text-white'
          }`}
          id="nav-btn-player"
        >
          <User size={18} />
          <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase">Status</span>
        </button>
      </nav>

      {/* Level Up celebrative overlays */}
      {showLevelUp && (
        <LevelUpModal level={justLeveledUpTo} onClose={() => setShowLevelUp(false)} />
      )}

      {/* Penalty warnings overlays */}
      {showPenalty && (
        <PenaltyAlert onClose={() => setShowPenalty(false)} />
      )}

      {/* System Wipe Utility tucked cleanly in footer settings */}
      <div className="px-4 py-3.5 text-center pb-8 bg-black/10 border-t border-system-border">
        <button
          onClick={handleSystemWipe}
          className="font-mono text-[8px] text-gray-700 hover:text-red-500 transition-all uppercase tracking-widest flex items-center gap-1.5 mx-auto"
          id="wipe-data-btn"
        >
          <RefreshCw size={8} /> Wipe System Memory
        </button>
      </div>

    </div>
  );
}
