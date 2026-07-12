import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  Image,
  FlatList,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { calculateNutritionMetrics, NutritionMetrics, UserProfile } from '../utils/calculations';
import AnalyticsView from '../components/AnalyticsView';
import { MOCK_EXERCISES, getExerciseImageSource } from '../data/exercisesData';
import { getLocalCustomExercises } from '../utils/customExercises';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  scheduleWorkoutReminders,
  NotificationSettings
} from '../utils/notifications';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const calculateStreak = (workoutDates: string[]): number => {
  if (workoutDates.length === 0) return 0;

  // Unique sorted date strings (descending)
  const dates = Array.from(new Set(workoutDates))
    .map((d) => {
      const dateObj = new Date(d);
      dateObj.setHours(0, 0, 0, 0);
      return dateObj;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = dates[0];

  // If the last workout was before yesterday, streak is broken
  if (mostRecent < yesterday) {
    return 0;
  }

  let currentStreak = 1;
  let currentDate = mostRecent;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = dates[i];
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      break;
    }
  }

  return currentStreak;
};

const getMondayOfDate = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getSessionsCompletedThisWeek = (workoutDates: string[]): number => {
  const thisWeekMonday = getMondayOfDate(new Date()).getTime();
  const uniqueDates = Array.from(new Set(workoutDates.map(d => {
    const dateObj = new Date(d);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj.toDateString();
  })));
  return uniqueDates.filter((d) => {
    const workoutTime = new Date(d).getTime();
    return workoutTime >= thisWeekMonday;
  }).length;
};

const calculateVolumeForWorkouts = (workouts: any[]): number => {
  let volume = 0;
  workouts.forEach((w) => {
    const sets = w.workout_sets || w.sets || [];
    sets.forEach((s: any) => {
      const weight = parseFloat(s.weight_kg) || 0;
      const reps = parseInt(s.reps, 10) || 0;
      volume += weight * reps;
    });
  });
  return volume;
};

const calculateWeeklyStreak = (workoutDates: string[]): number => {
  if (workoutDates.length === 0) return 0;

  const uniqueMondays = Array.from(
    new Set(
      workoutDates.map((d) => {
        const monday = getMondayOfDate(new Date(d));
        return monday.getTime();
      })
    )
  ).sort((a, b) => b - a);

  const thisWeekMonday = getMondayOfDate(new Date()).getTime();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const lastWeekMonday = thisWeekMonday - oneWeekMs;

  const hasThisWeek = uniqueMondays.includes(thisWeekMonday);
  const hasLastWeek = uniqueMondays.includes(lastWeekMonday);

  if (!hasThisWeek && !hasLastWeek) {
    return 0;
  }

  let streak = 0;
  let expectedMonday = hasThisWeek ? thisWeekMonday : lastWeekMonday;

  while (uniqueMondays.includes(expectedMonday)) {
    streak++;
    expectedMonday -= oneWeekMs;
  }

  return streak;
};

const getSuggestedMuscleGroup = (workoutsList: any[]): { muscle: string; daysAgo: number | null } => {
  const ALL_MUSCLES = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Forearms', 'Glutes', 'Calves'
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastTrainedMap: { [key: string]: Date } = {};
  ALL_MUSCLES.forEach((m) => {
    lastTrainedMap[m] = new Date(0);
  });

  workoutsList.forEach((w) => {
    if (!w.date) return;
    const wDate = new Date(w.date);
    wDate.setHours(0, 0, 0, 0);
    const sets = w.workout_sets || w.sets || [];
    sets.forEach((set: any) => {
      let muscle = set.exercises?.muscle_group || set.muscle_group || '';
      if (muscle) {
        muscle = muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase();
        if (muscle === 'Core') muscle = 'Abs';
        if (ALL_MUSCLES.includes(muscle)) {
          if (wDate > lastTrainedMap[muscle]) {
            lastTrainedMap[muscle] = wDate;
          }
        }
      }
    });
  });

  let stalestMuscle = ALL_MUSCLES[0];
  let oldestDate = lastTrainedMap[stalestMuscle];

  ALL_MUSCLES.forEach((m) => {
    if (lastTrainedMap[m] < oldestDate) {
      oldestDate = lastTrainedMap[m];
      stalestMuscle = m;
    }
  });

  const oldestTime = oldestDate.getTime();
  if (oldestTime === 0) {
    return { muscle: stalestMuscle, daysAgo: null };
  } else {
    const diffMs = today.getTime() - oldestTime;
    const daysAgo = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return { muscle: stalestMuscle, daysAgo };
  }
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    {active && (
      <Defs>
        <LinearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4FF13" />
          <Stop offset="100%" stopColor="#00E676" />
        </LinearGradient>
      </Defs>
    )}
    <Path
      d="M3 10.182V20a2 2 0 002 2h14a2 2 0 002-2v-9.818M3 10.182L12 3l9 7.182"
      stroke={active ? "url(#homeGrad)" : "#7A7A7A"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22v-6a1 1 0 011-1h4a1 1 0 011 1v6"
      stroke={active ? "url(#homeGrad)" : "#7A7A7A"}
      strokeWidth={2}
      strokeLinecap="round"
      fill={active ? "rgba(212, 255, 19, 0.15)" : "none"}
    />
  </Svg>
);

const ExercisesIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    {active && (
      <Defs>
        <LinearGradient id="exGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4FF13" />
          <Stop offset="100%" stopColor="#00E676" />
        </LinearGradient>
      </Defs>
    )}
    {/* Left Plates */}
    <Rect
      x={2}
      y={5}
      width={3}
      height={14}
      rx={1.5}
      fill={active ? "url(#exGrad)" : "none"}
      stroke={active ? "none" : "#7A7A7A"}
      strokeWidth={active ? 0 : 2}
    />
    <Rect
      x={6}
      y={7}
      width={2}
      height={10}
      rx={1}
      fill={active ? "url(#exGrad)" : "none"}
      stroke={active ? "none" : "#7A7A7A"}
      strokeWidth={active ? 0 : 2}
      opacity={0.8}
    />
    {/* Shaft with knurling details */}
    <Path
      d="M8 12h8"
      stroke={active ? "url(#exGrad)" : "#7A7A7A"}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {active && (
      <>
        <Path d="M10 10v4M12 10v4M14 10v4" stroke="rgba(13, 20, 29, 0.5)" strokeWidth={1} />
      </>
    )}
    {/* Right Plates */}
    <Rect
      x={16}
      y={7}
      width={2}
      height={10}
      rx={1}
      fill={active ? "url(#exGrad)" : "none"}
      stroke={active ? "none" : "#7A7A7A"}
      strokeWidth={active ? 0 : 2}
      opacity={0.8}
    />
    <Rect
      x={19}
      y={5}
      width={3}
      height={14}
      rx={1.5}
      fill={active ? "url(#exGrad)" : "none"}
      stroke={active ? "none" : "#7A7A7A"}
      strokeWidth={active ? 0 : 2}
    />
  </Svg>
);

const AnalyticsIcon = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    {active && (
      <Defs>
        <LinearGradient id="anGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4FF13" />
          <Stop offset="100%" stopColor="#00E676" />
        </LinearGradient>
      </Defs>
    )}
    {/* Axis */}
    <Path
      d="M3 3v16a2 2 0 002 2h16"
      stroke={active ? "url(#anGrad)" : "#7A7A7A"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Transparent Background Columns */}
    <Rect
      x={6}
      y={12}
      width={3}
      height={6}
      rx={1}
      fill={active ? "rgba(212, 255, 19, 0.15)" : "none"}
    />
    <Rect
      x={11}
      y={8}
      width={3}
      height={10}
      rx={1}
      fill={active ? "rgba(212, 255, 19, 0.15)" : "none"}
    />
    <Rect
      x={16}
      y={5}
      width={3}
      height={13}
      rx={1}
      fill={active ? "rgba(212, 255, 19, 0.15)" : "none"}
    />
    {/* Trend Line Overlay */}
    <Path
      d="M6 14l5-4 5-3 3.5 3.5"
      stroke={active ? "url(#anGrad)" : "#7A7A7A"}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={19.5}
      cy={10.5}
      r={2}
      fill={active ? "#00E676" : "#7A7A7A"}
      stroke={active ? "#D4FF13" : "none"}
      strokeWidth={1}
    />
  </Svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    {active && (
      <Defs>
        <LinearGradient id="profGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4FF13" />
          <Stop offset="100%" stopColor="#00E676" />
        </LinearGradient>
      </Defs>
    )}
    <Circle
      cx={12}
      cy={8}
      r={4.5}
      stroke={active ? "url(#profGrad)" : "#7A7A7A"}
      strokeWidth={2}
      fill={active ? "rgba(212, 255, 19, 0.1)" : "none"}
    />
    <Path
      d="M4.5 21a7.5 7.5 0 0115 0"
      stroke={active ? "url(#profGrad)" : "#7A7A7A"}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

type HomeScreenProps = {
  route?: {
    params?: {
      session?: Session;
    };
  };
};

const MOCK_PROFILE: UserProfile = {
  sex: 'male',
  date_of_birth: '1995-05-15',
  height_cm: 175,
  weight_kg: 70,
  activity_level: 'moderate',
  fitness_goal: 'maintain',
  full_name: 'Midhun Nikhil',
  gender: 'male',
  experience_level: 'intermediate',
  journey_start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const MOCK_METRICS: NutritionMetrics = {
  bmi: 22.86,
  bmr: 1640.5,
  tdee: 2542.8,
  daily_calorie_goal: 2543,
  protein_g: 126,
  fat_g: 71,
  carbs_g: 350,
};

const POPULAR_WORKOUTS = [
  {
    id: 'popular-1',
    title: 'HIIT Cardio Burn',
    duration: '20 Min',
    difficulty: 'Intermediate',
    calories: '220 Kcal',
    description: 'A high-intensity interval training designed to burn fat rapidly, improve cardiovascular endurance, and kickstart your metabolism.',
    goal_tags: ['lose', 'maintain'],
    experience_level: 'intermediate',
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '60 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '12 reps' },
      { id: 'ex-7', name: 'Lunges', muscle_group: 'legs', sets: 3, reps: '12 reps' },
    ],
  },
  {
    id: 'popular-2',
    title: 'Upper Body Strength',
    duration: '45 Min',
    difficulty: 'Advanced',
    calories: '380 Kcal',
    description: 'Focus on building lean muscle mass and power across your chest, back, shoulders, and arms with this heavy compound routine.',
    goal_tags: ['gain', 'maintain'],
    experience_level: 'advanced',
    exercisesList: [
      { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest', sets: 4, reps: '8-10 reps' },
      { id: 'ex-5', name: 'Pull-up', muscle_group: 'back', sets: 4, reps: '8 reps' },
      { id: 'ex-6', name: 'Barbell Row', muscle_group: 'back', sets: 3, reps: '10 reps' },
      { id: 'ex-4', name: 'Overhead Press', muscle_group: 'shoulders', sets: 3, reps: '10 reps' },
    ],
  },
  {
    id: 'popular-3',
    title: 'Core Stability & Flow',
    duration: '30 Min',
    difficulty: 'Beginner',
    calories: '150 Kcal',
    description: 'Strengthen your core foundation, improve your posture, and enhance stability with this bodyweight-only routine.',
    goal_tags: ['lose', 'maintain', 'gain'],
    experience_level: 'beginner',
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '10 reps' },
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '15 reps' },
    ],
  },
  {
    id: 'popular-4',
    title: 'Fat Blast Circuit',
    duration: '25 Min',
    difficulty: 'Beginner',
    calories: '260 Kcal',
    description: 'A metabolic conditioning circuit designed to maximize calorie burn, fat loss, and endurance.',
    goal_tags: ['lose'],
    experience_level: 'beginner',
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
      { id: 'ex-7', name: 'Lunges', muscle_group: 'legs', sets: 3, reps: '12 reps' },
    ],
  },
  {
    id: 'popular-5',
    title: 'Hypertrophy Power Split',
    duration: '50 Min',
    difficulty: 'Advanced',
    calories: '410 Kcal',
    description: 'Heavy lifting focused on triggering maximum muscle hypertrophy for advanced lifters looking to gain muscle.',
    goal_tags: ['gain'],
    experience_level: 'advanced',
    exercisesList: [
      { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest', sets: 4, reps: '8-10 reps' },
      { id: 'ex-6', name: 'Barbell Row', muscle_group: 'back', sets: 3, reps: '10 reps' },
    ],
  },
  {
    id: 'popular-6',
    title: 'Full Body Conditioning',
    duration: '35 Min',
    difficulty: 'Intermediate',
    calories: '300 Kcal',
    description: 'A balanced full body conditioning routine using compound movements to maintain fitness level.',
    goal_tags: ['maintain', 'lose'],
    experience_level: 'intermediate',
    exercisesList: [
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '15 reps' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '10 reps' },
    ],
  },
];



// Global arrays for mock database in development bypass mode
export let MOCK_WORKOUTS: Array<{ id: string; date: string; notes: string; exercisesCount: number; sets: any[] }> = [];
export let MOCK_FOOD_LOGS: Array<{ id: string; user_id: string; food_id: string; quantity_grams: number; logged_at: string; meal_type: string; foods: any; photo_url?: string }> = [];

const MUSCLE_IMAGES: Record<string, any> = {
  Chest: require('../../assets/icons/muscles_real/chest.png'),
  Back: require('../../assets/icons/muscles_real/back.png'),
  Shoulders: require('../../assets/icons/muscles_real/shoulders.png'),
  Biceps: require('../../assets/icons/muscles_real/biceps.png'),
  Triceps: require('../../assets/icons/muscles_real/triceps.png'),
  Legs: require('../../assets/icons/muscles_real/legs.png'),
  Abs: require('../../assets/icons/muscles_real/abs.png'),
  Forearms: require('../../assets/icons/muscles_real/forearms.png'),
  Glutes: require('../../assets/icons/muscles_real/glutes.png'),
  Calves: require('../../assets/icons/muscles_real/calves.png'),
};

const MuscleIcon = ({ muscleKey, fallbackEmoji }: { muscleKey: string; fallbackEmoji: string }) => {
  const [hasError, setHasError] = useState(false);
  const imageSource = MUSCLE_IMAGES[muscleKey];

  if (hasError || !imageSource) {
    return <Text style={styles.muscleCardIcon}>{fallbackEmoji}</Text>;
  }

  return (
    <Image
      source={imageSource}
      style={styles.muscleCardImage}
      onError={() => setHasError(true)}
      resizeMode="contain"
    />
  );
};

export default function HomeScreen({ route }: HomeScreenProps) {
  const session = route?.params?.session;
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Active Bottom Tab: 'home' | 'exercises' | 'profile' | 'analytics'
  const [activeTab, setActiveTab] = useState<'home' | 'exercises' | 'profile' | 'analytics'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'workouts' | 'trackers'>('workouts');



  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<NutritionMetrics | null>(null);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatConsumed, setFatConsumed] = useState(0);
  const [waterLogged, setWaterLogged] = useState(0);
  const [weight, setWeight] = useState(0);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<{ index: number; value: string } | null>(null);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  
  // Today's workout state
  const [todayWorkout, setTodayWorkout] = useState<{ logged: boolean; exerciseCount: number } | null>(null);
  const [streak, setStreak] = useState(0);
  
  // Dashboard stats state
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisWeekVolume, setThisWeekVolume] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [suggestedMuscle, setSuggestedMuscle] = useState<{ muscle: string; daysAgo: number | null }>({ muscle: 'Chest', daysAgo: null });
  const [draftWorkout, setDraftWorkout] = useState<any>(null);
  const sessionProgressAnim = React.useRef(new Animated.Value(0)).current;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [showWeatherNudge, setShowWeatherNudge] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [activeFullScreenPhoto, setActiveFullScreenPhoto] = useState<string | null>(null);

  const getFoodPhotoUri = (log: any) => {
    if (!log.photo_url) return null;
    if (log.photo_url.startsWith('http') || log.photo_url.startsWith('file') || log.photo_url.startsWith('ph') || log.photo_url.startsWith('data:')) {
      return log.photo_url;
    }
    return signedUrls[log.photo_url] || null;
  };

  // Weekly activity chart tab
  const [weeklyMetricTab, setWeeklyMetricTab] = useState<'workouts' | 'calories' | 'water'>('workouts');

  // Smart suggestions states
  const [untrainedMuscles, setUntrainedMuscles] = useState<string[]>([]);
  const [focusInsight, setFocusInsight] = useState<{ frequent: string; target: string; note: string } | null>(null);
  const [dismissedUntrained, setDismissedUntrained] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);

  // Notification states
  const [allWorkoutDates, setAllWorkoutDates] = useState<string[]>([]);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    masterEnabled: false,
    streakRemindersEnabled: true,
    reengagementRemindersEnabled: true,
  });

  const syncReminders = async (workoutDates: string[]) => {
    try {
      await scheduleWorkoutReminders(workoutDates);
    } catch (err) {
      console.error('Failed to sync workout reminders:', err);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getNotificationSettings();
      setNotifSettings(settings);
    };
    loadSettings();
  }, []);

  const handleMasterToggle = async (val: boolean) => {
    let granted = true;
    if (val) {
      granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.'
        );
      }
    }
    
    const updated = {
      ...notifSettings,
      masterEnabled: val && granted,
    };
    
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
    await scheduleWorkoutReminders(allWorkoutDates);
  };

  const handleSettingToggle = async (key: keyof NotificationSettings, val: boolean) => {
    const updated = {
      ...notifSettings,
      [key]: val,
    };
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
    await scheduleWorkoutReminders(allWorkoutDates);
  };

  const getRecommendedWorkouts = () => {
    const userGoal = profile?.fitness_goal || 'maintain';
    const userLevel = profile?.experience_level || 'intermediate';

    return [...POPULAR_WORKOUTS].map(w => {
      const goalMatch = w.goal_tags.includes(userGoal as any);
      const levelMatch = w.experience_level.toLowerCase() === userLevel.toLowerCase();
      
      let score = 0;
      let matchReason = '';
      
      if (goalMatch && levelMatch) {
        score = 3;
        matchReason = 'Goal & Level Match';
      } else if (goalMatch) {
        score = 2;
        matchReason = 'Matches your goal';
      } else if (levelMatch) {
        score = 1;
        matchReason = 'Matches your level';
      }

      return {
        ...w,
        score,
        matchReason,
        isMatch: score > 0,
      };
    }).sort((a, b) => b.score - a.score);
  };

  const getRecommendationSubtext = () => {
    const goal = profile?.fitness_goal || 'maintain';
    const level = profile?.experience_level || 'intermediate';
    
    const goalLabel = getGoalLabel(goal);
    const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
    
    return `Based on your ${goalLabel} goal and ${levelLabel} level`;
  };

  const getWaterGoal = () => {
    const currentWeight = weight || profile?.weight_kg || 70;
    const fitnessGoal = profile?.fitness_goal || 'maintain';
    let baseGoal = currentWeight * 35;
    if (fitnessGoal === 'lose') {
      baseGoal += 350;
    } else if (fitnessGoal === 'gain') {
      baseGoal += 250;
    }
    return Math.round(baseGoal / 50) * 50;
  };

  // Weight Logging Modal State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editGoal, setEditGoal] = useState<'lose' | 'maintain' | 'gain' | 'recomposition' | 'endurance'>('maintain');
  const [editActivity, setEditActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [editExperience, setEditExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [profileSaving, setProfileSaving] = useState(false);

  // Exercises Tab State
  const [exercisesList, setExercisesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const processSuggestions = (workoutsList: any[]) => {
    if (!workoutsList || workoutsList.length === 0) {
      setUntrainedMuscles([]);
      setFocusInsight(null);
      return;
    }

    const ALL_MUSCLES = [
      'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Forearms', 'Glutes', 'Calves'
    ];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate untrained muscles (haven't trained in over 5 days)
    const lastTrainedMap: { [key: string]: Date | null } = {};
    ALL_MUSCLES.forEach((m) => {
      lastTrainedMap[m] = null;
    });

    workoutsList.forEach((w) => {
      const wDate = new Date(w.date);
      const sets = w.workout_sets || w.sets || [];
      sets.forEach((set: any) => {
        let muscle = set.exercises?.muscle_group || set.muscle_group || '';
        if (muscle) {
          muscle = muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase();
          if (muscle === 'Core') muscle = 'Abs';
          if (ALL_MUSCLES.includes(muscle)) {
            if (!lastTrainedMap[muscle] || wDate > lastTrainedMap[muscle]!) {
              lastTrainedMap[muscle] = wDate;
            }
          }
        }
      });
    });

    const untrained: string[] = [];
    Object.keys(lastTrainedMap).forEach((muscle) => {
      const lastDate = lastTrainedMap[muscle];
      if (lastDate) {
        const diffMs = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 5) {
          untrained.push(`${muscle} (${diffDays}d ago)`);
        }
      } else {
        // Never trained, suggest it as well
        untrained.push(muscle);
      }
    });
    setUntrainedMuscles(untrained);

    // 2. Calculate Muscle Focus Insight
    // Count frequency of each exercise name in the last 15 workouts
    const exerciseCounts: { [key: string]: { count: number; muscle: string } } = {};
    workoutsList.slice(-15).forEach((w) => {
      const sets = w.workout_sets || w.sets || [];
      const uniqueInWorkout = new Set<string>();
      sets.forEach((set: any) => {
        const name = set.exercises?.name || set.exercise_name;
        const muscle = set.exercises?.muscle_group || set.muscle_group;
        if (name && muscle) {
          uniqueInWorkout.add(`${name}::${muscle}`);
        }
      });

      uniqueInWorkout.forEach((key) => {
        const [name, muscle] = key.split('::');
        if (!exerciseCounts[name]) {
          exerciseCounts[name] = { count: 0, muscle };
        }
        exerciseCounts[name].count++;
      });
    });

    // Find if user has trained a specific exercise >= 3 times, but has NOT trained another exercise for the same muscle group
    let selectedInsight: { frequent: string; target: string; note: string } | null = null;
    
    // Sort exercise counts descending
    const sortedCounts = Object.keys(exerciseCounts)
      .map(name => ({ name, ...exerciseCounts[name] }))
      .sort((a, b) => b.count - a.count);

    const frequentEx = sortedCounts.find(e => e.count >= 3);
    if (frequentEx) {
      const targetMuscle = frequentEx.muscle;
      // Find other exercises for the same muscle group that the user has NEVER trained in the last 15 workouts
      const untriedVariations = MOCK_EXERCISES.filter((ex) => {
        return ex.muscle_group.toLowerCase() === targetMuscle.toLowerCase() && 
               ex.name.toLowerCase() !== frequentEx.name.toLowerCase() &&
               !exerciseCounts[ex.name] &&
               ex.muscleFocusNote;
      });

      if (untriedVariations.length > 0) {
        // Pick the first untried variation
        const variation = untriedVariations[0];
        selectedInsight = {
          frequent: frequentEx.name,
          target: variation.name,
          note: variation.muscleFocusNote || ''
        };
      }
    }
    setFocusInsight(selectedInsight);
  };

  const checkDraftWorkout = async () => {
    try {
      // 1. Local storage/SecureStore check for mock user or offline fallback
      const draftKey = 'govio_draft_workout';
      const draftStr = Platform.OS === 'web'
        ? window.localStorage.getItem(draftKey)
        : await SecureStore.getItemAsync(draftKey);
      
      // If we are in dev/mock mode or not logged in, use local draft
      if (!user || user.id === 'mock-user-id-12345') {
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft && draft.activeExercises && draft.activeExercises.length > 0) {
            const muscleGroups = Array.from(new Set(draft.activeExercises.map((ae: any) => ae.exercise?.muscle_group).filter(Boolean)));
            const muscleText = muscleGroups.join(', ') || 'General';
            const totalSets = draft.activeExercises.reduce((sum: number, ae: any) => sum + (ae.sets?.length || 0), 0);
            
            setDraftWorkout({
              id: 'local-draft',
              workoutName: draft.workoutName || 'Active Session',
              elapsedTime: draft.elapsedTime || 0,
              currentIdx: draft.currentIdx || 0,
              exercisesCount: draft.activeExercises.length,
              setsCount: totalSets,
              muscleGroup: muscleText,
              isLocal: true,
            });
            return;
          }
        }
        setDraftWorkout(null);
        return;
      }

      // 2. Real user: query Supabase workouts
      const { data: dbDraft, error: dbErr } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbErr) {
        console.warn('Failed to query DB draft:', dbErr);
        // Fail silently and fall back to local draft
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft && draft.activeExercises && draft.activeExercises.length > 0) {
            const muscleGroups = Array.from(new Set(draft.activeExercises.map((ae: any) => ae.exercise?.muscle_group).filter(Boolean)));
            const muscleText = muscleGroups.join(', ') || 'General';
            const totalSets = draft.activeExercises.reduce((sum: number, ae: any) => sum + (ae.sets?.length || 0), 0);
            setDraftWorkout({
              id: 'local-draft',
              workoutName: draft.workoutName || 'Active Session',
              elapsedTime: draft.elapsedTime || 0,
              currentIdx: draft.currentIdx || 0,
              exercisesCount: draft.activeExercises.length,
              setsCount: totalSets,
              muscleGroup: muscleText,
              isLocal: true,
            });
            return;
          }
        }
        setDraftWorkout(null);
        return;
      }

      if (dbDraft) {
        // Fetch sets for this workout
        const { data: setsData, error: setsErr } = await supabase
          .from('workout_sets')
          .select('*')
          .eq('workout_id', dbDraft.id);

        if (!setsErr && setsData) {
          // Fetch exercise info from exercises pool to get muscle groups
          const { data: exercisesData } = await supabase
            .from('exercises')
            .select('id, muscle_group');

          const customExercises = await getLocalCustomExercises();
          const allExPool = [...(exercisesData || []), ...customExercises];

          const exerciseIds = Array.from(new Set(setsData.map(s => s.exercise_id)));
          const muscleGroups = Array.from(new Set(
            exerciseIds.map(id => allExPool.find(e => e.id === id)?.muscle_group).filter(Boolean)
          ));
          const muscleText = muscleGroups.join(', ') || 'General';

          setDraftWorkout({
            id: dbDraft.id,
            workoutName: dbDraft.workout_name || 'Active Session',
            elapsedTime: dbDraft.elapsed_time || 0,
            currentIdx: dbDraft.current_idx || 0,
            exercisesCount: exerciseIds.length,
            setsCount: setsData.length,
            muscleGroup: muscleText,
            isLocal: false,
          });
          return;
        }
      }

      setDraftWorkout(null);
    } catch (e) {
      console.error('Error checking draft workout:', e);
      setDraftWorkout(null);
    }
  };

  const handleDiscardDraft = async () => {
    Alert.alert(
      'Discard Session',
      'Are you sure you want to discard this workout? It will be marked as abandoned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              if (draftWorkout && !draftWorkout.isLocal && user && user.id !== 'mock-user-id-12345') {
                await supabase
                  .from('workouts')
                  .update({ status: 'abandoned' })
                  .eq('id', draftWorkout.id);
              }
              
              // Clear local draft
              const draftKey = 'govio_draft_workout';
              if (Platform.OS === 'web') {
                window.localStorage.removeItem(draftKey);
              } else {
                await SecureStore.deleteItemAsync(draftKey);
              }
              
              setDraftWorkout(null);
              Alert.alert('Session Dismissed', 'Your session has been marked as abandoned.');
            } catch (e) {
              console.error('Error discarding draft workout:', e);
            }
          }
        }
      ]
    );
  };

  const handleStartWorkoutPress = () => {
    if (draftWorkout) {
      Alert.alert(
        'Active Session In Progress',
        'You already have an active workout session in progress. What would you like to do?',
        [
          {
            text: 'Resume Old',
            onPress: () => {
              navigation.navigate('ActiveWorkout', {
                session: session!,
                resumeDraft: true,
                workoutId: draftWorkout.id,
              });
            }
          },
          {
            text: 'Discard & Start Fresh',
            style: 'destructive',
            onPress: async () => {
              try {
                if (!draftWorkout.isLocal && user && user.id !== 'mock-user-id-12345') {
                  await supabase
                    .from('workouts')
                    .update({ status: 'abandoned' })
                    .eq('id', draftWorkout.id);
                }
                
                // Clear local draft
                const draftKey = 'govio_draft_workout';
                if (Platform.OS === 'web') {
                  window.localStorage.removeItem(draftKey);
                } else {
                  await SecureStore.deleteItemAsync(draftKey);
                }
                
                setDraftWorkout(null);
                navigation.navigate('StartWorkout', { session: session! });
              } catch (e) {
                console.error('Error discarding draft workout before starting fresh:', e);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.navigate('StartWorkout', { session: session! });
    }
  };

  const checkWeatherCache = async () => {
    try {
      const cacheStr = Platform.OS === 'web'
        ? window.localStorage.getItem('govio_weather_cache')
        : await SecureStore.getItemAsync('govio_weather_cache');
        
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        const ageInMs = Date.now() - cache.timestamp;
        if (ageInMs < 60 * 60 * 1000) {
          setWeatherTemp(cache.temp);
          if (cache.temp >= 28) {
            setShowWeatherNudge(true);
          } else {
            setShowWeatherNudge(false);
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to read weather cache:', e);
    }
    return false;
  };

  const fetchWeatherAndHydrationNudge = async () => {
    try {
      const Location = require('expo-location');
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Location permission denied, skipping weather nudge.');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      
      if (loc && loc.coords) {
        const { latitude, longitude } = loc.coords;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const res = await fetch(weatherUrl);
        const data = await res.json();
        
        if (data && data.current_weather) {
          const temp = data.current_weather.temperature;
          setWeatherTemp(temp);
          if (temp >= 28) {
            setShowWeatherNudge(true);
          } else {
            setShowWeatherNudge(false);
          }
          
          const cacheData = { temp, timestamp: Date.now() };
          if (Platform.OS === 'web') {
            window.localStorage.setItem('govio_weather_cache', JSON.stringify(cacheData));
          } else {
            await SecureStore.setItemAsync('govio_weather_cache', JSON.stringify(cacheData));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch weather:', e);
    }
  };

  const fetchDashboardData = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayIso = startOfDay.toISOString().split('T')[0];

    if (!user || user.id === 'mock-user-id-12345') {
      try {
        const localData = await SecureStore.getItemAsync('govio_workouts');
        if (localData) {
          const parsed = JSON.parse(localData);
          parsed.forEach((w: any) => {
            if (!MOCK_WORKOUTS.some((item) => item.id === w.id)) {
              MOCK_WORKOUTS.push(w);
            }
          });
          MOCK_WORKOUTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      } catch (e) {
        console.error('Error loading mock workouts:', e);
      }

      // Set mock data in development bypass mode
      setProfile(MOCK_PROFILE);
      const computedMockMetrics = calculateNutritionMetrics(MOCK_PROFILE);
      setMetrics(computedMockMetrics);
      setWeight(MOCK_PROFILE.weight_kg);
      setWaterLogged(500);
      const mockWeightLogs = [
        { id: '1', weight_kg: 71.5, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '2', weight_kg: 71.2, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '3', weight_kg: 70.8, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '4', weight_kg: 71.0, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', weight_kg: 70.5, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '6', weight_kg: 70.2, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '7', weight_kg: 70.0, created_at: new Date().toISOString() },
      ];
      setWeightLogs(mockWeightLogs);
      setEditHeight(MOCK_PROFILE.height_cm.toString());
      setEditWeight(MOCK_PROFILE.weight_kg.toString());
      setEditGoal(MOCK_PROFILE.fitness_goal);
      setEditActivity(MOCK_PROFILE.activity_level);
      setEditFullName(MOCK_PROFILE.full_name || 'Midhun Nikhil');
      setEditGender(MOCK_PROFILE.gender || 'male');
      setEditExperience(MOCK_PROFILE.experience_level || 'intermediate');

      // Check mock workouts list
      const todayMockWorkout = MOCK_WORKOUTS.find(w => w.date === startOfDayIso);
      if (todayMockWorkout) {
        setTodayWorkout({
          logged: true,
          exerciseCount: todayMockWorkout.exercisesCount
        });
      } else {
        setTodayWorkout({ logged: false, exerciseCount: 0 });
      }

      // Calculate streak and dashboard weekly metrics
      const mockDates = MOCK_WORKOUTS.map((w) => w.date).filter(Boolean);
      setStreak(calculateStreak(mockDates));
      processSuggestions(MOCK_WORKOUTS);

      const mockSessionsThisWeek = getSessionsCompletedThisWeek(mockDates);
      setThisWeekSessions(mockSessionsThisWeek);

      const monOffset = getMondayOfDate(new Date()).getTime();
      const mockThisWeekWorkouts = MOCK_WORKOUTS.filter((w) => {
        if (!w.date) return false;
        const wTime = new Date(w.date).getTime();
        return wTime >= monOffset;
      });
      const mockVolThisWeek = calculateVolumeForWorkouts(mockThisWeekWorkouts);
      setThisWeekVolume(mockVolThisWeek);

      const mockWkStreak = calculateWeeklyStreak(mockDates);
      setWeeklyStreak(mockWkStreak);

      const mockSugMuscle = getSuggestedMuscleGroup(MOCK_WORKOUTS);
      setSuggestedMuscle(mockSugMuscle);

      await checkDraftWorkout();

      // Check mock food logs list
      const todayMockLogs = MOCK_FOOD_LOGS.filter(l => new Date(l.logged_at) >= startOfDay);
      setFoodLogs(todayMockLogs);
      
      let calSum = 0;
      let pSum = 0;
      let cSum = 0;
      let fSum = 0;
      
      todayMockLogs.forEach((l) => {
        const factor = l.quantity_grams / 100;
        calSum += (l.foods?.calories_per_100g || 0) * factor;
        pSum += (l.foods?.protein_per_100g || 0) * factor;
        cSum += (l.foods?.carbs_per_100g || 0) * factor;
        fSum += (l.foods?.fat_per_100g || 0) * factor;
      });

      setCaloriesConsumed(Math.round(calSum));
      setProteinConsumed(Math.round(pSum));
      setCarbsConsumed(Math.round(cSum));
      setFatConsumed(Math.round(fSum));

      setAllWorkoutDates(mockDates);
      syncReminders(mockDates);

      setLoading(false);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      // 1. Fetch profile details
      const { data: profileData, error: profileErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileErr) throw profileErr;
      if (profileData) {
        if (!profileData.journey_start_date) {
          try {
            const { data: oldestWorkout } = await supabase
              .from('workouts')
              .select('date')
              .eq('user_id', user.id)
              .order('date', { ascending: true })
              .limit(1)
              .maybeSingle();

            const startDate = oldestWorkout?.date || startOfDayIso;

            await supabase
              .from('user_profiles')
              .update({ journey_start_date: startDate })
              .eq('id', user.id);

            profileData.journey_start_date = startDate;
          } catch (e) {
            console.error('Error auto-initializing journey_start_date:', e);
          }
        }
        setProfile(profileData);
        setWeight(profileData.weight_kg);
      }

      // Populate edit profile modal fields
      setEditHeight(profileData.height_cm.toString());
      setEditWeight(profileData.weight_kg.toString());
      setEditGoal(profileData.fitness_goal);
      setEditActivity(profileData.activity_level);
      setEditFullName(profileData.full_name || '');
      setEditGender(profileData.gender || 'prefer_not_to_say');
      setEditExperience(profileData.experience_level || 'beginner');

      // 2. Fetch computed metrics
      const { data: metricsData, error: metricsErr } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('id', user.id)
        .single();

      if (metricsErr) throw metricsErr;
      if (profileData) {
        const computedMetrics = calculateNutritionMetrics(profileData);
        setMetrics(computedMetrics);
      } else {
        setMetrics(metricsData);
      }

      // 3. Fetch today's logged water
      const { data: waterData, error: waterErr } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString());

      if (waterErr) throw waterErr;
      const totalWater = waterData ? waterData.reduce((sum, item) => sum + item.amount_ml, 0) : 0;
      setWaterLogged(totalWater);

      // 4. Fetch today's logged workouts
      const { data: workoutsData, error: workoutsErr } = await supabase
        .from('workouts')
        .select('id, workout_sets(exercise_id)')
        .eq('user_id', user.id)
        .eq('date', startOfDayIso);

      if (workoutsErr) throw workoutsErr;

      if (workoutsData && workoutsData.length > 0) {
        // Collect all sets logged today and find unique exercises
        const allSets = workoutsData.reduce((acc: any[], w: any) => {
          return acc.concat(w.workout_sets || []);
        }, []);
        const uniqueExercises = new Set(allSets.map((s: any) => s.exercise_id));
        setTodayWorkout({
          logged: true,
          exerciseCount: uniqueExercises.size
        });
      } else {
        setTodayWorkout({ logged: false, exerciseCount: 0 });
      }

      // Fetch all workouts to calculate streak and suggestions
      const { data: allWorkoutsData, error: allWorkoutsErr } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          workout_sets (
            exercise_id,
            weight_kg,
            reps,
            exercises (
              id,
              name,
              muscle_group,
              muscle_focus_note
            )
          )
        `)
        .eq('user_id', user.id);
      
      if (!allWorkoutsErr && allWorkoutsData) {
        const dates = allWorkoutsData.map((w: any) => w.date).filter(Boolean);
        setStreak(calculateStreak(dates));
        processSuggestions(allWorkoutsData);

        const realSessionsThisWeek = getSessionsCompletedThisWeek(dates);
        setThisWeekSessions(realSessionsThisWeek);

        const monOffset = getMondayOfDate(new Date()).getTime();
        const realThisWeekWorkouts = allWorkoutsData.filter((w: any) => {
          if (!w.date) return false;
          const wTime = new Date(w.date).getTime();
          return wTime >= monOffset;
        });
        const realVolThisWeek = calculateVolumeForWorkouts(realThisWeekWorkouts);
        setThisWeekVolume(realVolThisWeek);

        const realWkStreak = calculateWeeklyStreak(dates);
        setWeeklyStreak(realWkStreak);

        const realSugMuscle = getSuggestedMuscleGroup(allWorkoutsData);
        setSuggestedMuscle(realSugMuscle);

        setAllWorkoutDates(dates);
        syncReminders(dates);
      }

      await checkDraftWorkout();

      // 5. Fetch today's food logs joined with food item details
      const { data: foodLogsData, error: foodLogsErr } = await supabase
        .from('food_logs')
        .select(`
          id,
          quantity_grams,
          meal_type,
          logged_at,
          photo_url,
          foods (
            id,
            name,
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g
          )
        `)
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString());

      if (foodLogsErr) throw foodLogsErr;
      setFoodLogs(foodLogsData || []);

      const logsWithPhotos = (foodLogsData || []).filter((l: any) => l.photo_url);
      if (logsWithPhotos.length > 0 && user.id !== 'mock-user-id-12345') {
        try {
          const paths = logsWithPhotos.map((l: any) => l.photo_url);
          const { data: signedData, error: signedErr } = await supabase.storage
            .from('food-logs')
            .createSignedUrls(paths, 3600);
          
          if (!signedErr && signedData) {
            const signedUrlsMap: { [key: string]: string } = {};
            signedData.forEach((item: any) => {
              if (item.signedUrl) {
                const match = paths.find((p: string) => item.path === p || item.path.endsWith(p));
                if (match) {
                  signedUrlsMap[match] = item.signedUrl;
                } else {
                  signedUrlsMap[item.path] = item.signedUrl;
                }
              }
            });
            setSignedUrls(signedUrlsMap);
          }
        } catch (e) {
          console.error('Error creating signed URLs:', e);
        }
      }

      let calSum = 0;
      let pSum = 0;
      let cSum = 0;
      let fSum = 0;

      (foodLogsData || []).forEach((l: any) => {
        const factor = l.quantity_grams / 100;
        const food = l.foods;
        if (food) {
          calSum += (food.calories_per_100g || 0) * factor;
          pSum += (food.protein_per_100g || 0) * factor;
          cSum += (food.carbs_per_100g || 0) * factor;
          fSum += (food.fat_per_100g || 0) * factor;
        }
      });

      setCaloriesConsumed(Math.round(calSum));
      setProteinConsumed(Math.round(pSum));
      setCarbsConsumed(Math.round(cSum));
      setFatConsumed(Math.round(fSum));

      // 6. Fetch weight logs history
      try {
        const { data: weightLogsData, error: weightLogsErr } = await supabase
          .from('weight_logs')
          .select('id, weight_kg, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(14);

        if (!weightLogsErr && weightLogsData) {
          setWeightLogs([...weightLogsData].reverse());
        }
      } catch (e) {
        console.error('Error fetching weight logs:', e);
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchExercises = async () => {
    if (!user || user.id === 'mock-user-id-12345') {
      const customs = await getLocalCustomExercises();
      setExercisesList([...MOCK_EXERCISES, ...customs]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercisesList(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      const customs = await getLocalCustomExercises();
      setExercisesList([...MOCK_EXERCISES, ...customs]);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      fetchExercises();
      checkDraftWorkout();
    }, [user])
  );

  useEffect(() => {
    checkWeatherCache();
  }, []);

  useEffect(() => {
    if (homeSubTab === 'trackers') {
      const run = async () => {
        const cached = await checkWeatherCache();
        if (!cached) {
          await fetchWeatherAndHydrationNudge();
        }
      };
      run();
    }
  }, [homeSubTab]);

  const handleDeleteFoodLog = async (logId: string) => {
    if (!user || user.id === 'mock-user-id-12345') {
      const idx = MOCK_FOOD_LOGS.findIndex(l => l.id === logId);
      if (idx > -1) {
        MOCK_FOOD_LOGS.splice(idx, 1);
      }
      fetchDashboardData();
      return;
    }

    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      Alert.alert('Delete Error', err.message || 'Failed to delete food entry.');
    }
  };

  const handleLogWater = async (amountMs: number = 250) => {
    setWaterLogged((prev) => prev + amountMs);

    if (!user || user.id === 'mock-user-id-12345') {
      return;
    }

    try {
      const { error: waterErr } = await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: amountMs,
      });
      if (waterErr) throw waterErr;
    } catch (err) {
      console.error('Failed to log water:', err);
      setWaterLogged((prev) => Math.max(0, prev - amountMs));
    }
  };

  const handleLogWeight = async () => {
    const parsedWeight = parseFloat(inputWeight);
    if (isNaN(parsedWeight) || parsedWeight < 30 || parsedWeight > 300) {
      setModalError('Weight must be between 30 kg and 300 kg.');
      return;
    }

    setModalSaving(true);
    setModalError(null);

    if (!user || user.id === 'mock-user-id-12345') {
      setTimeout(() => {
        setWeight(parsedWeight);
        if (profile) {
          const updatedProfile = { ...profile, weight_kg: parsedWeight };
          const newMetrics = calculateNutritionMetrics(updatedProfile);
          setProfile(updatedProfile);
          setMetrics(newMetrics);
        }
        // Append weight log
        const newLog = {
          id: Math.random().toString(),
          weight_kg: parsedWeight,
          created_at: new Date().toISOString(),
        };
        setWeightLogs((prev) => [...prev, newLog]);

        setModalSaving(false);
        setShowWeightModal(false);
        setInputWeight('');
      }, 1000);
      return;
    }

    try {
      const { error: logErr } = await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight_kg: parsedWeight,
      });
      if (logErr) throw logErr;

      const { error: profileUpdateErr } = await supabase
        .from('user_profiles')
        .update({ weight_kg: parsedWeight })
        .eq('id', user.id);
      if (profileUpdateErr) throw profileUpdateErr;

      if (profile) {
        const updatedProfile: UserProfile = { ...profile, weight_kg: parsedWeight };
        const newMetrics = calculateNutritionMetrics(updatedProfile);

        const { error: metricsUpdateErr } = await supabase
          .from('user_metrics')
          .update({
            bmi: newMetrics.bmi,
            bmr: newMetrics.bmr,
            tdee: newMetrics.tdee,
            daily_calorie_goal: newMetrics.daily_calorie_goal,
            protein_g: newMetrics.protein_g,
            fat_g: newMetrics.fat_g,
            carbs_g: newMetrics.carbs_g,
          })
          .eq('id', user.id);

        if (metricsUpdateErr) throw metricsUpdateErr;

        setWeight(parsedWeight);
        setProfile(updatedProfile);
        setMetrics(newMetrics);
      }

      // Append weight log
      const newLog = {
        id: Math.random().toString(),
        weight_kg: parsedWeight,
        created_at: new Date().toISOString(),
      };
      setWeightLogs((prev) => [...prev, newLog]);

      setShowWeightModal(false);
      setInputWeight('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to save weight. Please try again.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    const parsedHeight = parseFloat(editHeight);
    const parsedWeight = parseFloat(editWeight);

    if (!editFullName.trim()) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }
    if (isNaN(parsedHeight) || parsedHeight < 100 || parsedHeight > 250) {
      Alert.alert('Invalid Height', 'Height must be between 100 cm and 250 cm.');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight < 30 || parsedWeight > 300) {
      Alert.alert('Invalid Weight', 'Weight must be between 30 kg and 300 kg.');
      return;
    }

    setProfileSaving(true);

    if (!user || user.id === 'mock-user-id-12345') {
      setTimeout(() => {
        if (profile) {
          const updatedProfile: UserProfile = {
            ...profile,
            full_name: editFullName,
            gender: editGender,
            experience_level: editExperience,
            height_cm: parsedHeight,
            weight_kg: parsedWeight,
            fitness_goal: editGoal,
            activity_level: editActivity,
          };
          const newMetrics = calculateNutritionMetrics(updatedProfile);
          setProfile(updatedProfile);
          setMetrics(newMetrics);
          setWeight(parsedWeight);

          if (profile.weight_kg !== parsedWeight) {
            const newLog = {
              id: Math.random().toString(),
              weight_kg: parsedWeight,
              created_at: new Date().toISOString(),
            };
            setWeightLogs((prev) => [...prev, newLog]);
          }
        }
        setProfileSaving(false);
        setShowProfileModal(false);
      }, 1000);
      return;
    }

    try {
      const { error: profileErr } = await supabase
        .from('user_profiles')
        .update({
          full_name: editFullName,
          gender: editGender,
          experience_level: editExperience,
          height_cm: parsedHeight,
          weight_kg: parsedWeight,
          fitness_goal: editGoal,
          activity_level: editActivity,
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      if (profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          full_name: editFullName,
          gender: editGender,
          experience_level: editExperience,
          height_cm: parsedHeight,
          weight_kg: parsedWeight,
          fitness_goal: editGoal,
          activity_level: editActivity,
        };
        const newMetrics = calculateNutritionMetrics(updatedProfile);

        const { error: metricsErr } = await supabase
          .from('user_metrics')
          .update({
            bmi: newMetrics.bmi,
            bmr: newMetrics.bmr,
            tdee: newMetrics.tdee,
            daily_calorie_goal: newMetrics.daily_calorie_goal,
            protein_g: newMetrics.protein_g,
            fat_g: newMetrics.fat_g,
            carbs_g: newMetrics.carbs_g,
          })
          .eq('id', user.id);

        if (metricsErr) throw metricsErr;

        setProfile(updatedProfile);
        setMetrics(newMetrics);
        setWeight(parsedWeight);

        if (profile.weight_kg !== parsedWeight) {
          try {
            await supabase.from('weight_logs').insert({
              user_id: user.id,
              weight_kg: parsedWeight,
            });
          } catch (e) {
            console.error('Failed to log weight from profile update:', e);
          }
          const newLog = {
            id: Math.random().toString(),
            weight_kg: parsedWeight,
            created_at: new Date().toISOString(),
          };
          setWeightLogs((prev) => [...prev, newLog]);
        }
      }

      setShowProfileModal(false);
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getGreeting = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Midhun';
  };

  const getTimeAwareGreeting = () => {
    const hour = new Date().getHours();
    const name = getGreeting();
    if (hour >= 5 && hour < 12) {
      return { label: 'GOOD MORNING', title: `Good morning, ${name}` };
    } else if (hour >= 12 && hour < 17) {
      return { label: 'GOOD AFTERNOON', title: `Good afternoon, ${name}` };
    } else if (hour >= 17 && hour < 21) {
      return { label: 'GOOD EVENING', title: `Good evening, ${name}` };
    } else {
      return { label: 'WELCOME BACK', title: `Welcome back, ${name}` };
    }
  };

  const getJourneyDayNumber = () => {
    const startDateStr = profile?.journey_start_date;
    if (!startDateStr) return null;

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate difference in days (inclusive)
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getMotivationalMessage = () => {
    const todayIndex = new Date().getDate(); // Stable per-day value to prevent random rerender flickering

    if (todayWorkout?.logged) {
      const pool = [
        "Great going today! 💪",
        "Session logged — nice work!",
        "You showed up today. That's what matters.",
        "Crushed it! Keep up the momentum. 🔥",
        "Consistency is victory. Great workout!"
      ];
      return pool[todayIndex % pool.length];
    }

    if (streak >= 3) {
      const pool = [
        `Day ${streak} streak — don't stop now! ⚡`,
        "You're on a roll, keep it going!",
        `Keep that ${streak}-day flame burning! 🔥`,
        "Consistency looks good on you."
      ];
      return pool[todayIndex % pool.length];
    }

    const pool = [
      "Ready for today's session?",
      "Let's make today count! ⚡",
      "Consistency is the key to progress.",
      "Small steps every day add up to big results.",
      "Focus on your goals and take action."
    ];
    return pool[todayIndex % pool.length];
  };

  const getAge = (dobString?: string) => {
    if (!dobString) return 25;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getGoalLabel = (goal?: string) => {
    switch (goal) {
      case 'lose': return 'Lose fat';
      case 'maintain': return 'Maintain';
      case 'gain': return 'Build muscle';
      case 'recomposition': return 'Recomposition';
      default: return 'Maintain';
    }
  };

  const getExerciseImageUrl = (muscleGroup: string) => {
    const muscle = muscleGroup.toLowerCase();
    if (muscle === 'chest') {
      return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=150';
    }
    if (muscle === 'back') {
      return 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=150';
    }
    if (muscle === 'shoulders') {
      return 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=150';
    }
    if (muscle === 'legs' || muscle === 'glutes' || muscle === 'calves') {
      return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=150';
    }
    if (muscle === 'core' || muscle === 'abs') {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150';
    }
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=150';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  const calorieGoal = metrics?.daily_calorie_goal || 2000;
  const caloriePercent = Math.min(100, Math.round((caloriesConsumed / calorieGoal) * 100));

  // Category Pills for Exercises
  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Forearms', 'Glutes', 'Calves'];

  const filteredExercisesList = exercisesList.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    // Search query active: search across all muscle groups by name/muscle name
    if (searchQuery.trim() !== '') return true;
    
    if (selectedCategory === 'All') return true;
    
    const cat = selectedCategory.toLowerCase();
    const muscle = e.muscle_group.toLowerCase();
    
    if (cat === 'chest') return muscle === 'chest';
    if (cat === 'back') return muscle === 'back';
    if (cat === 'shoulders') return muscle === 'shoulders';
    if (cat === 'legs') return muscle === 'legs';
    
    if (cat === 'biceps') {
      return muscle === 'biceps' || (muscle === 'arms' && e.name.toLowerCase().includes('bicep'));
    }
    if (cat === 'triceps') {
      return muscle === 'triceps' || (muscle === 'arms' && e.name.toLowerCase().includes('tricep'));
    }
    if (cat === 'forearms') {
      return muscle === 'forearms' || (muscle === 'arms' && !e.name.toLowerCase().includes('bicep') && !e.name.toLowerCase().includes('tricep'));
    }
    if (cat === 'abs') {
      return muscle === 'abs' || muscle === 'core';
    }
    if (cat === 'glutes') {
      return muscle === 'glutes' || (muscle === 'legs' && (e.name.toLowerCase().includes('deadlift') || e.name.toLowerCase().includes('squat')));
    }
    if (cat === 'calves') {
      return muscle === 'calves' || (muscle === 'legs' && e.name.toLowerCase().includes('calf'));
    }
    
    return muscle === cat;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Main Content Area based on Tab */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          activeTab === 'home' ? (
            <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} tintColor="#D4FF13" />
          ) : undefined
        }
      >
        {activeTab === 'home' && (() => {
          const MUSCLE_GROUPS = [
            { key: 'Chest', icon: '💪', label: 'Chest' },
            { key: 'Back', icon: '🦅', label: 'Back' },
            { key: 'Shoulders', icon: '🔱', label: 'Shoulders' },
            { key: 'Biceps', icon: '🔥', label: 'Biceps' },
            { key: 'Triceps', icon: '⚡', label: 'Triceps' },
            { key: 'Legs', icon: '🦵', label: 'Legs' },
            { key: 'Abs', icon: '🧱', label: 'Abs' },
            { key: 'Forearms', icon: '✊', label: 'Forearms' },
            { key: 'Glutes', icon: '🎯', label: 'Glutes' },
            { key: 'Calves', icon: '👟', label: 'Calves' },
          ];

          return (
            <View>
              {/* Header Section with smooth native-driven parallax scroll effects */}
              <Animated.View style={[styles.header, {
                opacity: scrollY.interpolate({
                  inputRange: [0, 150],
                  outputRange: [1, 0.7],
                  extrapolate: 'clamp',
                }),
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [0, 150],
                    outputRange: [1, 0.95],
                    extrapolate: 'clamp',
                  })
                }]
              }]}>
                <View style={styles.headerTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={styles.headerSubtitle}>{getTimeAwareGreeting().label}</Text>
                    {getJourneyDayNumber() !== null && (
                      <View style={styles.dayCounterBadge}>
                        <Text style={styles.dayCounterBadgeText}>DAY {getJourneyDayNumber()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.headerTitle}>{getTimeAwareGreeting().title}</Text>
                  <Text style={styles.motivationalSubtext}>{getMotivationalMessage()}</Text>
                  {streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeText}>🔥 {streak} {streak === 1 ? 'DAY' : 'DAYS'} STREAK</Text>
                    </View>
                  )}
                </View>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {getGreeting().charAt(0).toUpperCase()}
                  </Text>
                </View>
              </Animated.View>

              {/* Sub-Tab Switcher */}
              <View style={styles.subTabContainer}>
                <TouchableOpacity
                  style={[styles.subTabButton, homeSubTab === 'workouts' && styles.subTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setHomeSubTab('workouts')}
                >
                  <Text style={[styles.subTabText, homeSubTab === 'workouts' && styles.subTextActive]}>
                    Workouts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabButton, homeSubTab === 'trackers' && styles.subTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setHomeSubTab('trackers')}
                >
                  <Text style={[styles.subTabText, homeSubTab === 'trackers' && styles.subTextActive]}>
                    Trackers
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Workouts Sub-Tab */}
              {homeSubTab === 'workouts' && (
                <View>
                  {/* Weather-aware Hydration Nudge Banner */}
                  {showWeatherNudge && weatherTemp !== null && (
                    <TouchableOpacity
                      style={styles.weatherBanner}
                      activeOpacity={0.9}
                      onPress={() => setHomeSubTab('trackers')}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 20, marginRight: 10 }}>💧</Text>
                        <Text style={styles.weatherBannerText}>
                          It's {weatherTemp.toFixed(0)}°C today — stay hydrated!
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{ padding: 6 }}
                        onPress={() => setShowWeatherNudge(false)}
                      >
                        <Text style={{ color: '#06B6D4', fontWeight: '800', fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}

                  {/* Quick-Start Button */}
                  <TouchableOpacity
                    style={styles.dashboardQuickStartBtn}
                    activeOpacity={0.85}
                    onPress={handleStartWorkoutPress}
                  >
                    <Text style={styles.dashboardQuickStartBtnText}>START WORKOUT SESSION ⚡</Text>
                  </TouchableOpacity>

                  {/* Continue where you left off Draft Card */}
                  {draftWorkout && (
                    <View style={styles.draftCard}>
                      <View style={styles.draftHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.draftCardTitleLabel}>Continue Your Session</Text>
                          <Text style={styles.draftWorkoutName}>
                            {draftWorkout.workoutName || 'Active Session'}
                          </Text>
                          <Text style={styles.draftDetailsText}>
                            {draftWorkout.muscleGroup} — {draftWorkout.exercisesCount} {draftWorkout.exercisesCount === 1 ? 'exercise' : 'exercises'} logged ({draftWorkout.setsCount} {draftWorkout.setsCount === 1 ? 'set' : 'sets'})
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{ padding: 8, alignSelf: 'flex-start' }}
                          onPress={handleDiscardDraft}
                        >
                          <Text style={{ color: '#7A7A7A', fontSize: 18, fontWeight: '800' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.draftResumeBtn}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ActiveWorkout', { 
                          session: session!, 
                          resumeDraft: true,
                          workoutId: draftWorkout.id 
                        })}
                      >
                        <Text style={styles.draftResumeBtnText}>Resume Session →</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* "This Week" Summary Card */}
                  <View style={styles.summaryStatsCard}>
                    <Text style={styles.statsCardTitleLabel}>THIS WEEK</Text>
                    <View style={styles.statsCardGrid}>
                      <View style={styles.statsCardCol}>
                        <Text style={styles.statsCardValue}>{thisWeekSessions}</Text>
                        <Text style={styles.statsCardLabel}>Sessions</Text>
                      </View>
                      <View style={[styles.statsCardCol, styles.statsCardColDivider]}>
                        <Text style={styles.statsCardValue}>{thisWeekVolume}</Text>
                        <Text style={styles.statsCardLabel}>Volume (kg)</Text>
                      </View>
                      <View style={styles.statsCardCol}>
                        <Text style={styles.statsCardValue}>{weeklyStreak}</Text>
                        <Text style={styles.statsCardLabel}>Streak (Wk)</Text>
                      </View>
                    </View>

                    {/* Weekly session goal progress bar */}
                    {(() => {
                      const goal = profile?.weekly_session_goal ?? 4;
                      const progress = Math.min(1, thisWeekSessions / Math.max(1, goal));
                      const isComplete = thisWeekSessions >= goal;

                      // Animate whenever thisWeekSessions changes
                      Animated.timing(sessionProgressAnim, {
                        toValue: progress,
                        duration: 350,
                        useNativeDriver: false,
                      }).start();

                      const barColor = sessionProgressAnim.interpolate({
                        inputRange: [0, 0.9999, 1],
                        outputRange: ['#D4FF13', '#D4FF13', '#00E676'],
                      });

                      return (
                        <View style={styles.sessionGoalContainer}>
                          <View style={styles.sessionGoalTrack}>
                            <Animated.View
                              style={[
                                styles.sessionGoalFill,
                                {
                                  flex: progress,
                                  backgroundColor: isComplete ? '#00E676' : '#D4FF13',
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.sessionGoalLabelRow}>
                            <Text style={styles.sessionGoalLabel}>
                              {isComplete ? '✓ ' : ''}{thisWeekSessions} of {goal} sessions
                            </Text>
                            {isComplete && (
                              <Text style={styles.sessionGoalCompleteText}>Goal reached!</Text>
                            )}
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  {/* "Suggested Muscle Group" Card */}
                  <View style={styles.suggestionCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionCardTitleLabel}>RECOMMENDED TARGET</Text>
                      <Text style={styles.suggestionMuscleName}>
                        {suggestedMuscle.muscle}
                      </Text>
                      <Text style={styles.suggestionLastTrained}>
                        {suggestedMuscle.daysAgo === null
                          ? 'Never trained yet'
                          : `Last trained ${suggestedMuscle.daysAgo} day${suggestedMuscle.daysAgo === 1 ? '' : 's'} ago`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.suggestionStartBtn}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('StartWorkout', {
                        session: session!,
                        initialMuscleGroup: suggestedMuscle.muscle
                      })}
                    >
                      <Text style={styles.suggestionStartBtnText}>Train Target</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 10 Muscle Group Cards Grid */}
                  <Text style={styles.gridSectionTitle}>Exercise Library & Form Guides</Text>
                  <Text style={styles.gridSectionSubtitle}>
                    Select a muscle group to watch step-by-step tutorial videos, read instructions, and master your form.
                  </Text>
                  <View style={styles.muscleGrid}>
                    {MUSCLE_GROUPS.map((m) => {
                      const imageSource = MUSCLE_IMAGES[m.key];
                      return (
                        <TouchableOpacity
                          key={m.key}
                          style={styles.muscleCard}
                          activeOpacity={0.85}
                          onPress={() => {
                            navigation.navigate('MuscleDetail', {
                              session: session!,
                              muscleGroup: m.key
                            });
                          }}
                        >
                          {imageSource ? (
                            <Image
                              source={imageSource}
                              style={styles.muscleCardImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.muscleCardFallbackContainer}>
                              <Text style={styles.muscleCardIcon}>{m.icon}</Text>
                            </View>
                          )}

                          {/* Gradient Overlay */}
                          <View style={StyleSheet.absoluteFill}>
                            <Svg width="100%" height="100%">
                              <Defs>
                                <LinearGradient id={`cardGrad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                  <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                                  <Stop offset="55%" stopColor="rgba(13, 20, 29, 0.4)" stopOpacity="0.4" />
                                  <Stop offset="100%" stopColor="rgba(13, 20, 29, 0.95)" stopOpacity="0.95" />
                                </LinearGradient>
                              </Defs>
                              <Rect width="100%" height="100%" fill={`url(#cardGrad-${m.key})`} />
                            </Svg>
                          </View>

                          <Text style={styles.muscleCardLabel}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Recommended For You horizontal scroll */}
                  <View style={[styles.sectionHeaderRow, { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }]}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                    <Text style={styles.recommendationSubtext}>{getRecommendationSubtext()}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularWorkoutsScroll}
                  >
                    {getRecommendedWorkouts().map((workout) => (
                      <TouchableOpacity
                        key={workout.id}
                        style={styles.workoutCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('WorkoutDetail', {
                          session: session!,
                          workoutId: workout.id,
                          title: workout.title,
                          duration: workout.duration,
                          difficulty: workout.difficulty,
                          calories: workout.calories,
                          description: workout.description,
                          exercisesList: workout.exercisesList,
                        })}
                      >
                        <Image
                          source={{
                            uri: workout.id === 'popular-1'
                              ? 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600'
                              : workout.id === 'popular-2'
                              ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
                              : workout.id === 'popular-3'
                              ? 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600'
                              : workout.id === 'popular-4'
                              ? 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=600'
                              : workout.id === 'popular-5'
                              ? 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
                              : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600',
                          }}
                          style={styles.workoutCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.workoutCardOverlay}>
                          <View style={styles.workoutCardContent}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <View style={styles.workoutDifficultyTag}>
                                <Text style={styles.workoutDifficultyText}>{workout.difficulty}</Text>
                              </View>
                              {workout.isMatch && (
                                <View style={styles.recommendationBadge}>
                                  <Text style={styles.recommendationBadgeText}>{workout.matchReason}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.workoutCardTitleText}>{workout.title}</Text>
                            <View style={styles.workoutMetaRow}>
                              <Text style={styles.workoutMetaText}>⏱ {workout.duration}</Text>
                              <Text style={[styles.workoutMetaText, { marginLeft: 12 }]}>🔥 {workout.calories}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Trackers Sub-Tab */}
              {homeSubTab === 'trackers' && (
                <View style={{ paddingBottom: 140 }}>
                  {/* Today's Progress Card with Progress Circle */}
                  <View style={styles.progressCard}>
                    <View style={styles.progressLeft}>
                      <Text style={styles.progressCardTitle}>Today's Progress</Text>
                      <Text style={styles.progressCardSubtitle}>You've completed</Text>
                      
                      <View style={styles.progressStatsRow}>
                        <View style={styles.progressStatItem}>
                          <Text style={styles.progressStatVal}>{caloriesConsumed}</Text>
                          <Text style={styles.progressStatLbl}>Kcal</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                          <Text style={styles.progressStatVal}>
                            {todayWorkout?.logged ? '45' : '0'}
                          </Text>
                          <Text style={styles.progressStatLbl}>Min</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                          <Text style={styles.progressStatVal}>
                            {todayWorkout?.logged ? '1' : '0'}
                          </Text>
                          <Text style={styles.progressStatLbl}>Workout</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.progressRight}>
                      <View style={styles.circleOuter}>
                        <View style={styles.circleInner}>
                          <Text style={styles.circlePercentText}>{caloriePercent}%</Text>
                          <Text style={styles.circleSubText}>Calories</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Weekly Activity Bar Chart */}
                  {(() => {
                    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const today = new Date();
                    const todayDay = today.getDay(); // 0=Sun
                    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
                    
                    const weekDaysRaw = DAY_LABELS.map((label, i) => {
                      const d = new Date(today);
                      d.setDate(today.getDate() + mondayOffset + i);
                      d.setHours(0, 0, 0, 0);
                      const iso = d.toISOString().split('T')[0];
                      const isToday = d.toDateString() === today.toDateString();

                      // Count workouts from allWorkoutDates
                      const dayWorkoutsCount = allWorkoutDates.filter(dateStr => dateStr.startsWith(iso)).length;
                      const calBurned = dayWorkoutsCount * 300;
                      
                      // Fix water indexing using date comparison
                      const waterVal = d.toDateString() === today.toDateString()
                        ? waterLogged 
                        : (d.getTime() < today.getTime() ? 1500 + ((i * 347) % 1000) : 0);

                      let value = 0;
                      if (weeklyMetricTab === 'workouts') {
                        value = dayWorkoutsCount;
                      } else if (weeklyMetricTab === 'calories') {
                        value = calBurned;
                      } else {
                        value = waterVal;
                      }

                      return { label, iso, isToday, value, workoutCount: dayWorkoutsCount };
                    });

                    const maxValInWeek = Math.max(...weekDaysRaw.map(d => d.value));
                    let maxPossible = 1;
                    if (weeklyMetricTab === 'workouts') {
                      maxPossible = Math.max(2, maxValInWeek);
                    } else if (weeklyMetricTab === 'calories') {
                      maxPossible = Math.max(600, maxValInWeek);
                    } else {
                      maxPossible = Math.max(3000, maxValInWeek);
                    }

                    const weekDays = weekDaysRaw.map(day => ({
                      ...day,
                      barPct: Math.min(1, day.value / maxPossible),
                    }));

                    const themeColor = weeklyMetricTab === 'workouts' 
                      ? '#D4FF13' 
                      : weeklyMetricTab === 'calories' 
                      ? '#F97316' 
                      : '#06B6D4';

                    return (
                      <View style={styles.card}>
                        <Text style={styles.cardTitle}>Weekly Activity</Text>

                        {/* Tab switcher */}
                        <View style={{ flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, padding: 3, marginBottom: 16, marginTop: 8 }}>
                          {(['workouts', 'calories', 'water'] as const).map(tab => (
                            <TouchableOpacity
                              key={tab}
                              onPress={() => {
                                setWeeklyMetricTab(tab);
                                setActiveTooltip(null);
                              }}
                              style={{
                                flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                                backgroundColor: weeklyMetricTab === tab ? themeColor : 'transparent',
                              }}
                            >
                              <Text style={{
                                fontSize: 11, fontWeight: '800',
                                color: weeklyMetricTab === tab ? '#000' : '#666',
                                textTransform: 'capitalize',
                              }}>
                                {tab === 'workouts' ? '🏋️ Workouts' : tab === 'calories' ? '🔥 Calories' : '💧 Water'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Bars container with relative positioning for absolute tooltip */}
                        <View style={{ position: 'relative', height: 100, justifyContent: 'flex-end', marginBottom: 4 }}>
                          {activeTooltip && (
                            <TouchableOpacity 
                              activeOpacity={1} 
                              onPress={() => setActiveTooltip(null)}
                              style={[
                                styles.tooltipBubble,
                                {
                                  left: `${(activeTooltip.index * 14.28) + 7.14}%`,
                                  borderColor: themeColor,
                                }
                              ]}
                            >
                              <Text style={[styles.tooltipBubbleText, { color: themeColor }]}>
                                {activeTooltip.value}
                              </Text>
                            </TouchableOpacity>
                          )}

                          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, justifyContent: 'space-between', paddingHorizontal: 4 }}>
                            {weekDays.map((day, i) => {
                              const hasValue = day.value > 0;
                              const fillColor = day.isToday
                                ? themeColor
                                : (weeklyMetricTab === 'workouts' 
                                    ? 'rgba(212, 255, 19, 0.45)' 
                                    : weeklyMetricTab === 'calories' 
                                    ? 'rgba(249, 115, 22, 0.45)' 
                                    : 'rgba(6, 182, 212, 0.45)');

                              const fillHeight = (hasValue ? `${Math.max(day.barPct * 100, 6)}%` : 4) as any;
                              const currentFillColor = hasValue ? fillColor : '#2C3540';
                              
                              return (
                                <TouchableOpacity
                                  key={i}
                                  activeOpacity={0.8}
                                  onPress={() => {
                                    const metricLabel = weeklyMetricTab === 'workouts'
                                      ? `${day.value} workout${day.value === 1 ? '' : 's'}`
                                      : weeklyMetricTab === 'calories'
                                      ? `${day.value} kcal`
                                      : `${day.value} ml`;
                                    setActiveTooltip({ index: i, value: `${day.label}: ${metricLabel}` });
                                  }}
                                  style={{ alignItems: 'center', flex: 1 }}
                                >
                                  <View style={{
                                    width: '70%',
                                    height: 80,
                                    backgroundColor: '#151C25',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    justifyContent: 'flex-end',
                                    borderColor: day.isToday ? themeColor : 'transparent',
                                    borderWidth: day.isToday ? 1.5 : 0,
                                  }}>
                                    <View style={{
                                      width: '100%',
                                      height: fillHeight,
                                      backgroundColor: currentFillColor,
                                      borderRadius: 6,
                                    }} />
                                  </View>
                                  <Text style={{
                                    fontSize: 10, marginTop: 4,
                                    color: day.isToday ? themeColor : '#666',
                                    fontWeight: day.isToday ? '800' : '500',
                                  }}>
                                    {day.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Summary */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                          <Text style={{ color: '#666', fontSize: 12 }}>
                            {weeklyMetricTab === 'workouts'
                              ? `${weekDays.filter(d => d.workoutCount > 0).length} sessions this week`
                              : weeklyMetricTab === 'calories'
                              ? `${weekDays.reduce((s, d) => s + d.value, 0)} kcal burned`
                              : `${Math.round(weekDays.filter(d => d.value > 0).reduce((s, d) => s + d.value, 0) / 1000 * 10) / 10}L avg hydration`}
                          </Text>
                          <Text style={{ color: themeColor, fontSize: 12, fontWeight: '700' }}>
                            {weeklyMetricTab === 'workouts' ? 'This Week' : weeklyMetricTab === 'calories' ? 'Burned' : 'Hydration'}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Calorie Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Calories</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('LogFood', { session: session! })}
                      >
                        <Text style={styles.linkText}>+ Log Food</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.calorieRow}>
                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{caloriesConsumed}</Text>
                        <Text style={styles.calorieLabel}>Consumed</Text>
                      </View>
                      
                      <View style={[styles.calorieItem, styles.calorieDivider]}>
                        <Text style={styles.calorieNumberMain}>{calorieGoal}</Text>
                        <Text style={styles.calorieLabelMain}>Target Goal</Text>
                      </View>

                      <View style={styles.calorieItem}>
                        <Text style={styles.calorieNumber}>{Math.max(0, calorieGoal - caloriesConsumed)}</Text>
                        <Text style={styles.calorieLabel}>Remaining</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarOuter}>
                      <View style={[styles.progressBarInner, { width: `${caloriePercent}%` }]} />
                    </View>
                    <Text style={styles.progressPctText}>{caloriePercent}% of daily budget met</Text>

                    {/* Macros Split */}
                    <View style={styles.macroSplitRow}>
                      <View style={[styles.macroSplitCol, { borderLeftColor: '#D4FF13' }]}>
                        <Text style={styles.macroName}>Protein</Text>
                        <Text style={styles.macroGrams}>{proteinConsumed}/{metrics?.protein_g || 0}g</Text>
                        <View style={styles.macroProgressOuter}>
                          <View style={[
                            styles.macroProgressInner,
                            {
                              width: `${Math.min(100, Math.round((proteinConsumed / Math.max(1, metrics?.protein_g || 1)) * 100))}%`,
                              backgroundColor: '#D4FF13',
                            }
                          ]} />
                        </View>
                      </View>
                      <View style={[styles.macroSplitCol, { borderLeftColor: '#06B6D4' }]}>
                        <Text style={styles.macroName}>Carbs</Text>
                        <Text style={styles.macroGrams}>{carbsConsumed}/{metrics?.carbs_g || 0}g</Text>
                        <View style={styles.macroProgressOuter}>
                          <View style={[
                            styles.macroProgressInner,
                            {
                              width: `${Math.min(100, Math.round((carbsConsumed / Math.max(1, metrics?.carbs_g || 1)) * 100))}%`,
                              backgroundColor: '#06B6D4',
                            }
                          ]} />
                        </View>
                      </View>
                      <View style={[styles.macroSplitCol, { borderLeftColor: '#F59E0B' }]}>
                        <Text style={styles.macroName}>Fat</Text>
                        <Text style={styles.macroGrams}>{fatConsumed}/{metrics?.fat_g || 0}g</Text>
                        <View style={styles.macroProgressOuter}>
                          <View style={[
                            styles.macroProgressInner,
                            {
                              width: `${Math.min(100, Math.round((fatConsumed / Math.max(1, metrics?.fat_g || 1)) * 100))}%`,
                              backgroundColor: '#F59E0B',
                            }
                          ]} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Ask Govio AI Entry Card */}
                  <TouchableOpacity
                    style={styles.aiChatEntryCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('AiChat', { session: session! })}
                  >
                    <View style={styles.aiChatEntryLeft}>
                      <Text style={styles.aiChatEntryEmoji}>🤖</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.aiChatEntryTitle}>Ask Govio Coach</Text>
                        <Text style={styles.aiChatEntrySub}>Diet, nutrition or meal suggestions? Chat with AI coach</Text>
                      </View>
                    </View>
                    <Text style={styles.aiChatEntryArrow}>→</Text>
                  </TouchableOpacity>

                  {/* Today's Food Logs */}
                  {foodLogs.length === 0 ? (
                    <TouchableOpacity 
                      style={styles.card} 
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('LogFood', { session: session! })}
                    >
                      <Text style={styles.cardTitle}>Today's Food Log</Text>
                      <View style={styles.foodLogEmpty}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 16 }}>🥗</Text>
                          <Text style={styles.foodLogEmptyText}>No food items logged today.</Text>
                        </View>
                        <Text style={styles.foodLogEmptySubtext}>Tap anywhere to log food</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Today's Food Log</Text>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => navigation.navigate('LogFood', { session: session! })}
                        >
                          <Text style={styles.linkText}>+ Log Food</Text>
                        </TouchableOpacity>
                      </View>
                      {
                        (['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => {
                          const mealLogs = foodLogs.filter(log => log.meal_type === meal);
                          if (mealLogs.length === 0) return null;
                          return (
                            <View key={meal} style={styles.mealGroupContainer}>
                              <Text style={styles.mealGroupHeader}>{meal.toUpperCase()}</Text>
                              {mealLogs.map((log) => {
                                const quantity = log.quantity_grams;
                                const food = log.foods;
                                const factor = quantity / 100;
                                const itemCal = Math.round((food?.calories_per_100g || 0) * factor);
                                const photoUri = getFoodPhotoUri(log);
                                return (
                                  <View key={log.id} style={styles.foodLogItemRow}>
                                    {photoUri && (
                                      <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setActiveFullScreenPhoto(photoUri)}
                                        style={styles.foodLogThumbnailContainer}
                                      >
                                        <Image
                                          source={{ uri: photoUri }}
                                          style={styles.foodLogThumbnail}
                                        />
                                      </TouchableOpacity>
                                    )}
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.foodLogItemName}>{food?.name}</Text>
                                      <Text style={styles.foodLogItemDetail}>
                                        {quantity}g • P: {(food?.protein_per_100g * factor || 0).toFixed(1)}g • C: {(food?.carbs_per_100g * factor || 0).toFixed(1)}g • F: {(food?.fat_per_100g * factor || 0).toFixed(1)}g
                                      </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={styles.foodLogItemCal}>{itemCal} kcal</Text>
                                      <TouchableOpacity 
                                        style={styles.deleteFoodLogBtn} 
                                        activeOpacity={0.7}
                                        onPress={() => handleDeleteFoodLog(log.id)}
                                      >
                                        <Text style={styles.deleteFoodLogBtnText}>🗑</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })
                      }
                    </View>
                  )}

                  {/* Water Card */}
                  {(() => {
                    const waterGoal = getWaterGoal();
                    const waterPercent = Math.min(100, Math.round((waterLogged / waterGoal) * 100));
                    const isWaterGoalMet = waterLogged >= waterGoal;

                    return (
                      <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardTitle}>Water Intake</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isWaterGoalMet && (
                              <Text style={{ marginRight: 6, fontSize: 16, color: '#00E676', fontWeight: '800' }}>✔</Text>
                            )}
                            <Text style={[styles.waterSumText, isWaterGoalMet && { color: '#00E676' }]}>
                              {waterLogged} / {waterGoal} ml
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardDesc}>Log your daily hydration intake based on your weight</Text>

                        {/* Dynamic Progress Bar */}
                        <View style={styles.progressBarOuter}>
                          <View style={[
                            styles.progressBarInner,
                            {
                              width: `${waterPercent}%`,
                              backgroundColor: isWaterGoalMet ? '#00E676' : '#06B6D4',
                            }
                          ]} />
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: isWaterGoalMet ? '#00E676' : '#7A7A7A', fontWeight: isWaterGoalMet ? '700' : '400' }}>
                            {isWaterGoalMet ? '✔ Daily goal reached! Excellent! 💦' : `${waterPercent}% of daily goal`}
                          </Text>
                          {isWaterGoalMet && (
                            <Text style={{ fontSize: 11, color: '#00E676', fontWeight: '800' }}>
                              ✓ Met Goal
                            </Text>
                          )}
                        </View>

                        {/* Quick-add chips row */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                          <TouchableOpacity
                            style={[styles.waterChipButton, { flex: 1 }]}
                            activeOpacity={0.8}
                            onPress={() => handleLogWater(100)}
                          >
                            <Text style={styles.waterChipButtonText}>+ 100 ML</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, { flex: 1.5, paddingVertical: 10 }]}
                            activeOpacity={0.8}
                            onPress={() => handleLogWater(250)}
                          >
                            <Text style={styles.actionButtonText}>+ 250 ML</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.waterChipButton, { flex: 1 }]}
                            activeOpacity={0.8}
                            onPress={() => handleLogWater(500)}
                          >
                            <Text style={styles.waterChipButtonText}>+ 500 ML</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Weight Card */}
                  {(() => {
                    const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    const hasEntries = sortedLogs.length >= 2;
                    
                    let trendText = '';
                    let trendStyle = styles.weightTrendEqual;
                    
                    if (hasEntries) {
                      const latest = sortedLogs[sortedLogs.length - 1].weight_kg;
                      const prev = sortedLogs[sortedLogs.length - 2].weight_kg;
                      const diff = latest - prev;
                      if (diff > 0) {
                        trendText = ` ↑${diff.toFixed(1)}kg`;
                        trendStyle = styles.weightTrendUp;
                      } else if (diff < 0) {
                        trendText = ` ↓${Math.abs(diff).toFixed(1)}kg`;
                        trendStyle = styles.weightTrendDown;
                      } else {
                        trendText = ` →0.0kg`;
                        trendStyle = styles.weightTrendEqual;
                      }
                    }

                    // Sparkline calculation
                    const weights = sortedLogs.slice(-14).map(log => log.weight_kg);
                    const sparklineWidth = 300;
                    const sparklineHeight = 45;
                    const sparklinePadding = 6;
                    
                    let pathD = '';
                    let areaD = '';
                    let points: Array<{ x: number; y: number }> = [];

                    if (hasEntries) {
                      const minWeight = Math.min(...weights);
                      const maxWeight = Math.max(...weights);
                      const range = maxWeight - minWeight === 0 ? 2 : maxWeight - minWeight;
                      const adjustedMin = maxWeight - minWeight === 0 ? minWeight - 1 : minWeight;
                      
                      points = weights.map((w, i) => {
                        const x = (i / (weights.length - 1)) * sparklineWidth;
                        const y = sparklineHeight - sparklinePadding - ((w - adjustedMin) / range) * (sparklineHeight - 2 * sparklinePadding);
                        return { x, y };
                      });
                      
                      pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                      areaD = `${pathD} L ${sparklineWidth} ${sparklineHeight} L 0 ${sparklineHeight} Z`;
                    }

                    return (
                      <View style={[styles.card, { marginBottom: 32 }]}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardTitle}>Weight Tracker</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.weightText}>{weight} kg</Text>
                            {hasEntries && (
                              <Text style={trendStyle}>{trendText}</Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.cardDesc}>Maintain record metrics to adapt calories</Text>

                        {/* Compact Sparkline */}
                        {hasEntries && (
                          <View style={styles.sparklineContainer}>
                            <Text style={styles.sparklineTitle}>WEIGHT TREND (LAST {weights.length} LOGS)</Text>
                            <Svg width="100%" height={sparklineHeight} viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}>
                              <Defs>
                                <LinearGradient id="weightSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                  <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                  <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                </LinearGradient>
                              </Defs>
                              <Path d={areaD} fill="url(#weightSparkGrad)" />
                              <Path d={pathD} fill="none" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                              {points.map((p, idx) => (
                                <Circle
                                  key={idx}
                                  cx={p.x}
                                  cy={p.y}
                                  r={idx === points.length - 1 ? 3.5 : 2}
                                  fill={idx === points.length - 1 ? '#D4FF13' : '#10B981'}
                                />
                              ))}
                            </Svg>
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.actionButtonOutline} 
                          activeOpacity={0.85}
                          onPress={() => setShowWeightModal(true)}
                        >
                          <Text style={styles.actionButtonOutlineText}>Log Today's Weight</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })()}

        {/* Exercises Tab View */}
        {activeTab === 'exercises' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabTitle}>Exercises</Text>
            
            {/* Search Bar */}
            <TextInput
              style={styles.searchBar}
              placeholder="Search exercises or muscles..."
              placeholderTextColor="#7A7A7A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    selectedCategory === cat && styles.categoryPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      selectedCategory === cat && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercises List */}
            {filteredExercisesList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises match your filters.</Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {filteredExercisesList.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('ExerciseDetail', {
                        session: session!,
                        exerciseId: exercise.id,
                        name: exercise.name,
                        muscleGroup: exercise.muscle_group,
                      });
                    }}
                  >
                    <View style={styles.exerciseIndexContainer}>
                      <Text style={styles.exerciseIndexText}>🏋️</Text>
                    </View>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseNameText}>{exercise.name}</Text>
                      <Text style={styles.exerciseMuscleText}>{exercise.muscle_group}</Text>
                    </View>
                    <Image
                      source={getExerciseImageSource(exercise)}
                      style={styles.exerciseThumbnail}
                      resizeMode="cover"
                    />
                    <Text style={styles.arrowIcon}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Profile Tab View */}
        {activeTab === 'profile' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabTitle}>Profile</Text>

            {/* Profile Header */}
            <View style={styles.profileHeaderBox}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>
                  {getGreeting().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>{getGreeting()}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'authenticated@govio.fit'}</Text>
            </View>

            {/* Biometric Cards Row */}
            <View style={styles.bioGrid}>
              <View style={styles.bioCard}>
                <Text style={styles.bioCardLabel}>WEIGHT</Text>
                <Text style={styles.bioCardVal}>{profile?.weight_kg || '--'} kg</Text>
              </View>
              <View style={styles.bioCard}>
                <Text style={styles.bioCardLabel}>HEIGHT</Text>
                <Text style={styles.bioCardVal}>{profile?.height_cm || '--'} cm</Text>
              </View>
              <View style={styles.bioCard}>
                <Text style={styles.bioCardLabel}>AGE</Text>
                <Text style={styles.bioCardVal}>{getAge(profile?.date_of_birth)} Yrs</Text>
              </View>
            </View>

            {/* Goal & Experience Row */}
            <View style={styles.profileRowGrid}>
              <View style={[styles.profileGoalCard, { flex: 1, marginRight: 6, marginBottom: 0 }]}>
                <Text style={styles.profileGoalLabel}>FITNESS GOAL</Text>
                <Text style={styles.profileGoalValue}>{getGoalLabel(profile?.fitness_goal)}</Text>
              </View>
              <View style={[styles.profileGoalCard, { flex: 1, marginLeft: 6, marginBottom: 0 }]}>
                <Text style={styles.profileGoalLabel}>EXPERIENCE LEVEL</Text>
                <Text style={styles.profileGoalValue}>
                  {profile?.experience_level ? profile.experience_level : 'beginner'}
                </Text>
              </View>
            </View>

            {/* Notifications Settings Box */}
            <View style={styles.notificationBox}>
              <Text style={styles.notificationBoxTitle}>Notifications</Text>
              
              {/* Master Switch Row */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Allow Workout Reminders</Text>
                  <Text style={styles.toggleSublabel}>Get reminded so you never miss a session</Text>
                </View>
                <Switch
                  value={notifSettings.masterEnabled}
                  onValueChange={handleMasterToggle}
                  trackColor={{ false: '#3D4A3D', true: '#D4FF13' }}
                  thumbColor={notifSettings.masterEnabled ? '#0D141D' : '#7A7A7A'}
                />
              </View>

              {notifSettings.masterEnabled && (
                <>
                  <View style={styles.toggleDivider} />
                  {/* Streak Toggle Row */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>Streak Protection</Text>
                      <Text style={styles.toggleSublabel}>Nudge when your streak is about to break</Text>
                    </View>
                    <Switch
                      value={notifSettings.streakRemindersEnabled}
                      onValueChange={(val) => handleSettingToggle('streakRemindersEnabled', val)}
                      trackColor={{ false: '#3D4A3D', true: '#D4FF13' }}
                      thumbColor={notifSettings.streakRemindersEnabled ? '#0D141D' : '#7A7A7A'}
                    />
                  </View>

                  <View style={styles.toggleDivider} />
                  {/* Re-engagement Toggle Row */}
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>Re-Engagement Reminders</Text>
                      <Text style={styles.toggleSublabel}>Nudge after 3+ days of inactivity</Text>
                    </View>
                    <Switch
                      value={notifSettings.reengagementRemindersEnabled}
                      onValueChange={(val) => handleSettingToggle('reengagementRemindersEnabled', val)}
                      trackColor={{ false: '#3D4D3D', true: '#D4FF13' }}
                      thumbColor={notifSettings.reengagementRemindersEnabled ? '#0D141D' : '#7A7A7A'}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Menu List Options */}
            <View style={styles.menuBox}>
              <TouchableOpacity 
                style={styles.menuItem} 
                activeOpacity={0.7}
                onPress={() => {
                  if (profile) {
                    setEditHeight(profile.height_cm.toString());
                    setEditWeight(profile.weight_kg.toString());
                    setEditGoal(profile.fitness_goal);
                    setEditActivity(profile.activity_level as any);
                    setEditFullName(profile.full_name || '');
                    setEditGender(profile.gender || 'prefer_not_to_say');
                    setEditExperience(profile.experience_level || 'beginner');
                  }
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.menuItemText}>Edit Profile Details</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('WorkoutHistory', { session: session! })}
              >
                <Text style={styles.menuItemText}>Workout History</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                activeOpacity={0.7}
                onPress={() => Alert.alert('Privacy Policy', 'Your fitness and nutrition data is securely stored locally and encrypted on Supabase database layers.')}
              >
                <Text style={styles.menuItemText}>Privacy Policy</Text>
                <Text style={styles.menuItemArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                activeOpacity={0.7}
                onPress={handleSignOut}
              >
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Log Out</Text>
                <Text style={[styles.menuItemArrow, { color: '#EF4444' }]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView session={session || null} />
        )}
      </Animated.ScrollView>

      {/* Floating Bottom Tab Navigator Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('home')}
        >
          <View style={styles.tabBarIconContainer}>
            <HomeIcon active={activeTab === 'home'} />
          </View>
          <Text style={[styles.tabBarLabel, activeTab === 'home' && styles.tabBarTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('exercises')}
        >
          <View style={styles.tabBarIconContainer}>
            <ExercisesIcon active={activeTab === 'exercises'} />
          </View>
          <Text style={[styles.tabBarLabel, activeTab === 'exercises' && styles.tabBarTextActive]}>
            Exercises
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('analytics')}
        >
          <View style={styles.tabBarIconContainer}>
            <AnalyticsIcon active={activeTab === 'analytics'} />
          </View>
          <Text style={[styles.tabBarLabel, activeTab === 'analytics' && styles.tabBarTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('profile')}
        >
          <View style={styles.tabBarIconContainer}>
            <ProfileIcon active={activeTab === 'profile'} />
          </View>
          <Text style={[styles.tabBarLabel, activeTab === 'profile' && styles.tabBarTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log Weight Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWeightModal}
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalSubtitle}>Enter today's weight measurement</Text>

            {modalError && (
              <View style={styles.modalErrorAlert}>
                <Text style={styles.modalErrorText}>{modalError}</Text>
              </View>
            )}

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder={weight.toString()}
                placeholderTextColor="#7A7A7A"
                autoFocus={true}
                value={inputWeight}
                onChangeText={setInputWeight}
              />
              <Text style={styles.modalInputSuffix}>kg</Text>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                activeOpacity={0.7}
                onPress={() => {
                  setShowWeightModal(false);
                  setInputWeight('');
                  setModalError(null);
                }}
                disabled={modalSaving}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                activeOpacity={0.8}
                onPress={handleLogWeight}
                disabled={modalSaving}
              >
                {modalSaving ? (
                  <ActivityIndicator color="#0D141D" size="small" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Weight</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 400 }]}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>Update your fitness biometrics</Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter full name"
                  placeholderTextColor="#7A7A7A"
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>GENDER IDENTITY</Text>
                <View style={styles.modalSelectRowVertical}>
                  {([
                    { k: 'male', l: 'Male' },
                    { k: 'female', l: 'Female' },
                    { k: 'non_binary', l: 'Non-binary' },
                    { k: 'other', l: 'Other' },
                    { k: 'prefer_not_to_say', l: 'Prefer not to say' },
                  ] as const).map((g) => (
                    <TouchableOpacity
                      key={g.k}
                      style={[styles.modalSelectBtnVertical, editGender === g.k && styles.modalSelectBtnActive]}
                      onPress={() => setEditGender(g.k)}
                    >
                      <Text style={[styles.modalSelectBtnText, editGender === g.k && styles.modalSelectBtnTextActive]}>
                        {g.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>EXPERIENCE LEVEL</Text>
                <View style={styles.modalSelectRow}>
                  {([
                    { k: 'beginner', l: 'Beginner' },
                    { k: 'intermediate', l: 'Intermediate' },
                    { k: 'advanced', l: 'Advanced' },
                  ] as const).map((e) => (
                    <TouchableOpacity
                      key={e.k}
                      style={[styles.modalSelectBtn, editExperience === e.k && styles.modalSelectBtnActive]}
                      onPress={() => setEditExperience(e.k)}
                    >
                      <Text style={[styles.modalSelectBtnText, editExperience === e.k && styles.modalSelectBtnTextActive]}>
                        {e.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>HEIGHT (CM)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={editHeight}
                  onChangeText={setEditHeight}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>WEIGHT (KG)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={setEditWeight}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>FITNESS GOAL</Text>
                <View style={styles.modalSelectRow}>
                  {([
                    { k: 'lose', l: 'Lose Fat' },
                    { k: 'maintain', l: 'Maintain' },
                    { k: 'gain', l: 'Build Muscle' },
                    { k: 'recomposition', l: 'Recomp' },
                  ] as const).map((g) => (
                    <TouchableOpacity
                      key={g.k}
                      style={[styles.modalSelectBtn, editGoal === g.k && styles.modalSelectBtnActive]}
                      onPress={() => setEditGoal(g.k)}
                    >
                      <Text style={[styles.modalSelectBtnText, editGoal === g.k && styles.modalSelectBtnTextActive]}>
                        {g.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>ACTIVITY LEVEL</Text>
                <View style={styles.modalSelectRowVertical}>
                  {([
                    { k: 'sedentary', l: 'Sedentary (desk job)' },
                    { k: 'light', l: 'Lightly Active (1-3 days)' },
                    { k: 'moderate', l: 'Moderately Active (3-5 days)' },
                    { k: 'active', l: 'Very Active (6-7 days)' },
                  ] as const).map((a) => (
                    <TouchableOpacity
                      key={a.k}
                      style={[styles.modalSelectBtnVertical, editActivity === a.k && styles.modalSelectBtnActive]}
                      onPress={() => setEditActivity(a.k)}
                    >
                      <Text style={[styles.modalSelectBtnText, editActivity === a.k && styles.modalSelectBtnTextActive]}>
                        {a.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalButtonRow, { marginTop: 20 }]}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                activeOpacity={0.7}
                onPress={() => setShowProfileModal(false)}
                disabled={profileSaving}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                activeOpacity={0.8}
                onPress={handleUpdateProfile}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <ActivityIndicator color="#0D141D" size="small" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Photo Modal */}
      <Modal
        visible={activeFullScreenPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveFullScreenPhoto(null)}
      >
        <View style={styles.fullScreenPhotoOverlay}>
          <TouchableOpacity 
            style={styles.fullScreenPhotoCloseBtn} 
            activeOpacity={0.8}
            onPress={() => setActiveFullScreenPhoto(null)}
          >
            <Text style={styles.fullScreenPhotoCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {activeFullScreenPhoto && (
            <Image 
              source={{ uri: activeFullScreenPhoto }} 
              style={styles.fullScreenPhotoImg} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D141D',
  },
  weatherBanner: {
    backgroundColor: '#11222D',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  weatherBannerText: {
    color: '#DCE3F0',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D141D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7A7A',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  dayCounterBadge: {
    backgroundColor: '#1E2C1E',
    borderWidth: 1,
    borderColor: '#3D4A3D',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayCounterBadgeText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  motivationalSubtext: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
  },
  avatarText: {
    color: '#D4FF13',
    fontSize: 18,
    fontWeight: '900',
  },
  progressCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#3D4A3D',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  progressLeft: {
    flex: 1.2,
  },
  progressCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  progressCardSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  progressStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  progressStatItem: {
    marginRight: 18,
  },
  progressStatVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  progressStatLbl: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  progressRight: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#D4FF13', // brand Neon Lime Green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  circleInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0D141D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlePercentText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  circleSubText: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recommendationSubtext: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  recommendationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 255, 19, 0.15)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  recommendationBadgeText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  popularWorkoutsScroll: {
    paddingRight: 20,
    marginBottom: 24,
  },
  workoutCard: {
    width: 240,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#3D4A3D',
  },
  workoutCardImage: {
    width: '100%',
    height: '100%',
  },
  workoutCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 20, 29, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  workoutCardContent: {},
  workoutDifficultyTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  workoutDifficultyText: {
    color: '#0D141D',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  workoutCardTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  workoutMetaRow: {
    flexDirection: 'row',
  },
  workoutMetaText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3D4A3D',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4FF13',
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
  },
  calorieItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieDivider: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingHorizontal: 8,
  },
  calorieNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calorieLabel: {
    fontSize: 10,
    color: '#7A7A7A',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  calorieNumberMain: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D4FF13',
  },
  calorieLabelMain: {
    fontSize: 10,
    color: '#D4FF13',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#0D141D',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 6,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#D4FF13',
    borderRadius: 4,
  },
  progressPctText: {
    fontSize: 11,
    color: '#7A7A7A',
    textAlign: 'right',
    marginBottom: 16,
    fontWeight: '600',
  },
  macroSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingTop: 16,
  },
  macroSplitCol: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginHorizontal: 4,
  },
  macroName: {
    fontSize: 11,
    color: '#A0A0A0',
    marginBottom: 2,
    fontWeight: '700',
  },
  macroGrams: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  waterSumText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#06B6D4',
  },
  waterChipButton: {
    backgroundColor: '#11222D',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterChipButtonText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '800',
  },
  actionButton: {
    backgroundColor: '#D4FF13',
    borderRadius: 30, // pill shape
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionButtonText: {
    color: '#0D141D',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.05)',
    borderRadius: 30, // pill shape
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonOutlineText: {
    color: '#D4FF13',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sparklineContainer: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#0D141D',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C2530',
  },
  sparklineTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A7A7A',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  weightTrendUp: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F97316',
    marginLeft: 6,
  },
  weightTrendDown: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
    marginLeft: 6,
  },
  weightTrendEqual: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7A7A7A',
    marginLeft: 6,
  },
  tooltipBubble: {
    position: 'absolute',
    top: -46,
    width: 100,
    marginLeft: -50,
    backgroundColor: '#1C242C',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    zIndex: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  tooltipBubbleText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  workoutSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  workoutSuccessIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutSuccessIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  workoutSuccessTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  workoutSuccessSubtitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D141D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    marginBottom: 16,
  },
  workoutIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#D4FF13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  workoutSubtitle: {
    color: '#A0A0A0',
    fontSize: 11,
  },
  weightText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  foodLogThumbnailContainer: {
    marginRight: 12,
  },
  foodLogThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
  },
  fullScreenPhotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhotoCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  fullScreenPhotoCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fullScreenPhotoImg: {
    width: '100%',
    height: '80%',
  },
  // Bottom Tab Bar Styles
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1.5,
    borderTopColor: '#3D4A3D',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabBarIcon: {
    fontSize: 20,
    color: '#7A7A7A',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A7A7A',
    marginTop: 4,
  },
  tabBarTextActive: {
    color: '#D4FF13', // Highlight active tabs in lime green
  },
  // Tab content general layout
  tabContentContainer: {
    marginTop: 8,
  },
  tabTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  // Exercises Search & Pills
  searchBar: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    marginBottom: 16,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryPill: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
  },
  categoryPillActive: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  categoryPillText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#D4FF13',
  },
  exercisesList: {
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
  },
  exerciseIndexContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exerciseIndexText: {
    fontSize: 16,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseMuscleText: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  arrowIcon: {
    color: '#7A7A7A',
    fontSize: 16,
    fontWeight: '800',
  },
  exerciseThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7A7A7A',
    fontSize: 14,
    fontWeight: '600',
  },
  // Profile Tab Styles
  profileHeaderBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4FF13',
    marginBottom: 16,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  largeAvatarText: {
    color: '#D4FF13',
    fontSize: 36,
    fontWeight: '900',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#A0A0A0',
    fontSize: 13,
  },
  bioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bioCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bioCardLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bioCardVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profileGoalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileGoalLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  profileGoalValue: {
    color: '#D4FF13',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  menuBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#3D4A3D',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemArrow: {
    color: '#7A7A7A',
    fontSize: 14,
    fontWeight: '800',
  },
  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 20, 29, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 20,
  },
  modalErrorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192029',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    paddingVertical: 12,
  },
  modalInputSuffix: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '800',
  },
  modalButtonRow: {
    flexDirection: 'row',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '800',
  },
  modalSaveButton: {
    flex: 1.5,
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    color: '#0D141D',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  // Food Log styling
  foodLogEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#0D141D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  foodLogEmptyText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  foodLogEmptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  foodLogEmptySubtext: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  macroProgressOuter: {
    height: 4,
    backgroundColor: '#0D141D',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  macroProgressInner: {
    height: '100%',
    borderRadius: 2,
  },
  mealGroupContainer: {
    marginTop: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#3D4A3D',
    paddingBottom: 10,
  },
  mealGroupHeader: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  foodLogItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  foodLogItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  foodLogItemDetail: {
    color: '#A0A0A0',
    fontSize: 11,
    marginTop: 2,
  },
  foodLogItemCal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 10,
  },
  deleteFoodLogBtn: {
    padding: 6,
  },
  deleteFoodLogBtnText: {
    fontSize: 14,
    color: '#EF4444',
  },
  // Profile edit form
  modalFormGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#192029',
    color: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  modalSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalSelectBtn: {
    width: '48%',
    backgroundColor: '#192029',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSelectBtnVertical: {
    width: '100%',
    backgroundColor: '#192029',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  modalSelectBtnActive: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  modalSelectBtnText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
  },
  modalSelectBtnTextActive: {
    color: '#D4FF13',
  },
  modalSelectRowVertical: {
    flexDirection: 'column',
  },
  profileRowGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 4,
    marginBottom: 20,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  subTabActive: {
    backgroundColor: '#D4FF13',
  },
  subTabText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subTextActive: {
    color: '#0D141D',
  },
  gridSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  muscleCard: {
    width: '48%',
    height: 120,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  muscleCardIcon: {
    fontSize: 24,
  },
  muscleCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  muscleCardFallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  muscleCardLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    margin: 12,
    zIndex: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  streakBadgeText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  suggestionsContainer: {
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 24,
    padding: 16,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D4FF13',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  suggestionBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0D141D',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  suggestionContentCol: {
    flex: 1,
  },
  suggestionBannerTitle: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestionBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  suggestionFocusNote: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionCloseBtn: {
    padding: 2,
    marginLeft: 8,
  },
  suggestionCloseText: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '800',
  },
  dashboardQuickStartBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  dashboardQuickStartBtnText: {
    color: '#0D141D',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiChatEntryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiChatEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  aiChatEntryEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  aiChatEntryTitle: {
    color: '#D4FF13',
    fontSize: 15,
    fontWeight: '900',
  },
  aiChatEntrySub: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  aiChatEntryArrow: {
    color: '#D4FF13',
    fontSize: 18,
    fontWeight: '900',
  },
  draftCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 255, 19, 0.4)',
    padding: 20,
    marginBottom: 20,
  },
  draftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  draftCardTitleLabel: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  draftWorkoutName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  draftDetailsText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
  },
  draftDiscardBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  draftDiscardBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  draftResumeBtn: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftResumeBtnText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '800',
  },
  summaryStatsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 20,
    marginBottom: 20,
  },
  statsCardTitleLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsCardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsCardCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsCardColDivider: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#3D4A3D',
  },
  statsCardValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statsCardLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sessionGoalContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2E2E2E',
  },
  sessionGoalTrack: {
    height: 6,
    backgroundColor: '#2E2E2E',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sessionGoalFill: {
    height: 6,
    borderRadius: 3,
  },
  sessionGoalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sessionGoalLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionGoalCompleteText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  suggestionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionCardTitleLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  suggestionMuscleName: {
    color: '#D4FF13',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  suggestionLastTrained: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionStartBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionStartBtnText: {
    color: '#0D141D',
    fontSize: 12,
    fontWeight: '800',
  },
  tabBarIconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  gridSectionSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  notificationBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  notificationBoxTitle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  toggleSublabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '500',
  },
  toggleDivider: {
    height: 1,
    backgroundColor: '#3D4A3D',
    marginVertical: 10,
  },
});
