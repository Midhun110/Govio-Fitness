export interface UserProfile {
  sex: 'male' | 'female';
  date_of_birth: string; // YYYY-MM-DD
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitness_goal: 'lose' | 'maintain' | 'gain' | 'recomposition' | 'endurance' | 'strength';
  full_name?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  workout_frequency?: '0-1' | '2-3' | '4-5' | '6+';
  preferred_workout_environment?: 'gym' | 'home' | 'outdoor' | 'calisthenics';
  training_environment?: 'gym' | 'home' | 'outdoor' | 'calisthenics';
  home_equipment_level?: 'none' | 'some' | 'full';
  injuries_limitations?: string;
  dietary_preference?: 'veg' | 'non_veg' | 'vegan' | 'eggetarian';
  weekly_session_goal?: number;
  journey_start_date?: string;
  training_days_per_week?: number;
  training_days?: string[];
  program_day?: number;
  program_start_date?: string;
  program_workouts_completed?: number;
  classified_age_group?: 'Teen' | 'Young Adult' | 'Adult' | 'Senior';
  classified_experience?: 'Beginner' | 'Intermediate' | 'Advanced';
  classified_location?: 'Gym' | 'Home';
  classified_equipment?: 'Full Gym Equipment' | 'Basic Home Equipment' | 'No Equipment';
  classified_goal?: 'Build Muscle' | 'Lose Fat' | 'Stay Fit' | 'Increase Strength' | 'Improve Endurance';
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
  equipment_required?: 'gym_machine' | 'barbell' | 'dumbbell' | 'bodyweight' | 'resistance_band';
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

export function normalizeFitnessGoal(goal?: string | null): 'lose' | 'maintain' | 'gain' | 'recomposition' | 'endurance' {
  if (!goal) return 'maintain';
  const clean = goal.toLowerCase().trim().replace(/_/g, ' ');
  if (clean.includes('gain') || clean.includes('build muscle') || clean.includes('build_muscle') || clean.includes('hypertrophy') || clean.includes('strength') || clean.includes('powerlifting')) {
    return 'gain';
  }
  if (clean.includes('lose') || clean.includes('fat') || clean.includes('cut')) {
    return 'lose';
  }
  if (clean.includes('maintain') || clean.includes('hold')) {
    return 'maintain';
  }
  if (clean.includes('endurance') || clean.includes('stamina') || clean.includes('cardio') || clean.includes('improve')) {
    return 'endurance';
  }
  if (clean.includes('recomp')) {
    return 'recomposition';
  }
  return 'maintain';
}

export function normalizeExperienceLevel(level?: string | null): 'beginner' | 'intermediate' | 'advanced' {
  if (!level) return 'intermediate';
  const clean = level.toLowerCase().trim();
  if (clean.includes('begin')) return 'beginner';
  if (clean.includes('inter')) return 'intermediate';
  if (clean.includes('adv')) return 'advanced';
  return 'intermediate';
}

/**
 * Calculates BMI, BMR, TDEE, Calorie Goal, and Macronutrients splits based on biometrics.
 * This is a pure function.
 */
export function calculateNutritionMetrics(profile: UserProfile): NutritionMetrics {
  // 1. Calculate Age with fallbacks
  let age = 30; // Default fallback age
  if (profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }
  }
  if (age < 0) age = 0;

  // Fallbacks for biometrics
  const weight = profile.weight_kg || 70;
  const height = profile.height_cm || 175;
  const sex = profile.sex || profile.gender || 'male';

  // 2. Calculate BMI
  const height_m = height / 100;
  const bmi = weight / (height_m * height_m);
  const roundedBmi = Math.round(bmi * 100) / 100;

  // 3. Calculate BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (sex === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
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
  switch (normalizeFitnessGoal(profile.fitness_goal)) {
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
  const protein_g = Math.round(weight * 1.8);
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

/**
 * Determines if an exercise matches a user's environment and equipment constraints.
 */
export function isExerciseMatch(
  exercise: Exercise,
  environment?: string | null,
  homeEquipmentLevel?: string | null
): boolean {
  if (!environment) return true;
  
  const env = environment.toLowerCase();
  const eq = exercise.equipment_required ? exercise.equipment_required.toLowerCase() : 'bodyweight';

  if (env === 'gym') {
    return true;
  }

  if (env === 'calisthenics' || env === 'outdoor') {
    return eq === 'bodyweight';
  }

  if (env === 'home') {
    const level = homeEquipmentLevel ? homeEquipmentLevel.toLowerCase() : 'none';
    if (level === 'none') {
      return eq === 'bodyweight';
    }
    if (level === 'some') {
      return eq === 'bodyweight' || eq === 'dumbbell' || eq === 'resistance_band';
    }
    if (level === 'full') {
      return true;
    }
  }

  return true;
}

/**
 * Filters a list of exercises based on the user's environment and equipment constraints.
 */
export function filterExercisesForUser(
  exercises: Exercise[],
  environment?: string | null,
  homeEquipmentLevel?: string | null
): Exercise[] {
  return exercises.filter(ex => isExerciseMatch(ex, environment, homeEquipmentLevel));
}

export interface UserClassification {
  classified_age_group: 'Teen' | 'Young Adult' | 'Adult' | 'Senior';
  classified_experience: 'Beginner' | 'Intermediate' | 'Advanced';
  classified_location: 'Gym' | 'Home';
  classified_equipment: 'Full Gym Equipment' | 'Basic Home Equipment' | 'No Equipment';
  classified_goal: 'Build Muscle' | 'Lose Fat' | 'Stay Fit' | 'Increase Strength' | 'Improve Endurance';
}

export function classifyUserProfile(profile: Partial<UserProfile>): UserClassification {
  // 1. Age Group (from DOB)
  let age = 30; // default to Young Adult fallback
  if (profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        calculatedAge--;
      }
      age = calculatedAge;
    }
  }

  let ageGroup: 'Teen' | 'Young Adult' | 'Adult' | 'Senior' = 'Young Adult';
  if (age >= 13 && age <= 17) {
    ageGroup = 'Teen';
  } else if (age >= 18 && age <= 35) {
    ageGroup = 'Young Adult';
  } else if (age >= 36 && age <= 50) {
    ageGroup = 'Adult';
  } else if (age >= 51) {
    ageGroup = 'Senior';
  } else if (age < 13) {
    ageGroup = 'Teen';
  }

  // 2. Experience Level
  let experience: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
  if (profile.experience_level) {
    const exp = profile.experience_level.toLowerCase();
    if (exp.includes('begin')) {
      experience = 'Beginner';
    } else if (exp.includes('inter')) {
      experience = 'Intermediate';
    } else if (exp.includes('adv')) {
      experience = 'Advanced';
    }
  }

  // 3. Workout Location
  const env = (profile.training_environment || profile.preferred_workout_environment || 'gym').toLowerCase();
  const location: 'Gym' | 'Home' = env === 'gym' ? 'Gym' : 'Home';

  // 4. Equipment
  let equipment: 'Full Gym Equipment' | 'Basic Home Equipment' | 'No Equipment' = 'Basic Home Equipment';
  if (location === 'Gym') {
    equipment = 'Full Gym Equipment';
  } else {
    const equip = (profile.home_equipment_level || 'some').toLowerCase();
    if (equip === 'full') {
      equipment = 'Full Gym Equipment';
    } else if (equip === 'some') {
      equipment = 'Basic Home Equipment';
    } else if (equip === 'none') {
      equipment = 'No Equipment';
    }
  }

  // 5. Primary Goal
  let primaryGoal: 'Build Muscle' | 'Lose Fat' | 'Stay Fit' | 'Increase Strength' | 'Improve Endurance' = 'Stay Fit';
  if (profile.fitness_goal) {
    const goal = profile.fitness_goal.toLowerCase();
    if (goal.includes('strength') || goal.includes('power')) {
      primaryGoal = 'Increase Strength';
    } else if (goal.includes('gain') || goal.includes('muscle')) {
      // If advanced and goal is gain, classify as Increase Strength, otherwise Build Muscle
      if (experience === 'Advanced') {
        primaryGoal = 'Increase Strength';
      } else {
        primaryGoal = 'Build Muscle';
      }
    } else if (goal.includes('lose') || goal.includes('fat') || goal.includes('cut')) {
      primaryGoal = 'Lose Fat';
    } else if (goal.includes('maintain') || goal.includes('hold')) {
      primaryGoal = 'Stay Fit';
    } else if (goal.includes('recomp')) {
      primaryGoal = 'Stay Fit';
    } else if (goal.includes('endurance') || goal.includes('stamina') || goal.includes('cardio') || goal.includes('improve')) {
      primaryGoal = 'Improve Endurance';
    }
  }

  return {
    classified_age_group: ageGroup,
    classified_experience: experience,
    classified_location: location,
    classified_equipment: equipment,
    classified_goal: primaryGoal,
  };
}

