import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Text, useWindowDimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import LogWorkoutScreen from './src/screens/LogWorkoutScreen';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import LogFoodScreen from './src/screens/LogFoodScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import MuscleDetailScreen from './src/screens/MuscleDetailScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import { NutritionMetrics } from './src/utils/calculations';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Home: { session: Session };
  Onboarding: { session: Session; onComplete: (metrics: NutritionMetrics) => void };
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
  };
  MuscleDetail: { session: Session; muscleGroup: string };
  ExerciseDetail: { session: Session; exerciseId: string; name: string; muscleGroup: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Set to true to bypass real Supabase Auth during local development testing
const BYPASS_AUTH = __DEV__ && true;

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

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && windowWidth > 480;

  const checkUserProfile = async (currentSession: Session | null) => {
    if (!currentSession || !currentSession.user) {
      setHasProfile(null);
      setLoading(false);
      return;
    }

    // Bypass database check for mock user in development
    if (BYPASS_AUTH && currentSession.user.id === 'mock-user-id-12345') {
      if (hasProfile === null) {
        setHasProfile(false); // start on onboarding flow
      }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        if (event === 'SIGNED_IN') {
          setLoading(true);
        }
        checkUserProfile(newSession);
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
        <ActivityIndicator size="large" color="#8B5CF6" />
        <StatusBar style="light" />
      </View>
    );
  }

  const renderAppContent = () => (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
                    component={HomeScreen} 
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
                </>
              )
            ) : (
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen} 
                initialParams={{ 
                  session, 
                  onComplete: (calculatedMetrics) => {
                    setMetrics(calculatedMetrics);
                    setHasProfile(true);
                    setShowResults(true);
                  } 
                }}
              />
            )
          ) : (
            <>
              <Stack.Screen 
                name="Welcome" 
                component={WelcomeScreen} 
              />
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Floating Developer Debug Tool (only in __DEV__) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>DEV BYPASS</Text>
          <View style={styles.debugRow}>
            <TouchableOpacity 
              style={[styles.debugButton, !session && styles.debugButtonActive]} 
              onPress={() => {
                setSession(null);
                setHasProfile(null);
                setShowResults(false);
              }}
            >
              <Text style={styles.debugButtonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.debugButton, session && !hasProfile && styles.debugButtonActive]} 
              onPress={() => {
                setSession(MOCK_SESSION);
                setHasProfile(false);
                setShowResults(false);
              }}
            >
              <Text style={styles.debugButtonText}>Onboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.debugButton, session && hasProfile && showResults && styles.debugButtonActive]} 
              onPress={() => {
                setSession(MOCK_SESSION);
                setHasProfile(true);
                setMetrics(MOCK_METRICS);
                setShowResults(true);
              }}
            >
              <Text style={styles.debugButtonText}>Results</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.debugButton, session && hasProfile && !showResults && styles.debugButtonActive]} 
              onPress={() => {
                setSession(MOCK_SESSION);
                setHasProfile(true);
                setShowResults(false);
              }}
            >
              <Text style={styles.debugButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  if (isWebDesktop) {
    const basePhoneHeight = 884; // 844 + padding
    const scale = windowHeight < basePhoneHeight ? (windowHeight - 30) / basePhoneHeight : 1;
    return (
      <View style={styles.webDesktopBackground}>
        <View style={[styles.phoneMockupContainer, { transform: [{ scale }] }]}>
          <View style={styles.phoneNotchIsland} />
          <View style={styles.phoneInnerContainer}>
            {renderAppContent()}
          </View>
        </View>
      </View>
    );
  }

  return renderAppContent();
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(30, 30, 36, 0.95)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debugTitle: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 6,
  },
  debugRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  debugButton: {
    backgroundColor: '#0F0F12',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2D37',
  },
  debugButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  webDesktopBackground: {
    flex: 1,
    backgroundColor: '#111015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneMockupContainer: {
    width: 390,
    height: 844,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: '#1E1E24',
    backgroundColor: '#121212',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  phoneNotchIsland: {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: [{ translateX: -50 }],
    width: 100,
    height: 18,
    backgroundColor: '#1E1E24',
    borderRadius: 9,
    zIndex: 99999,
  },
  phoneInnerContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
