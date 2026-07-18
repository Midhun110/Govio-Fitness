import { UserProfile, Exercise, isExerciseMatch } from './calculations';
import { getUserClass, getExercisesForClass } from './exerciseLibrary';

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
  const focus = pattern[workoutIndex % pattern.length];
  
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

export function getExercisesForFocus(
  focus: string,
  exercisesList: Exercise[],
  profile: UserProfile,
  dayNumber: number
): Exercise[] {
  const focusMuscleGroups = getMuscleGroupsForFocus(focus); // e.g. ['Chest', 'Shoulders', 'Triceps']
  const focusMusclesLower = focusMuscleGroups.map(m => m.toLowerCase());

  // ── 1. Build the user's personalized library pool for this focus ──────────
  const userClass = getUserClass(profile);
  const classPool = getExercisesForClass(userClass, exercisesList, profile);

  const matchesFocus = (ex: Exercise) => {
    const muscle = ex.muscle_group.toLowerCase();
    return (
      focusMusclesLower.includes(muscle) ||
      (focusMusclesLower.includes('abs') && muscle === 'core')
    );
  };


  let pool = classPool.filter(matchesFocus);

  // Fallback: if the personalized pool is too sparse, widen to all exercises
  if (pool.length < 2) {
    pool = exercisesList.filter(matchesFocus);
  }

  if (pool.length === 0) return [];

  // ── 2. Stable sort so selection is deterministic ──────────────────────────
  const sortedPool = [...pool].sort((a, b) => a.id.localeCompare(b.id));

  // ── 3. Build a deterministic seed from user identity + day ────────────────
  const userIdSeed =
    (profile as any).id && typeof (profile as any).id === 'string'
      ? (profile as any).id
          .split('')
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : 123;
  const seed = dayNumber + userIdSeed;

  // ── 4. Determine target exercise count for this user's level ──────────────
  const targetCount = getTargetExerciseCount(profile, seed);

  // ── 5. Group pool by muscle group ─────────────────────────────────────────
  const byMuscle: { [muscle: string]: Exercise[] } = {};
  for (const ex of sortedPool) {
    const key = ex.muscle_group.toLowerCase();
    if (!byMuscle[key]) byMuscle[key] = [];
    byMuscle[key].push(ex);
  }

  // Resolve canonical focus muscle keys that actually exist in the pool
  const activeMuscles = focusMuscleGroups
    .map(m => m.toLowerCase())
    .filter(m => {
      // Also map 'legs' to glutes/calves, 'abs' to core
      if (byMuscle[m]) return true;
      if (m === 'legs' && (byMuscle['glutes'] || byMuscle['calves'])) return true;
      if (m === 'abs' && byMuscle['core']) return true;
      return false;
    });

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Helper: pick one exercise from a muscle's list using the seed, avoiding repeats
  const pickFromMuscle = (muscle: string, offset: number): Exercise | null => {
    // Gather all exercises for this muscle (incl. alias mappings)
    let candidates: Exercise[] = [];
    if (byMuscle[muscle]) candidates = [...byMuscle[muscle]];
    if (muscle === 'legs') {
      if (byMuscle['glutes']) candidates.push(...byMuscle['glutes']);
      if (byMuscle['calves']) candidates.push(...byMuscle['calves']);
    }
    if (muscle === 'abs' && byMuscle['core']) {
      candidates.push(...byMuscle['core']);
    }
    // Filter already-used
    const available = candidates.filter(e => !usedIds.has(e.id));
    if (available.length === 0) return null;
    const pick = available[Math.abs(seed + offset) % available.length];
    usedIds.add(pick.id);
    return pick;
  };

  // ── 6. Phase 1: One exercise per focus muscle group ───────────────────────
  activeMuscles.forEach((muscle, i) => {
    const ex = pickFromMuscle(muscle, i * 7);
    if (ex) selected.push(ex);
  });

  // ── 7. Phase 2: Fill up to targetCount with extra exercises ───────────────
  // Cycle through muscle groups again to distribute evenly
  let fillOffset = activeMuscles.length * 7 + 31;
  let muscleIdx = 0;
  while (selected.length < targetCount) {
    const muscle = activeMuscles[muscleIdx % activeMuscles.length];
    const ex = pickFromMuscle(muscle, fillOffset);
    if (ex) {
      selected.push(ex);
    }
    fillOffset += 13;
    muscleIdx++;

    // Safety: break if we've exhausted the entire pool
    if (fillOffset > seed + sortedPool.length * 20) break;
  }

  return selected;
}
