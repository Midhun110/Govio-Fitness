import { UserProfile, isExerciseMatch } from './calculations';
import { Exercise } from '../data/exercisesData';

export type UserClass = 
  | 'Gym Beginner'
  | 'Gym Intermediate'
  | 'Gym Advanced'
  | 'Home Beginner (No Equipment)'
  | 'Home Beginner (Some Equipment)'
  | 'Home Intermediate'
  | 'Home Advanced'
  | 'Senior (51+)';

export interface ExerciseMetadata {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  environments: ('Gym' | 'Home')[];
  equipment_types: ('None' | 'Dumbbells' | 'Bands' | 'Barbell' | 'Machines')[];
  age_groups: ('Teen' | 'Young Adult' | 'Adult' | 'Senior')[];
  suitable_goals: ('Build Muscle' | 'Lose Fat' | 'Stay Fit' | 'Increase Strength' | 'Improve Endurance')[];
}

export interface EnrichedExercise extends Exercise {
  metadata: ExerciseMetadata;
}

/**
 * Helper to identify user class based on their profile data
 */
export function getUserClass(profile?: UserProfile | null): UserClass {
  if (!profile) return 'Gym Intermediate'; // Default fallback
  
  // 1. Resolve Age Group
  let ageGroup = profile.classified_age_group;
  if (!ageGroup && profile.date_of_birth) {
    const dob = new Date(profile.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age >= 51) {
        ageGroup = 'Senior';
      }
    }
  }

  if (ageGroup === 'Senior') {
    return 'Senior (51+)';
  }
  
  // 2. Resolve Environment/Location
  let loc = 'Gym';
  const rawLoc = (profile.classified_location || profile.training_environment || profile.preferred_workout_environment || 'gym').toLowerCase();
  if (rawLoc.includes('home')) {
    loc = 'Home';
  } else if (rawLoc.includes('gym')) {
    loc = 'Gym';
  } else if (rawLoc.includes('calisthenics') || rawLoc.includes('outdoor')) {
    loc = 'Home';
  }

  // 3. Resolve Experience
  let exp = 'Intermediate';
  const rawExp = (profile.classified_experience || profile.experience_level || 'intermediate').toLowerCase();
  if (rawExp.includes('begin')) {
    exp = 'Beginner';
  } else if (rawExp.includes('adv')) {
    exp = 'Advanced';
  } else if (rawExp.includes('inter')) {
    exp = 'Intermediate';
  }

  // 4. Resolve Equipment
  let equip = 'Full Gym Equipment';
  if (loc === 'Home') {
    const rawEquip = (profile.classified_equipment || profile.home_equipment_level || 'some').toLowerCase();
    if (rawEquip.includes('none') || rawEquip === 'none') {
      equip = 'No Equipment';
    } else if (rawEquip.includes('some') || rawEquip === 'some' || rawEquip.includes('basic')) {
      equip = 'Basic Home Equipment';
    } else if (rawEquip.includes('full') || rawEquip === 'full' || rawEquip.includes('gym')) {
      equip = 'Full Gym Equipment';
    }
  }

  if (loc === 'Gym') {
    if (exp === 'Beginner') return 'Gym Beginner';
    if (exp === 'Advanced') return 'Gym Advanced';
    return 'Gym Intermediate';
  } else {
    // Home
    if (exp === 'Beginner') {
      if (equip === 'No Equipment') return 'Home Beginner (No Equipment)';
      return 'Home Beginner (Some Equipment)';
    }
    if (exp === 'Advanced') return 'Home Advanced';
    return 'Home Intermediate';
  }
}

/**
 * Reusable dynamic metadata generator for exercises.
 * Evaluates target requirements and yields matching properties.
 */
export function enrichExercise(ex: Exercise): EnrichedExercise {
  const isSeniorEx = ex.id.includes('senior');
  const eqReq = isSeniorEx ? 'bodyweight' : (ex.equipment_required ? ex.equipment_required.toLowerCase() : 'bodyweight');
  let eqType: 'None' | 'Dumbbells' | 'Bands' | 'Barbell' | 'Machines' = 'None';
  let envs: ('Gym' | 'Home')[] = ['Gym', 'Home'];

  if (eqReq === 'bodyweight') {
    eqType = 'None';
    envs = ['Gym', 'Home'];
  } else if (eqReq === 'dumbbell') {
    eqType = 'Dumbbells';
    envs = ['Gym', 'Home'];
  } else if (eqReq === 'resistance_band') {
    eqType = 'Bands';
    envs = ['Gym', 'Home'];
  } else if (eqReq === 'barbell') {
    eqType = 'Barbell';
    envs = ['Gym'];
  } else if (eqReq === 'gym_machine') {
    eqType = 'Machines';
    envs = ['Gym'];
  }

  // Determine difficulty
  let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
  const nameLower = ex.name.toLowerCase();

  if (
    // Core / Abs
    nameLower.includes('plank') ||
    nameLower.includes('crunch') ||
    nameLower.includes('sit-up') ||
    nameLower.includes('russian twist') ||
    nameLower.includes('mountain climber') ||
    nameLower.includes('leg raise') ||
    nameLower.includes('flutter kick') ||
    nameLower.includes('dead bug') ||
    nameLower.includes('toe touch') ||
    nameLower.includes('v-up') ||
    // Chest
    nameLower.includes('push-up') ||
    nameLower.includes('push up') ||
    nameLower.includes('chest dip') ||
    nameLower.includes('dumbbell chest fly') ||
    nameLower.includes('floor press') ||
    nameLower.includes('pullover') ||
    // Back
    nameLower.includes('superman') ||
    nameLower.includes('band pull') ||
    nameLower.includes('resistance band row') ||
    nameLower.includes('dumbbell row') ||
    nameLower.includes('single arm row') ||
    nameLower.includes('bird dog') ||
    nameLower.includes('inverted row') ||
    nameLower.includes('bodyweight row') ||
    nameLower.includes('band pull-apart') ||
    nameLower.includes('prone') ||
    nameLower.includes('reverse fly') ||
    nameLower.includes('reverse flye') ||
    // Shoulders
    nameLower.includes('lateral raise') ||
    nameLower.includes('front raise') ||
    nameLower.includes('pike push-up') ||
    nameLower.includes('dumbbell shoulder press') ||
    nameLower.includes('band lateral raise') ||
    nameLower.includes('shoulder tap') ||
    nameLower.includes('arnold') ||
    nameLower.includes('upright row') ||
    nameLower.includes('bent over raise') ||
    // Biceps
    nameLower.includes('bicep curl') ||
    nameLower.includes('hammer curl') ||
    nameLower.includes('resistance band curl') ||
    nameLower.includes('chin-up') ||
    nameLower.includes('concentration curl') ||
    nameLower.includes('reverse curl') ||
    nameLower.includes('band curl') ||
    // Triceps
    nameLower.includes('bench dip') ||
    nameLower.includes('tricep dip') ||
    nameLower.includes('chair dip') ||
    nameLower.includes('diamond push-up') ||
    nameLower.includes('tricep kickback') ||
    nameLower.includes('overhead tricep') ||
    nameLower.includes('close grip push') ||
    // Legs
    nameLower.includes('bodyweight squat') ||
    nameLower.includes('sumo squat') ||
    nameLower.includes('goblet squat') ||
    nameLower.includes('lunge') ||
    nameLower.includes('split squat') ||
    nameLower.includes('step-up') ||
    nameLower.includes('wall sit') ||
    nameLower.includes('squat pulse') ||
    nameLower.includes('fire hydrant') ||
    // Forearms
    nameLower.includes('wrist curl') ||
    nameLower.includes('dead hang') ||
    nameLower.includes('farmer') ||
    nameLower.includes('grip')
  ) {
    difficulty = 'Beginner';
  } else if (
    nameLower.includes('deadlift') ||
    nameLower.includes('clean') ||
    nameLower.includes('snatch') ||
    nameLower.includes('muscle up') ||
    nameLower.includes('handstand')
  ) {
    difficulty = 'Advanced';
  }

  if (isSeniorEx) {
    difficulty = 'Beginner';
  }

  // Determine age groups
  let ageGroups: ('Teen' | 'Young Adult' | 'Adult' | 'Senior')[] = ['Teen', 'Young Adult', 'Adult', 'Senior'];
  if (difficulty === 'Advanced') {
    ageGroups = ['Young Adult', 'Adult'];
  } else if (
    nameLower.includes('jump') || 
    nameLower.includes('burpee') || 
    nameLower.includes('plyo')
  ) {
    ageGroups = ['Teen', 'Young Adult', 'Adult'];
  }

  if (isSeniorEx) {
    ageGroups = ['Teen', 'Young Adult', 'Adult', 'Senior'];
  }

  // Determine suitable goals
  let suitableGoals: ('Build Muscle' | 'Lose Fat' | 'Stay Fit' | 'Increase Strength' | 'Improve Endurance')[] = ['Stay Fit'];
  
  if (eqType === 'Barbell' || eqType === 'Machines' || eqType === 'Dumbbells') {
    suitableGoals = ['Build Muscle', 'Increase Strength', 'Stay Fit'];
  } else if (eqType === 'None' || eqType === 'Bands') {
    suitableGoals = ['Lose Fat', 'Stay Fit', 'Improve Endurance'];
  }

  // Explicit overrides for exact matches
  if (nameLower === 'bench press') {
    difficulty = 'Intermediate';
    envs = ['Gym'];
    eqType = 'Barbell';
    ageGroups = ['Young Adult', 'Adult'];
    suitableGoals = ['Build Muscle', 'Increase Strength'];
  } else if (nameLower === 'barbell squat') {
    difficulty = 'Intermediate';
    envs = ['Gym'];
    eqType = 'Barbell';
    ageGroups = ['Young Adult', 'Adult'];
    suitableGoals = ['Build Muscle', 'Increase Strength'];
  } else if (nameLower === 'deadlift') {
    difficulty = 'Advanced';
    envs = ['Gym'];
    eqType = 'Barbell';
    ageGroups = ['Young Adult', 'Adult'];
    suitableGoals = ['Increase Strength', 'Build Muscle'];
  } else if (nameLower === 'plank') {
    difficulty = 'Beginner';
    envs = ['Gym', 'Home'];
    eqType = 'None';
    ageGroups = ['Teen', 'Young Adult', 'Adult', 'Senior'];
    suitableGoals = ['Stay Fit', 'Lose Fat'];
  } else if (nameLower === 'push-up') {
    difficulty = 'Beginner';
    envs = ['Gym', 'Home'];
    eqType = 'None';
    ageGroups = ['Teen', 'Young Adult', 'Adult', 'Senior'];
    suitableGoals = ['Build Muscle', 'Stay Fit'];
  }

  return {
    ...ex,
    metadata: {
      difficulty,
      environments: envs,
      equipment_types: [eqType],
      age_groups: ageGroups,
      suitable_goals: suitableGoals,
    }
  };
}

/**
 * Isolates the master exercises pool based strictly on the user's environment selection.
 * - Gym users ONLY see original Gym exercises (no ex-h- exercises).
 * - Home users ONLY see Home-friendly exercises (ex-h- exercises plus custom exercises).
 */
export function getIsolatedLibraryForUser(
  exercises: Exercise[],
  profile?: UserProfile | null
): Exercise[] {
  if (!profile) return exercises.filter(ex => !ex.id.startsWith('ex-h-')); // Default to gym (no ex-h-)
  
  // Resolve environment/location (same logic as getUserClass)
  let loc = 'Gym';
  const rawLoc = (profile.classified_location || profile.training_environment || profile.preferred_workout_environment || 'gym').toLowerCase();
  if (rawLoc.includes('home')) {
    loc = 'Home';
  } else if (rawLoc.includes('gym')) {
    loc = 'Gym';
  } else if (rawLoc.includes('calisthenics') || rawLoc.includes('outdoor')) {
    loc = 'Home';
  }

  return exercises.filter((ex) => {
    // Custom exercises created by the user should always be kept
    if (ex.is_custom) return true;

    if (loc === 'Gym') {
      // Exclude home-specific exercises
      return !ex.id.startsWith('ex-h-');
    } else {
      // Home user: ONLY allow ex-h- exercises
      return ex.id.startsWith('ex-h-');
    }
  });
}

/**
 * Filter exercises dynamically according to assigned UserClass base rules
 */
export function getExercisesForClass(
  userClass: UserClass,
  exercises: Exercise[],
  profile?: UserProfile | null
): Exercise[] {
  // First isolate the library strictly by environment to prevent any mixing
  const isolated = getIsolatedLibraryForUser(exercises, profile);
  const enriched = isolated.map(enrichExercise);
  
  return enriched.filter((ex) => {
    const meta = ex.metadata;
    
    // Senior (51+) Special library filter
    if (userClass === 'Senior (51+)') {
      if (!meta.age_groups.includes('Senior')) return false;
      const env = profile?.training_environment || 'home';
      const level = profile?.home_equipment_level || 'none';
      if (env === 'home') {
        if (!meta.environments.includes('Home')) return false;
        if (level === 'none') {
          return meta.equipment_types.includes('None');
        }
        if (level === 'some') {
          return meta.equipment_types.includes('None') || meta.equipment_types.includes('Dumbbells') || meta.equipment_types.includes('Bands');
        }
      }
      return true;
    }

    // Gym Libraries
    if (userClass.startsWith('Gym')) {
      if (!meta.environments.includes('Gym')) return false;
      if (userClass === 'Gym Beginner') {
        return meta.difficulty === 'Beginner';
      }
      if (userClass === 'Gym Intermediate') {
        return meta.difficulty === 'Beginner' || meta.difficulty === 'Intermediate';
      }
      if (userClass === 'Gym Advanced') {
        return true;
      }
    }

    // Home Libraries
    if (userClass.startsWith('Home')) {
      if (!meta.environments.includes('Home')) return false;
      
      let equip = 'No Equipment';
      const rawEquip = (profile?.classified_equipment || profile?.home_equipment_level || 'none').toLowerCase();
      if (rawEquip.includes('none') || rawEquip === 'none') {
        equip = 'No Equipment';
      } else if (rawEquip.includes('some') || rawEquip === 'some' || rawEquip.includes('basic')) {
        equip = 'Basic Home Equipment';
      } else if (rawEquip.includes('full') || rawEquip === 'full' || rawEquip.includes('gym')) {
        equip = 'Full Gym Equipment';
      }

      if (userClass === 'Home Beginner (No Equipment)') {
        return meta.difficulty === 'Beginner' && meta.equipment_types.includes('None');
      }
      if (userClass === 'Home Beginner (Some Equipment)') {
        return meta.difficulty === 'Beginner' && (meta.equipment_types.includes('None') || meta.equipment_types.includes('Dumbbells') || meta.equipment_types.includes('Bands'));
      }
      if (userClass === 'Home Intermediate') {
        const matchesLevel = meta.difficulty === 'Beginner' || meta.difficulty === 'Intermediate';
        if (equip === 'No Equipment') {
          return matchesLevel && meta.equipment_types.includes('None');
        }
        return matchesLevel && (meta.equipment_types.includes('None') || meta.equipment_types.includes('Dumbbells') || meta.equipment_types.includes('Bands'));
      }
      if (userClass === 'Home Advanced') {
        if (equip === 'No Equipment') {
          return meta.equipment_types.includes('None');
        }
        return meta.equipment_types.includes('None') || meta.equipment_types.includes('Dumbbells') || meta.equipment_types.includes('Bands');
      }
    }

    return true;
  });
}
