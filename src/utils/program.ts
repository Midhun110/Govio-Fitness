import { UserProfile, Exercise, isExerciseMatch } from './calculations';
import { getUserClass, getExercisesForClass } from './exerciseLibrary';
import { supabase } from '../lib/supabase';

function getAgeForProfile(profile: UserProfile): number {
  if (!profile.date_of_birth) return 25;
  const dob = new Date(profile.date_of_birth);
  if (isNaN(dob.getTime())) return 25;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function isSpecialSeniorProfile(profile: UserProfile): boolean {
  const age = getAgeForProfile(profile);
  const env = (profile.training_environment || '').toLowerCase();
  const exp = (profile.experience_level || '').toLowerCase();
  const equip = (profile.home_equipment_level || '').toLowerCase();
  
  return (
    age >= 40 &&
    env === 'home' &&
    exp.includes('begin') &&
    (equip === 'none' || equip.includes('none'))
  );
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKDAY_MAP: { [key: number]: string } = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat'
};

export function getDayOfWeekString(date: Date): string {
  return WEEKDAY_MAP[date.getDay()];
}

export function getCalendarDateForDay(dayNumber: number, startDateStr: string): string {
  const start = new Date(startDateStr);
  start.setDate(start.getDate() + (dayNumber - 1));
  return start.toISOString().split('T')[0];
}

export function getSplitPattern(frequency: number, experienceLevel: string): string[] {
  const level = (experienceLevel || 'intermediate').toLowerCase();
  
  if (frequency === 3) {
    return ['Full Body'];
  }
  if (frequency === 4) {
    if (level === 'advanced') {
      return ['Push', 'Pull', 'Legs', 'Full Body'];
    }
    return ['Upper', 'Lower']; // Beginner/Intermediate repeat Upper/Lower
  }
  if (frequency === 5) {
    if (level === 'beginner') {
      return ['Upper', 'Lower', 'Arms', 'Core', 'Full Body'];
    }
    if (level === 'advanced') {
      return ['Push', 'Pull', 'Legs', 'Arms', 'Core'];
    }
    return ['Push', 'Pull', 'Legs', 'Upper', 'Lower']; // Intermediate
  }
  if (frequency === 6) {
    return ['Push', 'Pull', 'Legs'];
  }
  return ['Full Body'];
}

// Generate the details of a day in the program, considering possible mid-program frequency changes
export function getProgramDayDetails(
  dayNumber: number,
  profile: UserProfile
): {
  dayNumber: number;
  dateStr: string;
  weekday: string;
  isRest: boolean;
  focus?: string;
} {
  const startDateStr = profile.program_start_date || new Date().toISOString().split('T')[0];
  const dateStr = getCalendarDateForDay(dayNumber, startDateStr);
  const dateObj = new Date(dateStr);
  const weekday = getDayOfWeekString(dateObj);
  
  const currentDay = profile.program_day || 1;
  const trainingDays = profile.training_days || ['Mon', 'Wed', 'Fri'];
  const frequency = profile.training_days_per_week || 3;
  const experienceLevel = profile.experience_level || 'intermediate';
  const completedCount = profile.program_workouts_completed || 0;
  
  const isRest = !trainingDays.includes(weekday);
  
  if (isRest) {
    return { dayNumber, dateStr, weekday, isRest };
  }
  
  // For workout days:
  let workoutIndex = completedCount;
  if (dayNumber > currentDay) {
    let workoutDaysCount = 0;
    const currentDayIsWorkout = trainingDays.includes(getDayOfWeekString(new Date(getCalendarDateForDay(currentDay, startDateStr))));
    const startCountFrom = currentDayIsWorkout ? currentDay + 1 : currentDay;
    
    for (let d = startCountFrom; d < dayNumber; d++) {
      const dDateStr = getCalendarDateForDay(d, startDateStr);
      const dWeekday = getDayOfWeekString(new Date(dDateStr));
      if (trainingDays.includes(dWeekday)) {
        workoutDaysCount++;
      }
    }
    
    workoutIndex = completedCount + (currentDayIsWorkout ? 1 : 0) + workoutDaysCount;
  } else if (dayNumber < currentDay) {
    let workoutDaysCount = 0;
    for (let d = dayNumber; d < currentDay; d++) {
      const dDateStr = getCalendarDateForDay(d, startDateStr);
      const dWeekday = getDayOfWeekString(new Date(dDateStr));
      if (trainingDays.includes(dWeekday)) {
        workoutDaysCount++;
      }
    }
    workoutIndex = Math.max(0, completedCount - workoutDaysCount);
  }
  
  const pattern = getSplitPattern(frequency, experienceLevel);
  let focus = pattern[workoutIndex % pattern.length];
  if (isSpecialSeniorProfile(profile)) {
    focus = 'Full Body';
  }
  
  return { dayNumber, dateStr, weekday, isRest, focus };
}

// Auto-advances program day past rest days if calendar time has moved forward
export function autoAdvanceProgramDay(profile: UserProfile): number {
  const currentDay = profile.program_day || 0;
  if (currentDay === 0 || currentDay > 100) return currentDay;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const startDateStr = profile.program_start_date;
  if (!startDateStr) return currentDay;
  
  let tempDay = currentDay;
  while (tempDay <= 100) {
    const details = getProgramDayDetails(tempDay, { ...profile, program_day: tempDay });
    if (details.isRest) {
      if (todayStr > details.dateStr) {
        tempDay++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return tempDay;
}

// Map muscle focus to actual exercise muscle groups
export function getMuscleGroupsForFocus(focus: string): string[] {
  const f = focus.toLowerCase();
  if (f === 'push') return ['Chest', 'Shoulders', 'Triceps'];
  if (f === 'pull') return ['Back', 'Biceps', 'Forearms'];
  if (f === 'legs') return ['Legs', 'Abs'];
  if (f === 'upper') return ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'];
  if (f === 'lower') return ['Legs', 'Abs'];
  if (f === 'arms') return ['Biceps', 'Triceps', 'Forearms'];
  if (f === 'core') return ['Abs'];
  return ['Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Abs'];
}

/**
 * Returns the target exercise count range for a given experience level.
 * - Beginner:     3–5 exercises
 * - Intermediate: 4–6 exercises
 * - Advanced:     5–8 exercises
 */
export function getTargetExerciseCount(profile: UserProfile, seed: number): number {
  const exp = (profile.classified_experience || profile.experience_level || 'intermediate').toLowerCase();
  let min: number;
  let max: number;

  if (exp.includes('begin')) {
    min = 3; max = 5;
  } else if (exp.includes('adv')) {
    min = 5; max = 8;
  } else {
    min = 4; max = 6;
  }

  // Use the seed to deterministically pick a count within [min, max]
  return min + (seed % (max - min + 1));
}

// Pre-defined progression difficulty order for each muscle group (easiest to hardest)
const PROGRESSION_ORDER: { [key: string]: string[] } = {
  chest: [
    "ex-h-chest-4", // Incline Push-Up
    "ex-h-chest-2", // Dumbbell Floor Press
    "ex-h-chest-1", // Push-Up
    "ex-h-chest-3", // Dumbbell Chest Fly
    "ex-h-chest-6", // Wide Push-Up
    "ex-h-chest-7", // Dumbbell Pullover
    "ex-h-chest-5"  // Decline Push-Up
  ],
  back: [
    "ex-h-back-5", // Bird Dog
    "ex-h-back-2", // Superman
    "ex-h-back-7", // Resistance Band Pull-Apart
    "ex-h-back-4", // Resistance Band Row
    "ex-h-back-1", // Dumbbell Row
    "ex-h-back-3", // Single Arm Dumbbell Row
    "ex-h-back-6"  // Inverted Bodyweight Row
  ],
  shoulders: [
    "ex-h-shoulder-5", // Dumbbell Front Raise
    "ex-h-shoulder-2", // Lateral Raise
    "ex-h-shoulder-6", // Shoulder Tap
    "ex-h-shoulder-4", // Dumbbell Shoulder Press
    "ex-h-shoulder-1", // Arnold Press
    "ex-h-shoulder-7", // Bent-Over Dumbbell Reverse Fly
    "ex-h-shoulder-3"  // Pike Push-Up
  ],
  biceps: [
    "ex-h-bicep-6", // Resistance Band Bicep Curl
    "ex-h-bicep-7", // Resistance Band Hammer Curl
    "ex-h-bicep-4", // Dumbbell Bicep Curl
    "ex-h-bicep-1", // Dumbbell Hammer Curl
    "ex-h-bicep-2", // Concentration Curl
    "ex-h-bicep-5", // Dumbbell Reverse Curl
    "ex-h-bicep-3"  // Chin-Up
  ],
  triceps: [
    "ex-h-tricep-7", // Tricep Dip on Chair
    "ex-h-tricep-1", // Bench Dip
    "ex-h-tricep-3", // Tricep Kickback
    "ex-h-tricep-2", // Overhead Tricep Extension
    "ex-h-tricep-6", // Dumbbell Skull Crusher
    "ex-h-tricep-5", // Close-Grip Push-Up
    "ex-h-tricep-4"  // Diamond Push-Up
  ],
  legs: [
    "ex-h-leg-5", // Wall Sit
    "ex-h-leg-2", // Bodyweight Squat
    "ex-h-leg-3", // Sumo Squat
    "ex-h-leg-4", // Step-Up
    "ex-h-leg-1", // Walking Lunge
    "ex-h-leg-6", // Dumbbell Goblet Squat
    "ex-h-leg-7"  // Bodyweight Split Squat
  ],
  abs: [
    "ex-h-abs-1", // Plank
    "ex-h-abs-5", // Crunch
    "ex-h-abs-3", // Russian Twist
    "ex-h-abs-6", // Mountain Climber
    "ex-h-abs-4", // Bicycle Crunch
    "ex-h-abs-7", // Lying Leg Raise
    "ex-h-abs-2"  // Hanging Leg Raise
  ],
  forearms: [
    "ex-h-forearm-2", // Dead Hang
    "ex-h-forearm-3", // Dumbbell Wrist Curl
    "ex-h-forearm-4", // Dumbbell Reverse Wrist Curl
    "ex-h-forearm-7", // Behind-the-Back Wrist Curl
    "ex-h-forearm-5", // Towel Dead Hang
    "ex-h-forearm-1", // Farmer's Carry
    "ex-h-forearm-6"  // Dumbbell Farmer's Walk
  ]
};

export function selectExercisesForMuscle(
  muscleGroup: string,
  pool: Exercise[],
  profile: UserProfile,
  dayOrWorkoutsCount: number,
  targetCountOverride?: number
): Exercise[] {
  const muscleLower = muscleGroup.toLowerCase();
  
  // Filter the pool to only exercises matching this muscle group
  let musclePool = pool.filter(ex => {
    const m = ex.muscle_group.toLowerCase();
    if (muscleLower === 'abs') {
      return m === 'abs' || m === 'core';
    }
    return m === muscleLower;
  });

  if (musclePool.length === 0) return [];

  // Sort according to PROGRESSION_ORDER if available, otherwise by id
  const order = PROGRESSION_ORDER[muscleLower];
  if (order) {
    musclePool.sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id.localeCompare(b.id);
    });
  } else {
    musclePool.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Calculate target exercise count based on level
  const exp = (profile.classified_experience || profile.experience_level || 'intermediate').toLowerCase();
  
  let numEx = 3;
  if (targetCountOverride !== undefined) {
    numEx = targetCountOverride;
  } else {
    if (exp.includes('begin')) {
      numEx = 2; // Beginner: 2-3 exercises
    } else if (exp.includes('adv')) {
      numEx = 4; // Advanced: 4-5 exercises
    } else {
      numEx = 3; // Intermediate: 3-4 exercises
    }
  }

  // Ensure numEx doesn't exceed pool size
  numEx = Math.min(numEx, musclePool.length);

  // Slide selection window based on week to rotate exercises over time
  const week = Math.floor((dayOrWorkoutsCount - 1) / 7) + 1;
  const offset = (week - 1) % musclePool.length;

  const selected: Exercise[] = [];
  for (let i = 0; i < numEx; i++) {
    const idx = (offset + i) % musclePool.length;
    selected.push(musclePool[idx]);
  }

  // Attach target sets, reps, and progression info to each selected exercise
  return selected.map(ex => {
    let sets = 3;
    let reps = 10;
    let progressionNote = '';

    // Calculate progression cycle within 4-week blocks
    const cycleWeek = ((week - 1) % 4) + 1;

    if (exp.includes('begin')) {
      if (cycleWeek === 1) {
        sets = 2; reps = 10;
        progressionNote = 'Week 1 Base';
      } else if (cycleWeek === 2) {
        sets = 2; reps = 12;
        progressionNote = 'Reps Progression (+2 reps)';
      } else if (cycleWeek === 3) {
        sets = 3; reps = 10;
        progressionNote = 'Volume Progression (+1 set)';
      } else {
        sets = 3; reps = 12;
        progressionNote = 'Max Intensity (+1 set, +2 reps)';
      }
    } else if (exp.includes('adv')) {
      if (cycleWeek === 1) {
        sets = 4; reps = 6;
        progressionNote = 'Week 1 Base (Strength)';
      } else if (cycleWeek === 2) {
        sets = 4; reps = 8;
        progressionNote = 'Reps Progression (+2 reps)';
      } else if (cycleWeek === 3) {
        sets = 5; reps = 6;
        progressionNote = 'Volume Progression (+1 set)';
      } else {
        sets = 5; reps = 8;
        progressionNote = 'Max Intensity (+1 set, +2 reps)';
      }
    } else {
      // Intermediate
      if (cycleWeek === 1) {
        sets = 3; reps = 8;
        progressionNote = 'Week 1 Base';
      } else if (cycleWeek === 2) {
        sets = 3; reps = 10;
        progressionNote = 'Reps Progression (+2 reps)';
      } else if (cycleWeek === 3) {
        sets = 4; reps = 8;
        progressionNote = 'Volume Progression (+1 set)';
      } else {
        sets = 4; reps = 10;
        progressionNote = 'Max Intensity (+1 set, +2 reps)';
      }
    }

    // Weight suggestion (if applicable, e.g. dumbbell or barbell)
    const eq = ex.equipment_required || 'bodyweight';
    if (eq === 'dumbbell' || eq === 'barbell') {
      const cycleNumber = Math.floor((week - 1) / 4);
      if (cycleNumber > 0) {
        const addedWeight = cycleNumber * 2.5;
        progressionNote += `, Try +${addedWeight}kg total overload`;
      }
    }

    return {
      ...ex,
      recommendedSets: sets,
      recommendedReps: reps,
      progressionNote
    } as any;
  });
}

export function getExercisesForFocus(
  focus: string,
  exercisesList: Exercise[],
  profile: UserProfile,
  dayNumber: number
): Exercise[] {
  if (isSpecialSeniorProfile(profile)) {
    const seniorExIds = [
      'ex-h-senior-1', // Jumping Jacks (Gentle Cardio)
      'ex-h-senior-2', // Wall Push-Up (Gentle Chest & Arms)
      'ex-h-senior-3', // Chair Squat (Gentle Leg Strength)
      'ex-h-senior-4', // Standing Arm Circles (Shoulder Mobility)
      'ex-h-senior-7', // Glute Bridge (Gentle Glute Strength)
      'ex-h-abs-1'     // Plank
    ];
    const seniorPool = exercisesList.filter(ex => seniorExIds.includes(ex.id));
    
    // Sort to logical sequence: Warmup -> Strength -> Core
    seniorPool.sort((a, b) => {
      const idxA = seniorExIds.indexOf(a.id);
      const idxB = seniorExIds.indexOf(b.id);
      return idxA - idxB;
    });

    // Calculate progression cycle within 4-week blocks
    const week = Math.floor((dayNumber - 1) / 7) + 1;
    const cycleWeek = ((week - 1) % 4) + 1;
    let sets = 2;
    let reps = 10;
    let progressionNote = '';

    if (cycleWeek === 1) {
      sets = 2; reps = 10;
      progressionNote = 'Week 1 Base';
    } else if (cycleWeek === 2) {
      sets = 2; reps = 12;
      progressionNote = 'Reps Progression (+2 reps)';
    } else if (cycleWeek === 3) {
      sets = 3; reps = 10;
      progressionNote = 'Volume Progression (+1 set)';
    } else {
      sets = 3; reps = 12;
      progressionNote = 'Max Intensity (+1 set, +2 reps)';
    }

    return seniorPool.map(ex => {
      let displayReps = reps;
      let displayNote = progressionNote;
      if (ex.id === 'ex-h-abs-1') {
        displayReps = cycleWeek <= 2 ? 15 : 20; 
        displayNote = `${progressionNote} (Hold for ${displayReps}s)`;
      }

      return {
        ...ex,
        recommendedSets: sets,
        recommendedReps: displayReps,
        progressionNote: displayNote
      } as any;
    });
  }

  const focusMuscleGroups = getMuscleGroupsForFocus(focus); // e.g. ['Chest', 'Shoulders', 'Triceps']
  const userClass = getUserClass(profile);
  const classPool = getExercisesForClass(userClass, exercisesList, profile);

  // Group candidates into muscle pools
  const selected: Exercise[] = [];
  const exp = (profile.classified_experience || profile.experience_level || 'intermediate').toLowerCase();
  
  // Decide target count per muscle group based on split complexity to keep session duration realistic
  let countPerMuscle = 3;
  if (focusMuscleGroups.length === 1) {
    countPerMuscle = exp.includes('begin') ? 2 : exp.includes('adv') ? 4 : 3;
  } else if (focusMuscleGroups.length <= 3) {
    countPerMuscle = exp.includes('begin') ? 2 : exp.includes('adv') ? 3 : 2;
  } else {
    countPerMuscle = exp.includes('begin') ? 1 : exp.includes('adv') ? 2 : 1;
  }

  focusMuscleGroups.forEach((mg) => {
    const selectedForMg = selectExercisesForMuscle(mg, classPool, profile, dayNumber, countPerMuscle);
    selected.push(...selectedForMg);
  });

  return selected;
}

export interface MuscleFreshness {
  muscleGroup: string;
  freshness: number; // 0 - 100
  lastTrainedAt: Date | null;
}

export const TARGET_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Abs',
  'Forearms'
];

/**
 * Returns recovery window in hours:
 * - Large muscle groups (Chest, Back, Legs): 48 hours
 * - Small muscle groups (Shoulders, Biceps, Triceps, Abs, Forearms): 24 hours
 */
export function getMuscleRecoveryWindowHours(muscleGroup: string): number {
  const m = muscleGroup.toLowerCase();
  if (m === 'chest' || m === 'back' || m === 'legs') {
    return 48;
  }
  return 24;
}

/**
 * Computes a linear ramp 0-100 freshness score based on hours since last trained.
 */
export function calculateFreshnessScore(
  lastTrainedAt: Date | null,
  recoveryWindowHours: number,
  now: Date = new Date()
): number {
  if (!lastTrainedAt || isNaN(lastTrainedAt.getTime())) {
    return 100; // Never trained = 100% fresh
  }

  const diffMs = now.getTime() - lastTrainedAt.getTime();
  const hoursSince = diffMs / (1000 * 60 * 60);

  if (hoursSince <= 0) {
    return 0;
  }

  if (hoursSince >= recoveryWindowHours) {
    return 100;
  }

  return Math.min(100, Math.max(0, Math.round((hoursSince / recoveryWindowHours) * 100)));
}

export function normalizeMuscleGroup(name?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (n === 'chest') return 'Chest';
  if (n === 'back') return 'Back';
  if (n === 'shoulders' || n === 'shoulder') return 'Shoulders';
  if (n === 'biceps' || n === 'bicep') return 'Biceps';
  if (n === 'triceps' || n === 'tricep') return 'Triceps';
  if (n === 'legs' || n === 'leg' || n === 'calves' || n === 'quadriceps' || n === 'hamstrings' || n === 'glutes') return 'Legs';
  if (n === 'abs' || n === 'core' || n === 'abdominals') return 'Abs';
  if (n === 'forearms' || n === 'forearm') return 'Forearms';
  return null;
}

/**
 * Computes 0-100 recovery/freshness score per muscle group for a given user.
 * Optional customNow and customWorkoutsList parameters allow deterministic testing & offline mock evaluations.
 */
export async function getMuscleFreshness(
  userId: string,
  customNow?: Date,
  customWorkoutsList?: any[]
): Promise<MuscleFreshness[]> {
  const now = customNow || new Date();
  const lastTrainedMap: { [key: string]: Date | null } = {};

  TARGET_MUSCLE_GROUPS.forEach((mg) => {
    lastTrainedMap[mg] = null;
  });

  let workoutsData: any[] = [];

  if (customWorkoutsList) {
    workoutsData = customWorkoutsList;
  } else if (userId === 'mock-user-id-12345') {
    try {
      const { MOCK_WORKOUTS } = require('../screens/HomeScreen');
      workoutsData = MOCK_WORKOUTS || [];
    } catch (e) {
      workoutsData = [];
    }
  } else {
    try {
      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          created_at,
          workouts!inner (
            date,
            created_at,
            user_id,
            status
          ),
          exercises (
            muscle_group
          )
        `)
        .eq('workouts.user_id', userId)
        .eq('workouts.status', 'completed');

      if (!error && data) {
        data.forEach((row: any) => {
          const rawMg = row.exercises?.muscle_group;
          const mg = normalizeMuscleGroup(rawMg);
          if (mg) {
            const rawDate = row.created_at || row.workouts?.created_at || row.workouts?.date;
            if (rawDate) {
              const dateObj = new Date(rawDate);
              if (!isNaN(dateObj.getTime())) {
                if (!lastTrainedMap[mg] || dateObj > lastTrainedMap[mg]!) {
                  lastTrainedMap[mg] = dateObj;
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching muscle freshness from Supabase:', err);
    }
  }

  if (workoutsData.length > 0) {
    workoutsData.forEach((w: any) => {
      const rawWDate = w.created_at || w.date;
      if (!rawWDate) return;
      const wDate = new Date(rawWDate);
      if (isNaN(wDate.getTime())) return;

      const sets = w.workout_sets || w.sets || [];
      sets.forEach((set: any) => {
        const rawMg = set.exercises?.muscle_group || set.muscle_group;
        const mg = normalizeMuscleGroup(rawMg);
        if (mg) {
          if (!lastTrainedMap[mg] || wDate > lastTrainedMap[mg]!) {
            lastTrainedMap[mg] = wDate;
          }
        }
      });
    });
  }

  return TARGET_MUSCLE_GROUPS.map((mg) => {
    const recoveryWindow = getMuscleRecoveryWindowHours(mg);
    const lastTrained = lastTrainedMap[mg];
    const freshness = calculateFreshnessScore(lastTrained, recoveryWindow, now);
    return {
      muscleGroup: mg,
      freshness,
      lastTrainedAt: lastTrained
    };
  });
}

