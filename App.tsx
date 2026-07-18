import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import HomeRouterScreen from './src/screens/HomeRouterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import LogWorkoutScreen from './src/screens/LogWorkoutScreen';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import LogFoodScreen from './src/screens/LogFoodScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import MuscleDetailScreen from './src/screens/MuscleDetailScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import StartWorkoutScreen from './src/screens/StartWorkoutScreen';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import AiChatScreen from './src/screens/AiChatScreen';
import { NutritionMetrics, calculateNutritionMetrics, classifyUserProfile } from './src/utils/calculations';
import * as SecureStore from 'expo-secure-store';
import { getPendingOnboarding, setPendingOnboarding } from './src/utils/pendingOnboarding';

// Inject mobile-frame CSS immediately at module load (before first render).
// This constrains the #root element at the DOM level so React Navigation
// native-stack screens, modals, and portals cannot escape the phone column.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.setAttribute('data-govio', 'web-frame');
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    html, body, #root, #root * {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: optimizeLegibility !important;
    }
    html, body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #111015 !important;
      overflow: hidden !important;
    }
    #root {
      max-width: 430px !important;
      height: 100vh !important;
      margin: 0 auto !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      background-color: #000000 !important;
      box-shadow: 0 0 40px rgba(0,0,0,0.6) !important;
      position: relative !important;
      border-left: 1px solid #1E1E24 !important;
      border-right: 1px solid #1E1E24 !important;
    }
    #root [style*="font-weight: 900"], 
    #root [style*="font-weight: 800"], 
    #root [style*="font-weight: 700"], 
    #root [style*="font-weight: bold"] {
      font-family: 'Outfit', sans-serif !important;
    }
  `;
  document.head.appendChild(s);
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: { onboardingData?: any } | undefined;
  Home: { session: Session };
  Onboarding: { session?: Session; onComplete?: (metrics: NutritionMetrics) => void } | undefined;
  Results: { session: Session; metrics: NutritionMetrics; onFinish: () => void };
  LogWorkout: { session: Session; initialExercises?: any[] };
  WorkoutHistory: { session: Session };
  LogFood: { session: Session };
  WorkoutDetail: {
    session: Session;
    workoutId: string;
    title: string;
    duration: string;
    difficulty: string;
    calories: string;
    description: string;
    exercisesList: any[];
    profile?: any;
  };
  MuscleDetail: { session: Session; muscleGroup: string };
  ExerciseDetail: { session: Session; exerciseId: string; name: string; muscleGroup: string };
  StartWorkout: { session: Session; initialMuscleGroup?: string };
  ActiveWorkout: { session: Session; exercises?: any[]; workoutName?: string; resumeDraft?: boolean; workoutId?: string; programDay?: number };

  AiChat: { session: Session };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Set to true to bypass real Supabase Auth during local development testing
const BYPASS_AUTH = __DEV__ && false;

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: 'mock-user-id-12345',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo-user@govio.fit',
    phone: '',
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const MOCK_METRICS: NutritionMetrics = {
  bmi: 24.22,
  bmr: 1680.5,
  tdee: 2604.8,
  daily_calorie_goal: 2105,
  protein_g: 126,
  fat_g: 58,
  carbs_g: 269,
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState<NutritionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserProfile = async (currentSession: Session | null) => {
    if (!currentSession || !currentSession.user) {
      setHasProfile(null);
      setLoading(false);
      return;
    }

    // Bypass database check for mock user in development
    if (currentSession.user.id === 'mock-user-id-12345') {
      setHasProfile(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
      }
      
      setHasProfile(!!data);
    } catch (err) {
      console.error('Exception checking profile:', err);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (BYPASS_AUTH) {
      setSession(MOCK_SESSION);
      checkUserProfile(MOCK_SESSION);
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        checkUserProfile(initialSession);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession) {
        // Retrieve in-memory pre-auth onboarding questionnaire results
        const pendingData = getPendingOnboarding();
        if (pendingData) {
          setLoading(true);
          try {
            // 1. Calculate nutrition metrics using biometrics
            const calculatedMetrics = calculateNutritionMetrics(pendingData);

            // Bypass database writes for mock user in development
            if (newSession.user.id === 'mock-user-id-12345') {
              await new Promise((resolve) => setTimeout(resolve, 800)); // simulate latency
              
              const classifications = classifyUserProfile(pendingData);
              const mockProfileData = { ...pendingData, ...classifications };
              if (Platform.OS === 'web') {
                window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(mockProfileData));
              } else {
                await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(mockProfileData));
              }
              
              setPendingOnboarding(null);
              setMetrics(calculatedMetrics);
              setHasProfile(true);
              setShowResults(true);
              setLoading(false);
              return;
            }

            // 2. Write all profile fields in a single write statement
            const { error: insertProfileError } = await supabase.from('user_profiles').upsert({
              id: newSession.user.id,
              sex: pendingData.sex,
              date_of_birth: pendingData.date_of_birth,
              height_cm: Math.round(pendingData.height_cm),
              weight_kg: Math.round(pendingData.weight_kg),
              activity_level: pendingData.activity_level,
              fitness_goal: pendingData.fitness_goal,
              full_name: pendingData.full_name,
              gender: pendingData.gender,
              experience_level: pendingData.experience_level,
              workout_frequency: pendingData.workout_frequency,
              preferred_workout_environment: pendingData.preferred_workout_environment,
              training_environment: pendingData.training_environment,
              home_equipment_level: pendingData.home_equipment_level,
              injuries_limitations: pendingData.injuries_limitations,
              dietary_preference: pendingData.dietary_preference
            });

            if (insertProfileError) throw insertProfileError;

            // Isolated update for classifications (robust to unmigrated schemas)
            try {
              const classifications = classifyUserProfile(pendingData);
              await supabase.from('user_profiles').update({
                classified_age_group: classifications.classified_age_group,
                classified_experience: classifications.classified_experience,
                classified_location: classifications.classified_location,
                classified_equipment: classifications.classified_equipment,
                classified_goal: classifications.classified_goal
              }).eq('id', newSession.user.id);
            } catch (classErr) {
              console.warn('Failed to update classifications in database during signup:', classErr);
            }

            // 3. Write user metrics
            const { error: insertMetricsError } = await supabase.from('user_metrics').upsert({
              id: newSession.user.id,
              bmi: calculatedMetrics.bmi,
              bmr: calculatedMetrics.bmr,
              tdee: calculatedMetrics.tdee,
              daily_calorie_goal: calculatedMetrics.daily_calorie_goal,
              protein_g: calculatedMetrics.protein_g,
              fat_g: calculatedMetrics.fat_g,
              carbs_g: calculatedMetrics.carbs_g,
            });

            if (insertMetricsError) throw insertMetricsError;

            // 4. Clear pending onboarding from memory
            setPendingOnboarding(null);

            // 5. Update state to redirect post-auth
            setMetrics(calculatedMetrics);
            setHasProfile(true);
            setShowResults(true);
          } catch (err) {
            console.error('Error saving onboarding data to database:', err);
            setHasProfile(false);
          } finally {
            setLoading(false);
          }
        } else {
          checkUserProfile(newSession);
        }
      } else {
        setHasProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
        <StatusBar style="light" />
      </View>
    );
  }

  const renderAppContent = () => (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#000000' },
          }}
        >
          {session && session.user ? (
            hasProfile ? (
              showResults && metrics ? (
                <Stack.Screen 
                  name="Results" 
                  component={ResultsScreen} 
                  initialParams={{ 
                    session, 
                    metrics, 
                    onFinish: () => setShowResults(false) 
                  }}
                />
              ) : (
                <>
                  <Stack.Screen 
                    name="Home" 
                    component={HomeRouterScreen} 
                    initialParams={{ session }}
                  />
                  <Stack.Screen 
                    name="LogWorkout" 
                    component={LogWorkoutScreen} 
                    initialParams={{ session }}
                  />
                  <Stack.Screen 
                    name="WorkoutHistory" 
                    component={WorkoutHistoryScreen} 
                    initialParams={{ session }}
                  />
                  <Stack.Screen 
                    name="LogFood" 
                    component={LogFoodScreen} 
                    initialParams={{ session }}
                  />
                  <Stack.Screen 
                    name="WorkoutDetail" 
                    component={WorkoutDetailScreen} 
                  />
                  <Stack.Screen 
                    name="MuscleDetail" 
                    component={MuscleDetailScreen} 
                  />
                  <Stack.Screen 
                    name="ExerciseDetail" 
                    component={ExerciseDetailScreen} 
                  />
                  <Stack.Screen 
                    name="StartWorkout" 
                    component={StartWorkoutScreen} 
                  />
                  <Stack.Screen 
                    name="ActiveWorkout" 
                    component={ActiveWorkoutScreen} 
                  />
                  <Stack.Screen 
                    name="AiChat" 
                    component={AiChatScreen} 
                    initialParams={{ session }}
                  />
                </>
              )
            ) : (
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen} 
                initialParams={{ session }}
              />
            )
          ) : (
            <>
              <Stack.Screen 
                name="Welcome" 
                component={WelcomeScreen} 
              />
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen} 
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );

  return renderAppContent();
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
