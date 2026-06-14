import { PlayerStats, WeeklyPlan } from '../types';

// Helper to calculate total daily energy expenditure (TDEE) and macronutrients
export function generatePlan(stats: PlayerStats, weekNum: number = 1): WeeklyPlan {
  // Simple BMR estimation (Mifflin-St Jeor approximation)
  // Default values if age or bodyfat is missing
  const age = stats.age || 25;
  const height = stats.height || 150;
  const weight = stats.currentWeight;
  const goal = stats.goal;

  // Assuming moderate-to-low activity BMR multiplier
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // male weight-dominant default
  const tdee = Math.round(bmr * 1.35);

  let targetCalories = tdee;
  let proteinRatio = 2.0; // grams per kg of bodyweight
  let fatRatio = 0.8; // grams per kg of bodyweight

  switch (goal) {
    case 'fat_loss':
      targetCalories = Math.round(tdee - 400);
      proteinRatio = 2.2; // Keep protein higher to prevent muscle loss
      break;
    case 'muscle_gain':
      targetCalories = Math.round(tdee + 300);
      proteinRatio = 2.0;
      break;
    case 'recomp':
    default:
      targetCalories = Math.round(tdee - 100);
      proteinRatio = 2.1;
      break;
  }

  // Calculate macronutrient targets
  const proteinGrams = Math.round(weight * proteinRatio);
  const fatGrams = Math.round(weight * fatRatio);
  // Remaining calories go to carbs
  const remainingCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
  const carbGrams = Math.max(50, Math.round(remainingCalories / 4));

  // Progressive Rep Progression Formula:
  // Dynamically increase workout reps/sets slightly based on the selected week.
  const pushupBase = 8 + (weekNum - 1) * 2;
  const burpeeBase = 6 + (weekNum - 1) * 1;
  const plankBase = 30 + (weekNum - 1) * 5;
  const squatBase = 12 + (weekNum - 1) * 2;

  // Generate workout routines
  const workoutDays = [
    {
      day: 'Monday (Day 1): Active Combat',
      exercises: [
        {
          name: 'Knee Push-Ups',
          reps: `${pushupBase} Reps (Slow Controlled, 2s Descent)`,
          sets: 3 + Math.floor(weekNum / 4),
          instruction: 'Keep neck aligned, core tight. Focus on chest expansion.'
        },
        {
          name: 'Shadow Burpees',
          reps: `${burpeeBase} Reps`,
          sets: 3,
          instruction: 'Full push-up style bodyweight drop. Jump with core engaged.'
        },
        {
          name: 'Aura Plank Holds',
          reps: `${plankBase} Seconds`,
          sets: 3,
          instruction: 'Squeeze glutes and abdominals flat. No sagging hips.'
        }
      ]
    },
    {
      day: 'Wednesday (Day 3): Speed Endurance',
      exercises: [
        {
          name: 'Air Squats',
          reps: `${squatBase} Reps (Explosive Leg Drive)`,
          sets: 4,
          instruction: 'Sit back on heels, break parallel under control.'
        },
        {
          name: 'Knee Push-Ups (Wide Stance)',
          reps: `${pushupBase - 2} Reps`,
          sets: 3,
          instruction: 'Wider arm stance to emphasize front delts and outer chest.'
        },
        {
          name: 'Burpee Sprawls',
          reps: `${burpeeBase + 2} Reps`,
          sets: 3,
          instruction: 'Quick drop and recovery. Skip the jump, optimize pace.'
        }
      ]
    },
    {
      day: 'Friday (Day 5): System Overload',
      exercises: [
        {
          name: 'Incline Knee Push-Ups',
          reps: `${pushupBase + 2} Reps`,
          sets: 3,
          instruction: 'Place hands on an elevated standard surface (chair/bed).'
        },
        {
          name: 'Aura Plank Shoulder-Taps',
          reps: `${Math.round(plankBase / 2)} Knee Taps per side`,
          sets: 3,
          instruction: 'Alternate tapping shoulders from pushup posture. Do not rock hips.'
        },
        {
          name: 'Shadow Burpees (Survival Pace)',
          reps: `${burpeeBase - 1} Reps (Deep Breath Interval)`,
          sets: 4,
          instruction: 'Strict tempo. 15s rest after each set.'
        }
      ]
    }
  ];

  // Specific Malaysian meal recommendations featuring "No Fridge, No Stove" constraint
  const foodRecommendations = [
    {
      meal: 'Breakfast',
      title: 'Power-up Nutrient Pack',
      desc: 'Shelf-stable energy with high protein. Mixes at room temperature.',
      options: [
        `Protein Shake: 2 Scoops of Whey/Soy Protein + Room temp water + 1 Medium Banana. [~35g Protein, ~250 Cal]`,
        `Dry Oats porridge: 50g Instant Oats combined with 200ml UHT Boxed Skim/Low Fat Milk (consumed immediately, no stove required) + 1 sliced Apple. [~15g Protein, ~320 Cal]`,
        `7-Eleven Safe Pick: 2 hard-boiled eggs (packaged Rebus Eggs) + 2 slices Wholemeal Bread. [~18g Protein, ~280 Cal]`
      ]
    },
    {
      meal: 'Lunch',
      title: 'Nasi Campur Hack / Dining Out',
      desc: 'Smart Malaysian selection logic for local lunch spots.',
      options: [
        `Malay Mixed Rice Mix: 1 small scoop rice (Nasi Separa) + 1 large whole chicken breast (Dada Ayam - request no skin/gravy) + generous raw beansprouts/cabbage (Kubis/Taugeh). [~40g Protein, ~480 Cal]`,
        `Nasi Gepuk Restructure: Custom order Nasi Gepuk, skinless steam/grilled chicken, request chili sambal on the side, limit oil, do NOT eat fried tofu/tempeh. [~35g Protein, ~500 Cal]`,
        `Nasi Ayam Roasted: Ask for clean roasted chicken breast, separate soy/chilli sauce, and double the cucumber slices. [~30g Protein, ~450 Cal]`
      ]
    },
    {
      meal: 'Mid-Day Quest',
      title: 'Hunter\'s Rations (Snacks)',
      desc: 'Strictly zero preparation, highly portable items.',
      options: [
        `1 Can of Canned Chilli Tuna (strained) or Tuna in Water in a split pita or wrap bread. [~22g Protein, ~200 Cal]`,
        `A pack of high protein Roasted Chickpeas/Broad Beans (found in local grocery snack aisles) + 30g almonds. [~12g Protein, ~220 Cal]`,
        `1 carton/box of high protein ready-to-drink chocolate soy milk (e.g., Yeo's or Hershey Soy milk - low sugar) + 1 Apple. [~12g Protein, ~180 Cal]`
      ]
    },
    {
      meal: 'Dinner',
      title: 'High-Affinity Muscle Seal',
      desc: 'High protein dinner alternatives safe to obtain without home cooking tools.',
      options: [
        `Fast Protein Feast: 1 whole cooked Roast Chicken Breast (purchasable hot from grocery stores like Lotus's/Jaya Grocer) + sliced cucumbers/cherry tomatoes. [~50g Protein, ~350 Cal]`,
        `Convenience Combo: 2 packets of pre-cooked hard boiled eggs (4 eggs total) + single sandwich bread + chili sauce. [~24g Protein, ~320 Cal]`,
        `Tuna Salad Hack: 1 can of Tuna in Water + 1 packaged pre-washed lettuce bowl or convenience salad container. Add cherry tomatoes. [~28g Protein, ~210 Cal]`
      ]
    }
  ];

  return {
    workouts: workoutDays,
    nutrition: {
      calories: targetCalories,
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams,
      recommendations: foodRecommendations
    }
  };
}
