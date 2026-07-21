// Register Node extensions hooks for image and video assets before imports
if (typeof require !== 'undefined' && (require as any).extensions) {
  (require as any).extensions['.png'] = () => 1;
  (require as any).extensions['.jpg'] = () => 1;
  (require as any).extensions['.jpeg'] = () => 1;
  (require as any).extensions['.mp4'] = () => 1;
  (require as any).extensions['.mov'] = () => 1;
}

import { MOCK_EXERCISES } from '../data/exercisesData';
import { getIsolatedLibraryForUser, getExercisesForClass, getUserClass } from './exerciseLibrary';
import { getExercisesForFocus, isSpecialSeniorProfile } from './program';
import { UserProfile } from './calculations';

const testCases = [
  {
    name: "Regular Gym + Intermediate",
    profile: {
      training_environment: "gym",
      experience_level: "intermediate"
    } as UserProfile
  },
  {
    name: "Regular Home + No Equipment",
    profile: {
      training_environment: "home",
      home_equipment_level: "none",
      experience_level: "beginner",
      date_of_birth: "2000-01-01" // Age 26
    } as UserProfile
  },
  {
    name: "Senior Housewife (Above 40) + Home + No Equipment",
    profile: {
      training_environment: "home",
      home_equipment_level: "none",
      experience_level: "beginner",
      date_of_birth: "1980-01-01" // Age 46 (Above 40!)
    } as UserProfile
  }
];

console.log("=== EXERCISE LIBRARY SEPARATION & VERIFICATION TEST ===\n");

testCases.forEach(tc => {
  console.log(`Testing Case: ${tc.name}`);
  const userClass = getUserClass(tc.profile);
  console.log(`-> Resolved UserClass: ${userClass}`);
  console.log(`-> Is Special Senior Profile: ${isSpecialSeniorProfile(tc.profile)}`);
  
  // 1. Check isolated library
  const isolated = getIsolatedLibraryForUser(MOCK_EXERCISES, tc.profile);
  
  // Verify separation
  const isGym = tc.profile.training_environment === 'gym';
  const hasHomeEx = isolated.some(ex => ex.id.startsWith('ex-h-'));
  const hasGymEx = isolated.some(ex => !ex.id.startsWith('ex-h-'));
  
  if (isGym) {
    if (hasHomeEx) {
      console.log("  ❌ FAIL: Gym user isolated library contains home exercises!");
    } else {
      console.log("  ✅ PASS: Gym library does not contain home exercises.");
    }
  } else {
    if (hasGymEx) {
      console.log("  ❌ FAIL: Home user isolated library contains gym exercises!");
    } else {
      console.log("  ✅ PASS: Home library does not contain gym exercises.");
    }
  }
  
  // 2. Check filtered library by class
  const classLib = getExercisesForClass(userClass, MOCK_EXERCISES, tc.profile);
  console.log(`  -> Filtered exercises count: ${classLib.length}`);
  
  // 3. Test workout generation (Push or whatever)
  const pushSession = getExercisesForFocus('Push', MOCK_EXERCISES, tc.profile, 1);
  console.log(`  -> Generated Workout Exercises (${pushSession.length}):`);
  pushSession.forEach(ex => {
    console.log(`     - [${ex.muscle_group}] ${ex.name} (${(ex as any).recommendedSets}x${(ex as any).recommendedReps} - ${(ex as any).progressionNote})`);
  });
  console.log("\n-----------------------------------------------\n");
});
