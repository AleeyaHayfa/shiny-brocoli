import React, { useState } from 'react';
import { PlayerStats, WeeklyPlan } from '../types';
import { generatePlan } from '../data/planGenerator';
import { Terminal as TermIcon, Shield, Flame, Apple, RefreshCw, Zap, SkipForward, Info, Edit2, Trash2, Plus, Check, X, Sliders } from 'lucide-react';
import { playSystemSound } from './SystemAlert';

interface OracleTerminalProps {
  stats: PlayerStats;
  currentWeek: number;
  onPlanUpdated: (plan: WeeklyPlan, selectedWeek: number) => void;
  plan: WeeklyPlan;
}

export default function OracleTerminal({ stats, currentWeek, onPlanUpdated, plan }: OracleTerminalProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'workout' | 'nutrition'>('workout');

  // Exercise editing states
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [draftExercises, setDraftExercises] = useState<{
    name: string;
    reps: string;
    sets: number;
    instruction: string;
  }[]>([]);

  // Nutrition editing states
  const [isEditingNutrition, setIsEditingNutrition] = useState<boolean>(false);
  const [draftCalories, setDraftCalories] = useState<number>(plan.nutrition.calories);
  const [draftProtein, setDraftProtein] = useState<number>(plan.nutrition.protein);
  const [draftCarbs, setDraftCarbs] = useState<number>(plan.nutrition.carbs);
  const [draftFat, setDraftFat] = useState<number>(plan.nutrition.fat);
  const [draftMeals, setDraftMeals] = useState<any[]>(plan.nutrition.recommendations);

  const startEditingDay = (dayIdx: number) => {
    playSystemSound('click');
    setEditingDayIndex(dayIdx);
    setDraftExercises([...plan.workouts[dayIdx].exercises]);
  };

  const updateDraftField = (idx: number, field: string, value: any) => {
    setDraftExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  };

  const deleteDraftExercise = (idx: number) => {
    playSystemSound('warning');
    setDraftExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const addDraftExercise = () => {
    playSystemSound('click');
    setDraftExercises((prev) => [
      ...prev,
      { name: 'Push-up Variation', reps: '12 reps', sets: 4, instruction: 'Keep proper posture.' },
    ]);
  };

  const saveDayChanges = () => {
    playSystemSound('quest');
    const updatedWorkouts = plan.workouts.map((rout, i) => {
      if (i === editingDayIndex) {
        return {
          ...rout,
          exercises: draftExercises,
        };
      }
      return rout;
    });
    
    onPlanUpdated({
      ...plan,
      workouts: updatedWorkouts,
    }, selectedWeek);
    
    setEditingDayIndex(null);
  };

  const cancelDayChanges = () => {
    playSystemSound('click');
    setEditingDayIndex(null);
  };

  const startEditingNutrition = () => {
    playSystemSound('click');
    setDraftCalories(plan.nutrition.calories);
    setDraftProtein(plan.nutrition.protein);
    setDraftCarbs(plan.nutrition.carbs);
    setDraftFat(plan.nutrition.fat);
    setDraftMeals(JSON.parse(JSON.stringify(plan.nutrition.recommendations)));
    setIsEditingNutrition(true);
  };

  const updateDraftMealField = (mealIdx: number, field: string, value: string) => {
    setDraftMeals((prev) =>
      prev.map((meal, i) => (i === mealIdx ? { ...meal, [field]: value } : meal))
    );
  };

  const updateDraftMealOption = (mealIdx: number, optIdx: number, value: string) => {
    setDraftMeals((prev) =>
      prev.map((meal, i) => {
        if (i === mealIdx) {
          const updatedOptions = meal.options.map((opt: string, oIdx: number) =>
            oIdx === optIdx ? value : opt
          );
          return { ...meal, options: updatedOptions };
        }
        return meal;
      })
    );
  };

  const addDraftMealOption = (mealIdx: number) => {
    playSystemSound('click');
    setDraftMeals((prev) =>
      prev.map((meal, i) => {
        if (i === mealIdx) {
          return { ...meal, options: [...meal.options, 'New Choice target details'] };
        }
        return meal;
      })
    );
  };

  const deleteDraftMealOption = (mealIdx: number, optIdx: number) => {
    playSystemSound('warning');
    setDraftMeals((prev) =>
      prev.map((meal, i) => {
        if (i === mealIdx) {
          return { ...meal, options: meal.options.filter((_: string, oIdx: number) => oIdx !== optIdx) };
        }
        return meal;
      })
    );
  };

  const saveNutritionChanges = () => {
    playSystemSound('quest');
    onPlanUpdated({
      ...plan,
      nutrition: {
        calories: draftCalories,
        protein: draftProtein,
        carbs: draftCarbs,
        fat: draftFat,
        recommendations: draftMeals,
      },
    }, selectedWeek);
    setIsEditingNutrition(false);
  };

  const deleteWorkoutDay = (dayIdx: number) => {
    playSystemSound('warning');
    const updatedWorkouts = plan.workouts.filter((_, i) => i !== dayIdx);
    onPlanUpdated({
      ...plan,
      workouts: updatedWorkouts,
    }, selectedWeek);
  };

  const addNewWorkoutDay = () => {
    playSystemSound('quest');
    const newDayNum = plan.workouts.length + 1;
    const newDay = {
      day: `DAY 0${newDayNum} (CUSTOM)`,
      exercises: [
        { name: 'Push-up Variation', reps: '12 reps', sets: 4, instruction: 'Keep proper posture.' }
      ]
    };
    onPlanUpdated({
      ...plan,
      workouts: [...plan.workouts, newDay]
    }, selectedWeek);
  };

  const deleteDietPartDirectly = (mealIdx: number) => {
    playSystemSound('warning');
    const updatedRecommendations = plan.nutrition.recommendations.filter((_, i) => i !== mealIdx);
    onPlanUpdated({
      ...plan,
      nutrition: {
        ...plan.nutrition,
        recommendations: updatedRecommendations,
      },
    }, selectedWeek);
  };

  const executeRecalibration = (weekNum: number) => {
    playSystemSound('warning');
    setIsGenerating(true);
    setSelectedWeek(weekNum);
    setTerminalLogs([]);

    const logs = [
      `[SYSTEM] Connecting to Solo Leveling Oracle Matrix...`,
      `[STATS] Analyzing height (${stats.height}cm) and target weight (${stats.targetWeight}kg)...`,
      `[RULE] Locked class detected: HOME-BASED (NO EQUIPMENT)...`,
      `[WEEK] CALIBRATING PROGRESSIVE OVERLOAD FOR WEEK: ${weekNum}...`,
      `[MATH] Incrementing knee push-ups, planks, and burpee ratios by factor (+${(weekNum - 1) * 12}%)`,
      `[DIET] Parsing strict Malaysian food index: NO FRIDGE, NO STOVE constraints...`,
      `[ORACLE] Generating optimal macronutrient targets...`,
      `[SYSTEM] Realignment calculations complete!`
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, log]);
        playSystemSound('click');
        if (index === logs.length - 1) {
          const generated = generatePlan(stats, weekNum);
          onPlanUpdated(generated, weekNum);
          setIsGenerating(false);
          playSystemSound('quest');
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="space-y-6" id="oracle-terminal-view">
      {/* Immersive Header */}
      <div className="p-4 rounded-sm border border-system-border bg-system-dark relative overflow-hidden bg-scanlines">
        <div className="absolute top-0 right-0 p-1 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-system-cyan animate-ping"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-system-cyan"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-sm border border-system-cyan/30 bg-system-cyan/10 text-system-cyan shadow-neon-cyan">
            <TermIcon size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold italic uppercase text-white tracking-widest flex items-center gap-1.5">
              Solo Oracle Terminal
            </h2>
            <p className="font-mono text-[10px] text-gray-400">
              CLASS-D REALTIME REALIGNMENT ENGINE
            </p>
          </div>
        </div>
      </div>

      {/* Week selection slider with immediate feedback to prove progressive overload rules */}
      <div className="p-4 rounded-sm border border-system-border bg-system-card space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            Overload Multiplier (System Week)
          </span>
          <span className="font-display font-black text-system-cyan italic">
            WEEK {selectedWeek} / 8
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="8"
            value={selectedWeek}
            onChange={(e) => executeRecalibration(parseInt(e.target.value))}
            className="flex-1 accent-system-cyan h-1 bg-system-black rounded-none"
          />
          <button
            onClick={() => executeRecalibration(selectedWeek === 8 ? 1 : selectedWeek + 1)}
            className="p-2 bg-system-black border border-system-border hover:border-system-cyan text-system-cyan rounded-none transition-all active:scale-90"
            title="Step Overload Level"
            id="increment-overload-btn"
          >
            <SkipForward size={14} />
          </button>
        </div>
        <p className="font-mono text-[9px] text-gray-500 leading-normal">
          Modifying the system week instructs the Oracle to increment exercise volume, reps, sets, and load timings mathematically dynamically to trigger muscle recomposition adaptation.
        </p>
      </div>

      {/* Terminal logs or display layout */}
      {isGenerating ? (
        <div className="p-5 font-mono text-xs text-system-cyan bg-system-black border border-system-cyan/40 h-52 overflow-y-auto rounded-sm space-y-1 bg-scanlines" id="terminal-screen-loader">
          {terminalLogs.map((log, i) => (
            <div key={i} className="animate-fade-in flex items-start gap-1">
              <span className="text-gray-600 font-bold">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          <div className="w-2.5 h-4 bg-system-cyan animate-pulse inline-block mt-1"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Internal quick toggle */}
          <div className="grid grid-cols-2 p-1 bg-system-black rounded-sm border border-system-border">
            <button
              onClick={() => {
                playSystemSound('click');
                setActiveTab('workout');
              }}
              className={`py-2 text-xs font-display font-medium tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'workout'
                  ? 'bg-system-cyan/15 border border-system-cyan/20 text-system-cyan rounded-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              id="oracle-tab-workout"
            >
              <Flame size={13} /> Workouts
            </button>
            <button
              onClick={() => {
                playSystemSound('click');
                setActiveTab('nutrition');
              }}
              className={`py-2 text-xs font-display font-medium tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'nutrition'
                  ? 'bg-system-violet/15 border border-system-violet/20 text-system-violet rounded-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              id="oracle-tab-nutrition"
            >
              <Apple size={13} /> No-Cook Nutrition
            </button>
          </div>

          {activeTab === 'workout' ? (
            <div className="space-y-4" id="oracle-workouts-matrix">
              <div className="flex justify-between items-center px-1">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                  Routine Protocol Matrix ({plan.workouts.length} active sessions)
                </span>
                <button
                  onClick={addNewWorkoutDay}
                  className="px-2 py-1 text-[9px] font-display font-extrabold uppercase italic tracking-wider text-system-cyan border border-system-cyan/30 hover:bg-system-cyan/10 transition-all cursor-pointer flex items-center gap-1"
                >
                  + Add New Day / Routine
                </button>
              </div>

              {plan.workouts.map((rout, index) => (
                <div key={index} className="p-4 bg-system-card border border-system-border rounded-sm space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-system-border pb-2">
                    <span className="font-display font-bold text-sm tracking-wide text-white italic">
                      {rout.day}
                    </span>
                    <div className="flex items-center gap-2">
                      {editingDayIndex === index ? (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm bg-system-pink/10 border border-system-pink/20 text-system-pink select-none uppercase animate-pulse">
                          EDITING...
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingDay(index)}
                            className="px-2 py-0.5 font-display uppercase tracking-wider italic text-[9px] text-system-cyan border border-system-cyan/20 hover:border-system-cyan bg-system-cyan/5 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 size={9} /> Edit Routine
                          </button>
                          <button
                            onClick={() => deleteWorkoutDay(index)}
                            className="px-2 py-0.5 font-display uppercase tracking-wider text-[9px] text-red-400 border border-red-500/20 hover:border-red-500 bg-red-500/5 transition-all cursor-pointer flex items-center gap-1 font-bold italic"
                            title="Delete Routine Day"
                          >
                            <Trash2 size={9} /> Delete Day
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingDayIndex === index ? (
                    <div className="space-y-4 pt-1 animate-fade-in" id={`edit-day-${index}-form`}>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-system-cyan tracking-widest pl-1">
                        <span>Modify Exercise Sequence</span>
                        <button
                          onClick={addDraftExercise}
                          className="px-2.5 py-1 text-[9px] bg-system-black border border-system-cyan/30 text-system-cyan hover:border-system-cyan transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={10} /> Add Exercise
                        </button>
                      </div>

                      <div className="space-y-4">
                        {draftExercises.length === 0 ? (
                          <div className="p-4 border border-system-border bg-system-dark/30 text-center text-gray-500 font-mono text-[10px] italic">
                            NO EXERCISES CURRENTLY ASSIGNED. CLICK "+ Add Exercise" TO BEGIN.
                          </div>
                        ) : (
                          draftExercises.map((draftEx, dIdx) => (
                            <div key={dIdx} className="p-3 bg-system-black border border-system-border/60 relative space-y-2">
                              <button
                                onClick={() => deleteDraftExercise(dIdx)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete Exercise"
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-gray-500">#{dIdx + 1}</span>
                                <input
                                  type="text"
                                  value={draftEx.name}
                                  onChange={(e) => updateDraftField(dIdx, 'name', e.target.value)}
                                  className="flex-1 bg-transparent border-b border-system-border focus:border-system-cyan text-xs font-display font-bold uppercase text-white outline-none pb-0.5"
                                  placeholder="Exercise Name"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] text-gray-600 block w-9">Sets:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={draftEx.sets}
                                    onChange={(e) => updateDraftField(dIdx, 'sets', parseInt(e.target.value) || 1)}
                                    className="w-full bg-system-dark border border-system-border text-center text-xs py-0.5 outline-none font-mono text-white"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] text-gray-600 block w-9">Reps:</span>
                                  <input
                                    type="text"
                                    value={draftEx.reps}
                                    onChange={(e) => updateDraftField(dIdx, 'reps', e.target.value)}
                                    className="w-full bg-system-dark border border-system-border text-center text-xs py-0.5 outline-none font-mono text-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <textarea
                                  value={draftEx.instruction}
                                  onChange={(e) => updateDraftField(dIdx, 'instruction', e.target.value)}
                                  className="w-full bg-system-dark border border-system-border text-[10px] p-1.5 text-gray-400 font-mono outline-none resize-none h-12 leading-normal"
                                  placeholder="Movement / execution form instructions"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={cancelDayChanges}
                          className="py-2 bg-system-black border border-system-border hover:border-gray-500 text-gray-400 font-display text-[10px] font-extrabold uppercase italic tracking-widest cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveDayChanges}
                          className="py-2 bg-system-cyan/15 border border-system-cyan text-system-cyan hover:bg-system-cyan/20 font-display text-[10px] font-extrabold uppercase italic tracking-widest cursor-pointer"
                        >
                          Save Day
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rout.exercises.map((ex, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="pt-1 select-none">
                            <span className="w-5 h-5 flex items-center justify-center border border-system-border rounded-none bg-system-black text-[10px] text-gray-500 font-mono font-bold">
                              0{idx + 1}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-display font-black text-sm tracking-wider uppercase text-white flex items-center gap-1.5">
                              {ex.name} <span className="font-mono text-[10px] text-system-cyan font-normal">{ex.sets}s <span>×</span> {ex.reps}</span>
                            </h4>
                            <p className="font-mono text-[10px] text-gray-400 leading-normal">
                              {ex.instruction}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs" id="oracle-nutrition-matrix">
              {/* Edit nutrition header bar */}
              <div className="flex justify-between items-center pr-1 flex-wrap gap-2">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest pl-1">
                  NUTRITIONAL INTAKE MATRIX
                </span>
                {isEditingNutrition ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSystemSound('click');
                        setDraftMeals((prev) => [
                          ...prev,
                          {
                            meal: 'NEW INTAKE',
                            title: 'Custom Recovery Option',
                            desc: 'Available at local stores (ready-to-eat)',
                            options: ['Protein Shake / Liquid Elixir', 'Boiled Eggs Combo']
                          }
                        ]);
                      }}
                      className="px-2.5 py-1 font-display uppercase tracking-wider italic text-[9px] text-system-violet border border-dashed border-system-violet/40 bg-system-violet/5 hover:bg-system-violet/15 cursor-pointer font-bold flex items-center gap-1"
                    >
                      <Plus size={10} /> + Add Diet Part
                    </button>
                    <button
                      onClick={() => {
                        playSystemSound('click');
                        setIsEditingNutrition(false);
                      }}
                      className="px-3 py-1 font-display uppercase tracking-wider italic text-[9px] text-gray-400 border border-system-border hover:bg-system-dark cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNutritionChanges}
                      className="px-3 py-1 font-display uppercase tracking-wider italic text-[9px] text-system-violet border border-system-violet/40 bg-system-violet/10 hover:bg-system-violet/20 hover:border-system-violet font-bold cursor-pointer"
                    >
                      Save Diet Plan
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditingNutrition}
                    className="px-3 py-1 font-display uppercase tracking-wider italic text-[9px] text-system-violet border border-system-violet/30 hover:bg-system-violet/10 cursor-pointer"
                  >
                    📝 Edit Diet Plan
                  </button>
                )}
              </div>

              {/* Macros Box */}
              {isEditingNutrition ? (
                <div className="p-4 rounded-sm border border-system-violet/30 bg-system-violet/10 grid grid-cols-4 gap-2 text-center relative overflow-hidden bg-scanlines">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-system-violet"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 tracking-wider">CALORIES</span>
                    <input
                      type="number"
                      value={draftCalories}
                      onChange={(e) => setDraftCalories(parseInt(e.target.value) || 0)}
                      className="bg-system-black border border-system-border text-center font-display text-sm font-black text-white w-full py-0.5 mt-1 outline-none"
                    />
                    <span className="text-[8px] text-gray-600 font-bold lowercase">kcal</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-system-violet tracking-wider">PROTEIN</span>
                    <input
                      type="number"
                      value={draftProtein}
                      onChange={(e) => setDraftProtein(parseInt(e.target.value) || 0)}
                      className="bg-system-black border border-system-border text-center font-display text-sm font-black text-system-violet w-full py-0.5 mt-1 outline-none font-bold"
                    />
                    <span className="text-[8px] text-system-violet/60 font-bold uppercase">STR</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 tracking-wider">CARBS</span>
                    <input
                      type="number"
                      value={draftCarbs}
                      onChange={(e) => setDraftCarbs(parseInt(e.target.value) || 0)}
                      className="bg-system-black border border-system-border text-center font-display text-sm font-black text-white w-full py-0.5 mt-1 outline-none"
                    />
                    <span className="text-[8px] text-gray-600 font-bold uppercase">ENE</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-405 tracking-wider">FAT</span>
                    <input
                      type="number"
                      value={draftFat}
                      onChange={(e) => setDraftFat(parseInt(e.target.value) || 0)}
                      className="bg-system-black border border-system-border text-center font-display text-sm font-black text-white w-full py-0.5 mt-1 outline-none"
                    />
                    <span className="text-[8px] text-gray-600 font-bold uppercase">VIT</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-sm border border-system-violet/30 bg-system-violet/10 grid grid-cols-4 gap-2 text-center relative overflow-hidden bg-scanlines">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-system-violet"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 tracking-wider">CALORIES</span>
                    <span className="font-display text-lg font-black text-white italic">{plan.nutrition.calories}</span>
                    <span className="text-[8px] text-gray-600 font-bold lowercase">kcal</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 tracking-wider">PROTEIN</span>
                    <span className="font-display text-lg font-black text-system-violet italic">{plan.nutrition.protein}g</span>
                    <span className="text-[8px] text-system-violet/60 font-bold uppercase">STR</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 tracking-wider">CARBS</span>
                    <span className="font-display text-lg font-black text-white italic">{plan.nutrition.carbs}g</span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase">ENE</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 tracking-wider">FAT</span>
                    <span className="font-display text-lg font-black text-white italic">{plan.nutrition.fat}g</span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase">VIT</span>
                  </div>
                </div>
              )}
 
              {/* Strict Malaysian "No Fridge / No Stove" plans */}
              {isEditingNutrition ? (
                draftMeals.map((meal, idx) => (
                  <div key={idx} className="p-4 bg-system-card rounded-sm border border-system-border space-y-2.5">
                    <div className="flex gap-2 items-center border-b border-system-border pb-1.5 justify-between">
                      <div className="flex gap-2 items-center flex-1">
                        <input
                          type="text"
                          value={meal.meal}
                          onChange={(e) => updateDraftMealField(idx, 'meal', e.target.value)}
                          className="text-[10px] px-2 py-0.5 rounded-sm bg-system-violet/15 text-system-violet font-bold uppercase border border-system-violet/20 focus:border-system-violet outline-none"
                        />
                        <input
                          type="text"
                          value={meal.title}
                          onChange={(e) => updateDraftMealField(idx, 'title', e.target.value)}
                          className="font-display font-bold text-sm text-white tracking-wide uppercase italic border-b border-transparent focus:border-system-violet outline-none flex-1 ml-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSystemSound('warning');
                          setDraftMeals((prev) => prev.filter((_, mIdx) => mIdx !== idx));
                        }}
                        className="text-red-400 hover:text-red-500 hover:border-red-500/50 p-1 font-mono text-[9px] uppercase tracking-wider border border-red-500/10 px-1.5 transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete Diet Part"
                      >
                        <Trash2 size={10} /> Delete Part
                      </button>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block mb-0.5">Constraint:</span>
                      <input
                        type="text"
                        value={meal.desc}
                        onChange={(e) => updateDraftMealField(idx, 'desc', e.target.value)}
                        className="w-full bg-system-black/60 border border-system-border/60 focus:border-system-violet p-1.5 text-[9px] text-gray-400 font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[rgb(138,43,226)] uppercase">Alternative Options list:</span>
                        <button
                          type="button"
                          onClick={() => addDraftMealOption(idx)}
                          className="text-[9px] border border-system-violet/30 hover:border-system-violet px-2 py-0.5 select-none font-mono text-gray-400 cursor-pointer"
                        >
                          + Add food
                        </button>
                      </div>
                      <div className="space-y-1.5 pl-1.5 border-l border-system-violet/30">
                        {meal.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex gap-1">
                            <span className="text-system-violet leading-none select-none mt-1.5 font-bold">•</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateDraftMealOption(idx, oIdx, e.target.value)}
                              className="w-full bg-system-black/30 border border-system-border/40 focus:border-system-violet text-[10px] text-gray-300 p-1 font-mono outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => deleteDraftMealOption(idx, oIdx)}
                              className="text-gray-500 hover:text-red-500 p-1 transition-colors cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                plan.nutrition.recommendations.map((meal, idx) => (
                  <div key={idx} className="p-4 bg-system-card rounded-sm border border-system-border space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-system-border pb-1.5 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-system-violet/15 text-system-violet font-bold uppercase">
                          {meal.meal}
                        </span>
                        <h4 className="font-display font-bold text-sm text-white tracking-wide uppercase italic">
                          {meal.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => deleteDietPartDirectly(idx)}
                        className="text-red-400/80 hover:text-red-400 p-1 duration-150 rounded-none cursor-pointer text-[9px] font-mono border border-transparent hover:bg-red-500/5 px-2 flex items-center gap-1 font-bold italic"
                        title="Delete Diet Part"
                      >
                        <Trash2 size={9} /> Delete Part
                      </button>
                    </div>
                    <p className="font-mono text-[9px] text-gray-500 leading-normal italic">
                      💡 Class Constraint: {meal.desc}
                    </p>
                    <div className="space-y-2 pl-1.5 border-l border-system-violet/30">
                      {meal.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-[10px] text-gray-300 leading-relaxed relative pl-3">
                          <span className="absolute left-0 top-1 text-system-violet font-bold">•</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
