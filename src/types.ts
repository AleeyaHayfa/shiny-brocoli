export interface PlayerStats {
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  bodyFat?: number;
  goal: 'recomp' | 'fat_loss' | 'muscle_gain';
}

export interface WeeklyPlan {
  workouts: {
    day: string;
    exercises: {
      name: string;
      reps: string;
      sets: number;
      instruction: string;
    }[];
  }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    recommendations: {
      meal: string;
      title: string;
      desc: string;
      options: string[];
    }[];
  };
}

export interface Quest {
  id: string;
  category: 'workout' | 'nutrition' | 'system';
  title: string;
  description: string;
  completed: boolean;
  expReward: number;
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface CustomDietTracker {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
}

export interface SystemStatus {
  level: number;
  exp: number; // Current exp in level
  requiredExp: number; // Required exp to next level
  streak: number;
  lastActiveDate: string | null;
  questCompletionHistory: { [date: string]: number }; // percentage completed per day
  currentDay: number; // Keeps track of active protocol day number
  isRestDay?: boolean; // Pauses daily quest requirements and maintains active streak
}
