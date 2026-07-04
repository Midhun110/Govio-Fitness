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
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { calculateNutritionMetrics, NutritionMetrics, UserProfile } from '../utils/calculations';

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
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '10 reps' },
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '15 reps' },
    ],
  },
];

const MOCK_EXERCISES = [
  {
    id: 'ex-1',
    name: 'Bench Press',
    muscle_group: 'Chest',
    primary_muscle: 'Pectoralis Major',
    secondary_muscles: ['Triceps', 'Anterior Deltoids'],
    instructions: [
      'Lie flat on the bench with your feet flat on the floor.',
      'Grip the barbell slightly wider than shoulder-width.',
      'Unrack the bar and lower it slowly to your mid-chest.',
      'Push the bar back up powerfully while keeping your elbows tucked at a 45-degree angle.'
    ],
    form_tips: [
      'Keep your shoulder blades retracted and depressed throughout the lift.',
      'Drive your feet into the floor to create leg drive.'
    ],
    common_mistakes: [
      'Bouncing the bar off your chest.',
      'Flaring your elbows out completely, which places excessive stress on the rotator cuffs.'
    ],
    image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600'
  },
  {
    id: 'ex-2',
    name: 'Squat',
    muscle_group: 'Legs',
    primary_muscle: 'Quadriceps',
    secondary_muscles: ['Glutes', 'Hamstrings', 'Lower Back'],
    instructions: [
      'Place the barbell across your upper back (traps).',
      'Stand with feet shoulder-width apart, toes pointing slightly out.',
      'Hinge at your hips and bend your knees to lower your body.',
      'Keep lowering until your thighs are parallel or below parallel to the floor.',
      'Push through your heels to return to the starting standing position.'
    ],
    form_tips: [
      'Keep your chest up and your spine neutral throughout the movement.',
      'Make sure your knees track in the direction of your toes, not caving inward.'
    ],
    common_mistakes: [
      'Allowing knees to cave inwards (valgus collapse).',
      'Lifting heels off the floor, which shifts load excessively to knee joints.'
    ],
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
  },
  {
    id: 'ex-3',
    name: 'Deadlift',
    muscle_group: 'Legs',
    primary_muscle: 'Hamstrings & Glutes',
    secondary_muscles: ['Erector Spinae', 'Latissimus Dorsi', 'Forearms'],
    instructions: [
      'Stand with your mid-foot under the barbell.',
      'Bend over and grab the bar with a shoulder-width grip.',
      'Drop your hips slightly and flatten your back completely.',
      'Drive through your legs and pull the bar vertically up close to your shins.',
      'Lock out at the top by squeezing your glutes, then lower the bar with control.'
    ],
    form_tips: [
      'Keep the bar as close to your body as possible during the entire lift.',
      'Engage your lats by imagining squeezing oranges in your armpits.'
    ],
    common_mistakes: [
      'Rounding the lower back, which can cause lumbar injury.',
      'Jerking the bar off the floor rather than pulling with progressive tension.'
    ],
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
  },
  {
    id: 'ex-4',
    name: 'Overhead Press',
    muscle_group: 'Shoulders',
    primary_muscle: 'Anterior Deltoids',
    secondary_muscles: ['Triceps', 'Upper Trapezius', 'Core'],
    instructions: [
      'Set the bar on a rack at collarbone height.',
      'Grip the bar slightly wider than shoulder-width with forearms vertical.',
      'Unrack the bar and take a step back, keeping your core tight.',
      'Press the bar straight up over your head, moving your face back slightly to clear the bar.',
      'Lock out your arms at the top, then lower it slowly back to collarbone level.'
    ],
    form_tips: [
      'Squeeze your glutes and core to stabilize your spine.',
      'Keep your forearms perfectly vertical under the bar.'
    ],
    common_mistakes: [
      'Excessively arching the lower back.',
      'Not locking out the elbows at the top of the repetition.'
    ],
    image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600'
  },
  {
    id: 'ex-5',
    name: 'Pull-up',
    muscle_group: 'Back',
    primary_muscle: 'Latissimus Dorsi',
    secondary_muscles: ['Biceps', 'Rhomboids', 'Rear Deltoids'],
    instructions: [
      'Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulder-width.',
      'Depress your shoulders and engage your core.',
      'Pull your chest up towards the bar by driving your elbows down toward your ribs.',
      'Clear the bar with your chin, hold for a split second, then lower back to a dead hang.'
    ],
    form_tips: [
      'Focus on pulling through your elbows rather than squeezing with your hands.',
      'Control the eccentric lowering phase for maximum muscle activation.'
    ],
    common_mistakes: [
      'Kicking or using momentum (kipping) to get over the bar.',
      'Not completing the full range of motion.'
    ],
    image_url: 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=600'
  },
  {
    id: 'ex-6',
    name: 'Bicep Curl',
    muscle_group: 'Biceps',
    primary_muscle: 'Biceps Brachii',
    secondary_muscles: ['Brachialis', 'Brachioradialis'],
    instructions: [
      'Hold a pair of dumbbells at your sides, palms facing forward.',
      'Keep your elbows tucked close to your torso.',
      'Squeeze your biceps and curl the weights up toward shoulder height.',
      'Lower the dumbbells slowly back to the starting point.'
    ],
    form_tips: [
      'Keep your wrists straight and avoid using momentum.',
      'Keep your shoulders down and back.'
    ],
    common_mistakes: [
      'Swinging the elbows forward to lift heavier weight.',
      'Using the lower back to swing the body for momentum.'
    ],
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
  },
  {
    id: 'ex-7',
    name: 'Tricep Dip',
    muscle_group: 'Triceps',
    primary_muscle: 'Triceps Brachii',
    secondary_muscles: ['Anterior Deltoids', 'Pectoralis Major'],
    instructions: [
      'Hoist yourself up on parallel dip bars with arms fully locked out.',
      'Inhale, bend your elbows, and lower your body slowly.',
      'Stop lowering when your elbows reach a 90-degree angle.',
      'Exhale and push yourself back up to the starting position.'
    ],
    form_tips: [
      'Keep your chest slightly tilted forward to engage chest, or upright for triceps.',
      'Do not go past a 90-degree angle to protect your shoulders.'
    ],
    common_mistakes: [
      'Shrugging the shoulders up toward the ears.',
      'Flaring the elbows out excessively.'
    ],
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
  },
  {
    id: 'ex-8',
    name: 'Abs Crunch',
    muscle_group: 'Abs',
    primary_muscle: 'Rectus Abdominis',
    secondary_muscles: ['Transverse Abdominis', 'Obliques'],
    instructions: [
      'Lie on your back with knees bent and feet flat on the floor.',
      'Place your hands lightly behind your head or crossed over your chest.',
      'Engage your abdominal muscles and lift your shoulders off the floor.',
      'Exhale as you rise, hold for a moment, then lower slowly back to the start.'
    ],
    form_tips: [
      'Do not pull on your neck with your hands.',
      'Focus on rib-to-pelvis contraction.'
    ],
    common_mistakes: [
      'Using hip flexors to pull the body up.',
      'Tucking the chin aggressively into the chest.'
    ],
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
  },
  {
    id: 'ex-9',
    name: 'Wrist Curl',
    muscle_group: 'Forearms',
    primary_muscle: 'Wrist Flexors',
    secondary_muscles: ['Brachioradialis'],
    instructions: [
      'Sit on a bench, holding dumbbells with an underhand grip.',
      'Rest your forearms on your thighs with wrists hanging off the knees.',
      'Let the weight roll down to your fingers, then curl your wrists upward.',
      'Squeeze the flexors at the top, then lower with control.'
    ],
    form_tips: [
      'Perform the movement slowly through the full range of motion.',
      'Keep your forearms flat against your legs.'
    ],
    common_mistakes: [
      'Lifting the forearms off the thighs.',
      'Jerking the wrist quickly, which can cause tendonitis.'
    ],
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
  },
  {
    id: 'ex-10',
    name: 'Hip Thrust',
    muscle_group: 'Glutes',
    primary_muscle: 'Gluteus Maximus',
    secondary_muscles: ['Hamstrings', 'Core'],
    instructions: [
      'Sit on the floor with your upper back resting against a sturdy bench.',
      'Roll a barbell over your hips, using a pad for comfort.',
      'Place feet flat on the floor, hip-width apart.',
      'Drive through your heels to lift your hips until thighs are parallel to floor.',
      'Squeeze glutes at lockout, then lower hips back down.'
    ],
    form_tips: [
      'Keep your chin tucked and look forward, not up at the ceiling.',
      'Ensure shins are vertical at the top of the lift.'
    ],
    common_mistakes: [
      'Hyperextending the lower back at the top.',
      'Pushing through the toes instead of the heels.'
    ],
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
  },
  {
    id: 'ex-11',
    name: 'Calf Raise',
    muscle_group: 'Calves',
    primary_muscle: 'Gastrocnemius',
    secondary_muscles: ['Soleus'],
    instructions: [
      'Stand with the balls of your feet on an elevated step or block.',
      'Hold onto a support for balance if needed.',
      'Lower your heels below the step level to feel a stretch.',
      'Push up high onto your toes, contracting the calves.',
      'Hold the contraction for a second, then lower slowly.'
    ],
    form_tips: [
      'Keep your knees straight but not completely locked out.',
      'Pause at the bottom stretch and top contraction.'
    ],
    common_mistakes: [
      'Bouncing quickly at the bottom using Achilles tendon elasticity.',
      'Not using a full range of motion.'
    ],
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
  }
];

// Global arrays for mock database in development bypass mode
export let MOCK_WORKOUTS: Array<{ id: string; date: string; notes: string; exercisesCount: number; sets: any[] }> = [];
export let MOCK_FOOD_LOGS: Array<{ id: string; user_id: string; food_id: string; quantity_grams: number; logged_at: string; meal_type: string; foods: any }> = [];

export default function HomeScreen({ route }: HomeScreenProps) {
  const session = route?.params?.session;
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Active Bottom Tab: 'home' | 'exercises' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'exercises' | 'profile'>('home');
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
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  
  // Today's workout state
  const [todayWorkout, setTodayWorkout] = useState<{ logged: boolean; exerciseCount: number } | null>(null);

  // Weight Logging Modal State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editGoal, setEditGoal] = useState<'lose' | 'maintain' | 'gain' | 'recomposition'>('maintain');
  const [editActivity, setEditActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [editExperience, setEditExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [profileSaving, setProfileSaving] = useState(false);

  // Exercises Tab State
  const [exercisesList, setExercisesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchDashboardData = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayIso = startOfDay.toISOString().split('T')[0];

    if (!user || user.id === 'mock-user-id-12345') {
      // Set mock data in development bypass mode
      setProfile(MOCK_PROFILE);
      setMetrics(MOCK_METRICS);
      setWeight(MOCK_PROFILE.weight_kg);
      setWaterLogged(500);
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
      setProfile(profileData);
      setWeight(profileData.weight_kg);

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
      setMetrics(metricsData);

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

      // 5. Fetch today's food logs joined with food item details
      const { data: foodLogsData, error: foodLogsErr } = await supabase
        .from('food_logs')
        .select(`
          id,
          quantity_grams,
          meal_type,
          logged_at,
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

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchExercises = async () => {
    if (!user || user.id === 'mock-user-id-12345') {
      setExercisesList(MOCK_EXERCISES);
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
      setExercisesList(MOCK_EXERCISES);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      fetchExercises();
    }, [user])
  );

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

  const handleLogWater = async () => {
    setWaterLogged((prev) => prev + 250);

    if (!user || user.id === 'mock-user-id-12345') {
      return;
    }

    try {
      const { error: waterErr } = await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: 250,
      });
      if (waterErr) throw waterErr;
    } catch (err) {
      console.error('Failed to log water:', err);
      setWaterLogged((prev) => Math.max(0, prev - 250));
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === 'home' ? (
            <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} tintColor="#D4FF13" />
          ) : undefined
        }
      >
        {activeTab === 'home' && (() => {
          const MUSCLE_GROUPS = [
            { key: 'Chest', icon: '💪', label: 'Chest' },
            { key: 'Back', icon: '🪵', label: 'Back' },
            { key: 'Shoulders', icon: '📐', label: 'Shoulders' },
            { key: 'Biceps', icon: '⚡', label: 'Biceps' },
            { key: 'Triceps', icon: '💥', label: 'Triceps' },
            { key: 'Legs', icon: '🦵', label: 'Legs' },
            { key: 'Abs', icon: '🍫', label: 'Abs' },
            { key: 'Forearms', icon: '✊', label: 'Forearms' },
            { key: 'Glutes', icon: '🍑', label: 'Glutes' },
            { key: 'Calves', icon: '👟', label: 'Calves' },
          ];

          return (
            <View>
              {/* Header Section */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerSubtitle}>WELCOME BACK</Text>
                  <Text style={styles.headerTitle}>Hello, {getGreeting()}</Text>
                </View>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {getGreeting().charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>

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
                  {/* 10 Muscle Group Cards Grid */}
                  <Text style={styles.gridSectionTitle}>Target Muscle Groups</Text>
                  <View style={styles.muscleGrid}>
                    {MUSCLE_GROUPS.map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        style={styles.muscleCard}
                        activeOpacity={0.8}
                        onPress={() => {
                          navigation.navigate('MuscleDetail', {
                            session: session!,
                            muscleGroup: m.key
                          });
                        }}
                      >
                        <Text style={styles.muscleCardIcon}>{m.icon}</Text>
                        <Text style={styles.muscleCardLabel}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Popular Workouts horizontal scroll */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Popular Workouts</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularWorkoutsScroll}
                  >
                    {POPULAR_WORKOUTS.map((workout) => (
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
                              : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600',
                          }}
                          style={styles.workoutCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.workoutCardOverlay}>
                          <View style={styles.workoutCardContent}>
                            <View style={styles.workoutDifficultyTag}>
                              <Text style={styles.workoutDifficultyText}>{workout.difficulty}</Text>
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

                  {/* Workout Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Daily Workouts</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('WorkoutHistory', { session: session! })}
                      >
                        <Text style={styles.linkText}>History</Text>
                      </TouchableOpacity>
                    </View>

                    {todayWorkout?.logged ? (
                      <View style={styles.workoutSuccessBox}>
                        <View style={styles.workoutSuccessIconPlaceholder}>
                          <Text style={styles.workoutSuccessIconText}>✓</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.workoutSuccessTitle}>Workout logged ✓</Text>
                          <Text style={styles.workoutSuccessSubtitle}>
                            Logged {todayWorkout.exerciseCount} exercise{todayWorkout.exerciseCount !== 1 ? 's' : ''} today
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.workoutPlaceholder}>
                        <View style={styles.workoutIconPlaceholder}>
                          <Text style={{ fontSize: 18 }}>🏋️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.workoutTitle}>No workout logged today</Text>
                          <Text style={styles.workoutSubtitle}>Keep active and record your training splits</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={todayWorkout?.logged ? styles.actionButtonOutline : styles.actionButton}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('LogWorkout', { session: session! })}
                    >
                      <Text style={todayWorkout?.logged ? styles.actionButtonOutlineText : styles.actionButtonText}>
                        {todayWorkout?.logged ? 'Log Another Workout' : 'Log Workout'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Trackers Sub-Tab */}
              {homeSubTab === 'trackers' && (
                <View>
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
                      </View>
                      <View style={[styles.macroSplitCol, { borderLeftColor: '#06B6D4' }]}>
                        <Text style={styles.macroName}>Carbs</Text>
                        <Text style={styles.macroGrams}>{carbsConsumed}/{metrics?.carbs_g || 0}g</Text>
                      </View>
                      <View style={[styles.macroSplitCol, { borderLeftColor: '#F59E0B' }]}>
                        <Text style={styles.macroName}>Fat</Text>
                        <Text style={styles.macroGrams}>{fatConsumed}/{metrics?.fat_g || 0}g</Text>
                      </View>
                    </View>
                  </View>

                  {/* Today's Food Logs */}
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Today's Food Log</Text>
                    {foodLogs.length === 0 ? (
                      <View style={styles.foodLogEmpty}>
                        <Text style={styles.foodLogEmptyText}>No food items logged today.</Text>
                      </View>
                    ) : (
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
                              return (
                                <View key={log.id} style={styles.foodLogItemRow}>
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
                    )}
                  </View>

                  {/* Water Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Water Intake</Text>
                      <Text style={styles.waterSumText}>{waterLogged} ml</Text>
                    </View>
                    <Text style={styles.cardDesc}>Log your daily hydration intake</Text>
                    
                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleLogWater}>
                      <Text style={styles.actionButtonText}>+ 250 ml</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Weight Card */}
                  <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>Weight Tracker</Text>
                      <Text style={styles.weightText}>{weight} kg</Text>
                    </View>
                    <Text style={styles.cardDesc}>Maintain record metrics to adapt calories</Text>

                    <TouchableOpacity 
                      style={styles.actionButtonOutline} 
                      activeOpacity={0.8}
                      onPress={() => setShowWeightModal(true)}
                    >
                      <Text style={styles.actionButtonOutlineText}>Log Today's Weight</Text>
                    </TouchableOpacity>
                  </View>
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
                      source={{ uri: getExerciseImageUrl(exercise.muscle_group) }}
                      style={styles.exerciseThumbnail}
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
                    setEditActivity(profile.activity_level);
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
      </ScrollView>

      {/* Floating Bottom Tab Navigator Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabBarIcon, activeTab === 'home' && styles.tabBarTextActive]}>
            🏠
          </Text>
          <Text style={[styles.tabBarLabel, activeTab === 'home' && styles.tabBarTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('exercises')}
        >
          <Text style={[styles.tabBarIcon, activeTab === 'exercises' && styles.tabBarTextActive]}>
            🏋️
          </Text>
          <Text style={[styles.tabBarLabel, activeTab === 'exercises' && styles.tabBarTextActive]}>
            Exercises
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBarItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabBarIcon, activeTab === 'profile' && styles.tabBarTextActive]}>
            👤
          </Text>
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
                  <ActivityIndicator color="#121212" size="small" />
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
                  <ActivityIndicator color="#121212" size="small" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
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
    borderColor: '#2D2D37',
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
    backgroundColor: '#121212',
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
    borderColor: '#2D2D37',
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
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
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
    color: '#121212',
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
    borderColor: '#2D2D37',
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
    borderColor: '#2D2D37',
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
    backgroundColor: '#121212',
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
    borderColor: '#2D2D37',
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
    color: '#121212',
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
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
  // Bottom Tab Bar Styles
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1.5,
    borderTopColor: '#2D2D37',
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
    borderColor: '#2D2D37',
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
    borderColor: '#2D2D37',
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D4FF13',
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
    borderColor: '#2D2D37',
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
    borderColor: '#2D2D37',
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
    borderColor: '#2D2D37',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D37',
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
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
    backgroundColor: '#242424',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
    color: '#121212',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  // Food Log styling
  foodLogEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  foodLogEmptyText: {
    color: '#7A7A7A',
    fontSize: 13,
  },
  mealGroupContainer: {
    marginTop: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2D2D37',
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
    backgroundColor: '#242424',
    color: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
    backgroundColor: '#242424',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSelectBtnVertical: {
    width: '100%',
    backgroundColor: '#242424',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
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
    borderColor: '#2D2D37',
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
    color: '#121212',
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
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleCardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  muscleCardLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
