import { UserProfile } from './calculations';

/**
 * Feature flags that control which sections render on the dashboard.
 * All flags default to `true` (full experience) for unclassified users.
 */
export interface DashboardFeatures {
  /** 100-Day program progress widget */
  showProgramCard: boolean;
  /** Volume (kg) column in the "This Week" stats card */
  showVolumeStats: boolean;
  /** 10-tile muscle-group grid */
  showMuscleGrid: boolean;
  /** "Recommended For You" horizontal scroll */
  showRecommended: boolean;
  /** Inline beginner tips info banner */
  showBeginnerBanner: boolean;
  /** Inline senior mobility/balance banner */
  showMobilityBanner: boolean;
  /** Bodyweight home-workout quick card */
  showBodyweightQuickCard: boolean;
  /** Ask Govio AI Coach entry card */
  showAiCoach: boolean;
  /** Weight tracker card on Trackers tab */
  showWeightTracker: boolean;
  /** Calories card on Trackers tab */
  showCalorieCard: boolean;
  /** Water intake card on Trackers tab */
  showWaterCard: boolean;
  /** Weekly activity bar chart */
  showWeeklyChart: boolean;
}

/** Full-experience defaults — used when no classification is available yet. */
const FULL_EXPERIENCE: DashboardFeatures = {
  showProgramCard: true,
  showVolumeStats: true,
  showMuscleGrid: true,
  showRecommended: true,
  showBeginnerBanner: false,
  showMobilityBanner: false,
  showBodyweightQuickCard: false,
  showAiCoach: true,
  showWeightTracker: true,
  showCalorieCard: true,
  showWaterCard: true,
  showWeeklyChart: true,
};

/**
 * Compute which dashboard features should be visible for this user profile.
 * Returns the full experience when the profile has no classification data yet.
 */
export function getDashboardFeatures(profile?: UserProfile | null): DashboardFeatures {
  // No classification saved yet — show everything.
  if (!profile?.classified_location) {
    return { ...FULL_EXPERIENCE };
  }

  const loc   = profile.classified_location;
  const exp   = profile.classified_experience;
  const age   = profile.classified_age_group;
  const equip = profile.classified_equipment;

  const isHome       = loc   === 'Home';
  const isGym        = loc   === 'Gym';
  const isBeginner   = exp   === 'Beginner';
  const isSenior     = age   === 'Senior';
  const isNoEquip    = equip === 'No Equipment';
  const isBasicEquip = equip === 'Basic Home Equipment';

  return {
    // Program card only makes sense for gym users or non-beginner home users.
    showProgramCard: isGym || (isHome && !isBeginner),

    // Volume tracking is gym-centric; skip for no-equipment beginners at home.
    showVolumeStats: !(isHome && isBeginner && isNoEquip),

    // Muscle grid is educational — keep it for everyone.
    showMuscleGrid: true,

    // Recommended workouts already filter by equipment — keep for everyone.
    showRecommended: true,

    // Beginner banner: motivational tips for anyone at Beginner level.
    showBeginnerBanner: isBeginner,

    // Mobility/balance banner: only for seniors.
    showMobilityBanner: isSenior,

    // Bodyweight quick card: helpful for home users without a full gym.
    showBodyweightQuickCard: isHome && (isNoEquip || isBasicEquip),

    // AI Coach is useful for everyone.
    showAiCoach: true,

    // All tracker cards are universal.
    showCalorieCard: true,
    showWaterCard: true,
    showWeightTracker: true,
    showWeeklyChart: true,
  };
}
