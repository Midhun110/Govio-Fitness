export interface UserProfile {
  sex: 'male' | 'female';
  date_of_birth: string; // YYYY-MM-DD
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitness_goal: 'lose' | 'maintain' | 'gain' | 'recomposition' | 'endurance';
  full_name?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  workout_frequency?: '0-1' | '2-3' | '4-5' | '6+';
  preferred_workout_environment?: 'gym' | 'home' | 'outdoor' | 'calisthenics';
  injuries_limitations?: string;
  dietary_preference?: 'veg' | 'non_veg' | 'vegan' | 'eggetarian';
  weekly_session_goal?: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  primary_muscle?: string;
  secondary_muscles?: string[];
  instructions?: string[];
  form_tips?: string[];
  common_mistakes?: string[];
  image_url?: string;
  user_id?: string;
  is_custom?: boolean;
  muscleFocusNote?: string;
}

export interface NutritionMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
  daily_calorie_goal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

/**
 * Calculates BMI, BMR, TDEE, Calorie Goal, and Macronutrients splits based on biometrics.
 * This is a pure function.
 */
export function calculateNutritionMetrics(profile: UserProfile): NutritionMetrics {
  // 1. Calculate Age
  const dob = new Date(profile.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 0) age = 0;

  // 2. Calculate BMI
  const height_m = profile.height_cm / 100;
  const bmi = profile.weight_kg / (height_m * height_m);
  const roundedBmi = Math.round(bmi * 100) / 100;

  // 3. Calculate BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (profile.sex === 'male') {
    bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age + 5;
  } else {
    bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age - 161;
  }
  const roundedBmr = Math.round(bmr * 10) / 10;

  // 4. Calculate TDEE
  let activityMultiplier = 1.2;
  switch (profile.activity_level) {
    case 'sedentary':
      activityMultiplier = 1.2;
      break;
    case 'light':
      activityMultiplier = 1.375;
      break;
    case 'moderate':
      activityMultiplier = 1.55;
      break;
    case 'active':
      activityMultiplier = 1.725;
      break;
    case 'very_active':
      activityMultiplier = 1.9;
      break;
  }
  const tdee = roundedBmr * activityMultiplier;
  const roundedTdee = Math.round(tdee * 10) / 10;

  // 5. Calculate Daily Calorie Goal adjusted by goal
  let dailyCalorieGoal = roundedTdee;
  switch (profile.fitness_goal) {
    case 'lose':
      dailyCalorieGoal = roundedTdee - 500;
      break;
    case 'maintain':
      dailyCalorieGoal = roundedTdee;
      break;
    case 'gain':
      dailyCalorieGoal = roundedTdee + 300;
      break;
    case 'recomposition':
      dailyCalorieGoal = roundedTdee;
      break;
    case 'endurance':
      dailyCalorieGoal = roundedTdee; // Maintenance/sustained energy for endurance
      break;
  }
  const roundedCalorieGoal = Math.round(dailyCalorieGoal);

  // 6. Calculate Macronutrients splits
  const protein_g = Math.round(profile.weight_kg * 1.8);
  const fat_g = Math.round((roundedCalorieGoal * 0.25) / 9);
  const carbs_g = Math.round((roundedCalorieGoal - (protein_g * 4 + fat_g * 9)) / 4);
  const roundedCarbs = Math.max(0, carbs_g);

  return {
    bmi: roundedBmi,
    bmr: roundedBmr,
    tdee: roundedTdee,
    daily_calorie_goal: roundedCalorieGoal,
    protein_g,
    fat_g,
    carbs_g: roundedCarbs,
  };
}
