import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  Image,
  Modal,
  Switch
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise, isExerciseMatch } from '../utils/calculations';
import { MOCK_EXERCISES, getLocalEquipmentRequiredTag } from '../data/exercisesData';
import { getLocalCustomExercises } from '../utils/customExercises';
import { Routine, getLocalRoutines, deleteLocalRoutine, renameLocalRoutine } from '../utils/customRoutines';
import * as SecureStore from 'expo-secure-store';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { getProgramDayDetails, autoAdvanceProgramDay, getExercisesForFocus, WEEKDAYS, selectExercisesForMuscle } from '../utils/program';
import { getUserClass, getExercisesForClass } from '../utils/exerciseLibrary';


type StartWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'StartWorkout'>;

const MUSCLE_IMAGES: { [key: string]: any } = {
  Chest: require('../../assets/images/muscles/chest.png'),
  Back: require('../../assets/images/muscles/back.png'),
  Shoulders: require('../../assets/images/muscles/shoulders.png'),
  Biceps: require('../../assets/images/muscles/biceps.png'),
  Triceps: require('../../assets/images/muscles/triceps.png'),
  Legs: require('../../assets/images/muscles/legs.png'),
  Abs: require('../../assets/images/muscles/abs.png'),
  Forearms: require('../../assets/images/muscles/forearms.png'),
  Glutes: require('../../assets/images/muscles/glutes.png'),
  Calves: require('../../assets/images/muscles/calves.png'),
};

const MUSCLE_GROUPS = [
  { key: 'Chest', label: 'Chest', icon: '💪' },
  { key: 'Back', label: 'Back', icon: '🦅' },
  { key: 'Shoulders', label: 'Shoulders', icon: '🔱' },
  { key: 'Biceps', label: 'Biceps', icon: '🔥' },
  { key: 'Triceps', label: 'Triceps', icon: '⚡' },
  { key: 'Legs', label: 'Legs', icon: '🦵' },
  { key: 'Abs', label: 'Abs', icon: '🧱' },
  { key: 'Forearms', label: 'Forearms', icon: '✊' },
];

export default function StartWorkoutScreen() {
  const route = useRoute<StartWorkoutScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = route.params.session;
  const user = session.user;

  const [loading, setLoading] = useState(true);
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [activeTab, setActiveTab] = useState<'muscle' | 'custom' | 'program'>('muscle');
  const [profile, setProfile] = useState<any>(null);
  
  // Muscle Group selection states
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(route.params?.initialMuscleGroup || null);
  
  // Custom selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomIds, setSelectedCustomIds] = useState<Set<string>>(new Set());

  // Smart suggestions states
  const [progressionSuggestions, setProgressionSuggestions] = useState<{ [key: string]: string }>({});

  // Routines state hooks
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [customMode, setCustomMode] = useState<'routines' | 'builder'>('routines');

  // Program setup and tracking states
  const [setupFrequency, setSetupFrequency] = useState<number>(4);
  const [setupDays, setSetupDays] = useState<string[]>(['Mon', 'Tue', 'Thu', 'Fri']);
  const [savingProgram, setSavingProgram] = useState(false);
  const [todayExercises, setTodayExercises] = useState<Exercise[]>([]);

  const checkAndAdvanceProgram = async (currentProfile: any) => {
    if (!currentProfile || !currentProfile.program_day || currentProfile.program_day === 0) return;

    const newDay = autoAdvanceProgramDay(currentProfile);
    if (newDay !== currentProfile.program_day) {
      if (user.id === 'mock-user-id-12345') {
        try {
          const cached = Platform.OS === 'web'
            ? window.localStorage.getItem('govio_pending_onboarding')
            : await SecureStore.getItemAsync('govio_pending_onboarding');
          let localProfile = cached ? JSON.parse(cached) : {};
          localProfile.program_day = newDay;
          if (Platform.OS === 'web') {
            window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(localProfile));
          } else {
            await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(localProfile));
          }
          setProfile(localProfile);
        } catch (e) {
          console.error('Error advancing program locally:', e);
        }
      } else {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update({ program_day: newDay })
            .eq('id', user.id);
          if (!error) {
            setProfile((prev: any) => ({ ...prev, program_day: newDay }));
          }
        } catch (e) {
          console.error('Error advancing program in Supabase:', e);
        }
      }
    }
  };

  useEffect(() => {
    if (profile && profile.program_day > 0 && exercisesList.length > 0) {
      const dayDetails = getProgramDayDetails(profile.program_day, profile);
      if (dayDetails && !dayDetails.isRest && dayDetails.focus) {
        const exercises = getExercisesForFocus(dayDetails.focus, exercisesList, profile, profile.program_day);
        setTodayExercises(exercises);
      }
    }
  }, [profile, exercisesList]);

  const handleGenerateProgram = async () => {
    if (setupDays.length !== setupFrequency) {
      Alert.alert('Invalid Selection', `Please select exactly ${setupFrequency} training days.`);
      return;
    }

    setSavingProgram(true);
    const newProgramState = {
      training_days_per_week: setupFrequency,
      training_days: setupDays,
      program_day: 1,
      program_start_date: new Date().toISOString().split('T')[0],
      program_workouts_completed: 0
    };

    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        let localProfile = cached ? JSON.parse(cached) : {};
        localProfile = { ...localProfile, ...newProgramState };
        
        if (Platform.OS === 'web') {
          window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(localProfile));
        } else {
          await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(localProfile));
        }
        
        setProfile(localProfile);
        Alert.alert('Success', '100-Day workout program generated successfully!');
      } catch (err) {
        console.error('Error generating mock program:', err);
        Alert.alert('Error', 'Failed to generate program.');
      } finally {
        setSavingProgram(false);
      }
    } else {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update(newProgramState)
          .eq('id', user.id);

        if (error) throw error;

        setProfile((prev: any) => ({ ...prev, ...newProgramState }));
        Alert.alert('Success', '100-Day workout program generated successfully!');
      } catch (err: any) {
        console.error('Error generating program in Supabase:', err);
        Alert.alert('Error', err.message || 'Failed to generate program.');
      } finally {
        setSavingProgram(false);
      }
    }
  };

  const handleStartProgramSession = () => {
    if (todayExercises.length === 0) {
      Alert.alert('No Exercises', 'No exercises available for this session.');
      return;
    }
    const dayDetails = getProgramDayDetails(profile.program_day, profile);
    navigation.navigate('ActiveWorkout', {
      session,
      exercises: todayExercises,
      workoutName: `Day ${profile.program_day}: ${dayDetails.focus} Day`,
      programDay: profile.program_day
    });
  };

  const handleResetProgram = async () => {
    const resetState = {
      training_days_per_week: null,
      training_days: null,
      program_day: 0,
      program_start_date: null,
      program_workouts_completed: 0
    };

    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        let localProfile = cached ? JSON.parse(cached) : {};
        localProfile = { ...localProfile, ...resetState };
        
        if (Platform.OS === 'web') {
          window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(localProfile));
        } else {
          await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(localProfile));
        }
        
        setProfile(localProfile);
      } catch (err) {
        console.error('Error resetting mock program:', err);
      }
    } else {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update(resetState)
          .eq('id', user.id);

        if (error) throw error;
        setProfile((prev: any) => ({ ...prev, ...resetState }));
      } catch (err: any) {
        console.error('Error resetting program:', err);
        Alert.alert('Error', err.message || 'Failed to reset program.');
      }
    }
  };

  const getWeeklyCalendar = (currentDayNum: number, currentProfile: any) => {
    const startDateStr = currentProfile.program_start_date;
    if (!startDateStr) return [];
    
    const currentDayDetails = getProgramDayDetails(currentDayNum, currentProfile);
    const currentDate = new Date(currentDayDetails.dateStr);
    
    let dayIndex = currentDate.getDay();
    if (dayIndex === 0) dayIndex = 7;
    const diffToMon = 1 - dayIndex;
    
    const mondayDate = new Date(currentDate);
    mondayDate.setDate(currentDate.getDate() + diffToMon);
    
    const weekDaysList = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      
      const diffMs = d.getTime() - new Date(startDateStr).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const dayNum = diffDays + 1;
      
      let details = null;
      if (dayNum >= 1 && dayNum <= 100) {
        details = getProgramDayDetails(dayNum, currentProfile);
      }
      
      weekDaysList.push({
        dayNumber: dayNum,
        dateStr: dStr,
        weekday: WEEKDAYS[i],
        details
      });
    }
    return weekDaysList;
  };

  const renderProgramTab = () => {
    if (!profile || !profile.program_day || profile.program_day === 0) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.setupCard}>
            <Text style={styles.programSetupTitle}>Start 100-Day Program</Text>
            <Text style={styles.programSetupSubtitle}>
              Commit to a structured, 100-day progressive program customized to your experience level. Choose your weekly training frequency and days below.
            </Text>
            
            <Text style={styles.fieldLabel}>How many days a week do you want to train?</Text>
            <View style={styles.freqRow}>
              {[3, 4, 5, 6].map((freq) => {
                const isSelected = setupFrequency === freq;
                return (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqButton,
                      isSelected && styles.freqButtonSelected
                    ]}
                    onPress={() => {
                      setSetupFrequency(freq);
                      if (freq === 3) setSetupDays(['Mon', 'Wed', 'Fri']);
                      else if (freq === 4) setSetupDays(['Mon', 'Tue', 'Thu', 'Fri']);
                      else if (freq === 5) setSetupDays(['Mon', 'Tue', 'Thu', 'Fri', 'Sat']);
                      else if (freq === 6) setSetupDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.freqButtonText,
                      isSelected && styles.freqButtonTextSelected
                    ]}>
                      {freq} Days/Wk
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Select your preferred training weekdays:</Text>
            <Text style={styles.fieldSublabel}>Choose exactly {setupFrequency} days</Text>
            <View style={styles.daysRow}>
              {WEEKDAYS.map((day) => {
                const isSelected = setupDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected
                    ]}
                    onPress={() => {
                      if (setupDays.includes(day)) {
                        setSetupDays(prev => prev.filter(d => d !== day));
                      } else {
                        if (setupDays.length >= setupFrequency) {
                          setSetupDays(prev => [...prev.slice(1), day]);
                        } else {
                          setSetupDays(prev => [...prev, day]);
                        }
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.dayCircleText,
                      isSelected && styles.dayCircleTextSelected
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.generateBtn,
                setupDays.length !== setupFrequency && styles.generateBtnDisabled
              ]}
              onPress={handleGenerateProgram}
              disabled={savingProgram || setupDays.length !== setupFrequency}
              activeOpacity={0.8}
            >
              {savingProgram ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.generateBtnText}>GENERATE 100-DAY PROGRAM ⚡</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (profile.program_day > 100) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.congratsContainer}>
            <Text style={styles.congratsEmoji}>🏆</Text>
            <Text style={styles.congratsTitle}>CONGRATULATIONS!</Text>
            <Text style={styles.congratsSubtitle}>
              You have completed the entire 100-Day workout program!
            </Text>
            <Text style={styles.congratsText}>
              Your consistency and dedication have paid off. You can restart the program to begin a new cycle with a different split or frequency.
            </Text>
            <TouchableOpacity style={styles.generateBtn} onPress={handleResetProgram} activeOpacity={0.8}>
              <Text style={styles.generateBtnText}>START A NEW PROGRAM 🔁</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    const dayDetails = getProgramDayDetails(profile.program_day, profile);
    const weeklyCalendar = getWeeklyCalendar(profile.program_day, profile);

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Current Day Header */}
        <View style={styles.programCard}>
          <Text style={styles.programDaySub}>DAY {profile.program_day} OF 100</Text>
          <Text style={styles.programFocusTitle}>
            {dayDetails.isRest ? 'Rest Day' : `${dayDetails.focus} Day`}
          </Text>
          <Text style={styles.programDateLabel}>
            Scheduled for {dayDetails.weekday} • {new Date(dayDetails.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Weekly schedule layout */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        <View style={styles.weeklyCalendarRow}>
          {weeklyCalendar.map((wDay) => {
            const isToday = wDay.dateStr === new Date().toISOString().split('T')[0];
            const isActive = wDay.dayNumber === profile.program_day;
            const isRestDay = wDay.details?.isRest;
            
            return (
              <View 
                key={wDay.dateStr} 
                style={[
                  styles.calendarCol,
                  isActive && styles.calendarColActive,
                  isToday && styles.calendarColToday
                ]}
              >
                <Text style={[styles.calendarWeekdayText, isActive && styles.calendarWeekdayActiveText]}>
                  {wDay.weekday}
                </Text>
                <Text style={[styles.calendarDateText, isActive && styles.calendarDateActiveText]}>
                  {new Date(wDay.dateStr).getDate()}
                </Text>
                
                {wDay.dayNumber >= 1 && wDay.dayNumber <= 100 ? (
                  <View style={[
                    styles.calendarBadge,
                    isRestDay ? styles.calendarBadgeRest : styles.calendarBadgeWork,
                    isActive && styles.calendarBadgeActive
                  ]}>
                    <Text style={[
                      styles.calendarBadgeText,
                      isRestDay ? styles.calendarBadgeRestText : styles.calendarBadgeWorkText,
                      isActive && styles.calendarBadgeActiveText
                    ]} numberOfLines={1}>
                      {isRestDay ? 'Rest' : wDay.details?.focus}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.calendarEmptyText}>-</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Exercises or Rest View */}
        {dayDetails.isRest ? (
          <View style={styles.restContainer}>
            <View style={styles.restIconContainer}>
              <Text style={styles.restIcon}>🔋</Text>
            </View>
            <Text style={styles.restTitle}>Recovery Phase Active</Text>
            <Text style={styles.restDescription}>
              Rest days are when your body actually builds muscle. Prioritize sleep, hydration, and nutrition today.
            </Text>
            <View style={styles.recoveryTipBox}>
              <Text style={styles.tipLabel}>💡 RECOVERY TIPS:</Text>
              <Text style={styles.tipText}>• Aim for 8+ hours of quality sleep</Text>
              <Text style={styles.tipText}>• Drink 3-4 liters of water to stay hydrated</Text>
              <Text style={styles.tipText}>• Keep hitting your daily protein targets</Text>
            </View>
            <TouchableOpacity
              style={styles.optionalSessionBtn}
              onPress={() => {
                setActiveTab('muscle');
                Alert.alert('Rest Day Active', 'Redirected to Muscle Split. You can do an ad-hoc session if you feel fully recovered.');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.optionalSessionBtnText}>Do Ad-Hoc Workout Instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workoutContainer}>
            <Text style={styles.sectionTitle}>Today's Exercises</Text>
            {todayExercises.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises matching your equipment settings were found for this muscle focus.</Text>
              </View>
            ) : (
              todayExercises.map((ex, idx) => (
                <View key={ex.id} style={styles.programExerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <View style={styles.exerciseIdxContainer}>
                      <Text style={styles.exerciseIdx}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.exerciseNameText}>{ex.name}</Text>
                      <Text style={styles.exerciseMuscleText}>{ex.muscle_group} • {ex.equipment_required || 'Bodyweight'}</Text>
                    </View>
                  </View>
                  <View style={styles.exerciseCardSetsRow}>
                    <Text style={styles.setsInfoText}>4 Sets x 10-12 Reps</Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('ExerciseDetail', { session, exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscle_group })}
                    >
                      <Text style={styles.viewDetailLink}>View Guide →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            <TouchableOpacity style={styles.startProgramSessionBtn} onPress={handleStartProgramSession} activeOpacity={0.8}>
              <Text style={styles.startProgramSessionBtnText}>START TODAY'S SESSION 🏋️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset program option */}
        <TouchableOpacity
          style={styles.resetProgramBtn}
          onPress={() => {
            Alert.alert(
              'Restart Program',
              'Are you sure you want to restart your 100-Day Workout Program? This will reset your progress to Day 1.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Restart',
                  style: 'destructive',
                  onPress: () => handleResetProgram()
                }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.resetProgramBtnText}>Restart 100-Day Program</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const [renameRoutine, setRenameRoutine] = useState<Routine | null>(null);
  const [renameInputText, setRenameInputText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const calculateProgressionSuggestions = (workoutsList: any[]) => {
    const suggestions: { [key: string]: string } = {};
    const exerciseHistory: { [key: string]: Array<{ date: string; maxWeight: number }> } = {};

    workoutsList.forEach((w) => {
      const sets = w.workout_sets || w.sets || [];
      sets.forEach((set: any) => {
        const exId = set.exercises?.id || set.exercise_id;
        const weight = parseFloat(set.weight_kg) || 0;
        if (!exId || weight === 0) return;

        if (!exerciseHistory[exId]) {
          exerciseHistory[exId] = [];
        }

        let sessionEntry = exerciseHistory[exId].find((e) => e.date === w.date);
        if (!sessionEntry) {
          sessionEntry = { date: w.date, maxWeight: weight };
          exerciseHistory[exId].push(sessionEntry);
        } else {
          sessionEntry.maxWeight = Math.max(sessionEntry.maxWeight, weight);
        }
      });
    });

    Object.keys(exerciseHistory).forEach((exId) => {
      const history = exerciseHistory[exId];
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (history.length >= 2) {
        const last1 = history[0].maxWeight;
        const last2 = history[1].maxWeight;
        const last3 = history[2]?.maxWeight;

        const isStagnant = last3 !== undefined 
          ? (last1 === last2 && last2 === last3) 
          : (last1 === last2);

        if (isStagnant) {
          suggestions[exId] = `Try 2.5kg more this time!`;
        }
      }
    });

    return suggestions;
  };

  const fetchExercises = async () => {
    let activeProfile: any = null;
    
    // Fetch profile
    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        if (cached) {
          activeProfile = JSON.parse(cached);
        } else {
          activeProfile = { training_environment: 'home', home_equipment_level: 'some' };
        }
      } catch (e) {
        console.error(e);
        activeProfile = { training_environment: 'home', home_equipment_level: 'some' };
      }
    } else {
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData && !profileErr) {
          activeProfile = profileData;
        }
      } catch (err) {
        console.error('Error fetching profile in StartWorkoutScreen:', err);
      }
    }

    // Auto-initialize program if user has completed onboarding with training schedule
    // but program was never formally started (program_day is 0 or missing).
    if (
      activeProfile &&
      activeProfile.training_days_per_week &&
      activeProfile.training_days &&
      (!activeProfile.program_day || activeProfile.program_day === 0)
    ) {
      const todayStr = new Date().toISOString().split('T')[0];
      const initState = {
        program_day: 1,
        program_start_date: todayStr,
        program_workouts_completed: 0,
      };
      activeProfile = { ...activeProfile, ...initState };

      // Persist
      if (user.id === 'mock-user-id-12345') {
        try {
          if (Platform.OS === 'web') {
            window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(activeProfile));
          } else {
            await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(activeProfile));
          }
        } catch (e) {
          console.error('Error auto-initializing program locally:', e);
        }
      } else {
        try {
          await supabase.from('user_profiles').update(initState).eq('id', user.id);
        } catch (e) {
          console.error('Error auto-initializing program in Supabase:', e);
        }
      }
    }

    setProfile(activeProfile);
    if (activeProfile) {
      checkAndAdvanceProgram(activeProfile);
    }

    let rawList: any[] = [];
    if (user.id === 'mock-user-id-12345') {
      const customs = await getLocalCustomExercises();
      rawList = [...MOCK_EXERCISES, ...customs];
      
      try {
        const localData = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_workouts')
          : await SecureStore.getItemAsync('govio_workouts');
        const workoutsList = localData ? JSON.parse(localData) : [];
        const suggestions = calculateProgressionSuggestions(workoutsList);
        setProgressionSuggestions(suggestions);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        rawList = (data || []).map((ex: any) => ({
          ...ex,
          equipment_required: ex.equipment_required || getLocalEquipmentRequiredTag(ex.name)
        }));

        // Fetch real user workouts for progression suggestions
        const { data: workoutsData, error: workoutsErr } = await supabase
          .from('workouts')
          .select(`
            id,
            date,
            workout_sets (
              exercise_id,
              reps,
              weight_kg
            )
          `)
          .eq('user_id', user.id);
        
        if (!workoutsErr && workoutsData) {
          const suggestions = calculateProgressionSuggestions(workoutsData);
          setProgressionSuggestions(suggestions);
        }
      } catch (err) {
        console.error('Error fetching exercises:', err);
        const customs = await getLocalCustomExercises();
        rawList = [...MOCK_EXERCISES, ...customs];
      }
    }

    // Filter exercises dynamically based on User Class library
    const userClass = getUserClass(activeProfile);
    const classExercises = getExercisesForClass(userClass, rawList, activeProfile);
    setExercisesList(classExercises);
    setLoading(false);
  };

  const fetchRoutines = async () => {
    if (user.id === 'mock-user-id-12345') {
      const localRouts = await getLocalRoutines();
      setRoutines(localRouts);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      console.error('Error fetching routines:', err);
      const localRouts = await getLocalRoutines();
      setRoutines(localRouts);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchExercises();
      fetchRoutines();
    }, [])
  );

  const handleStartRoutine = (routine: Routine) => {
    const selectedExercises = routine.exercise_ids
      .map(id => exercisesList.find(ex => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);

    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises Found', 'The exercises in this routine could not be found.');
      return;
    }

    navigation.navigate('ActiveWorkout', {
      session,
      exercises: selectedExercises,
      workoutName: routine.name,
    });
  };

  const handleLongPressRoutine = (routine: Routine) => {
    Alert.alert(
      routine.name,
      'Select an action:',
      [
        {
          text: 'Rename',
          onPress: () => {
            setRenameRoutine(routine);
            setRenameInputText(routine.name);
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteRoutine(routine)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const confirmDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user.id === 'mock-user-id-12345') {
                await deleteLocalRoutine(routine.id);
                fetchRoutines();
              } else {
                const { error } = await supabase
                  .from('routines')
                  .delete()
                  .eq('id', routine.id);
                if (error) throw error;
                fetchRoutines();
              }
              Alert.alert('Success', 'Routine deleted successfully.');
            } catch (err: any) {
              console.error('Error deleting routine:', err);
              Alert.alert('Error', err.message || 'Failed to delete routine.');
            }
          }
        }
      ]
    );
  };

  const handleSaveRenameRoutine = async () => {
    if (!renameRoutine) return;
    if (!renameInputText.trim()) {
      Alert.alert('Error', 'Please enter a routine name.');
      return;
    }

    setIsRenaming(true);
    try {
      if (user.id === 'mock-user-id-12345') {
        await renameLocalRoutine(renameRoutine.id, renameInputText.trim());
        fetchRoutines();
        setRenameRoutine(null);
        setRenameInputText('');
      } else {
        const { error } = await supabase
          .from('routines')
          .update({ name: renameInputText.trim() })
          .eq('id', renameRoutine.id);

        if (error) throw error;
        fetchRoutines();
        setRenameRoutine(null);
        setRenameInputText('');
      }
    } catch (err: any) {
      console.error('Error renaming routine:', err);
      Alert.alert('Error', err.message || 'Failed to rename routine.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleStartWorkout = () => {
    let selectedExercises: Exercise[] = [];
    let workoutName = '';

    if (activeTab === 'muscle') {
      if (!selectedMuscle) {
        Alert.alert('Selection Required', 'Please select a target muscle group.');
        return;
      }
      
      const cat = selectedMuscle.toLowerCase();
      const env = profile?.training_environment;
      const level = profile?.home_equipment_level;
      
      const getSelectedFiltered = (applyFilter: boolean) => {
        return exercisesList.filter((ex) => {
          if (applyFilter && !isExerciseMatch(ex, env, level)) return false;

          const muscle = ex.muscle_group.toLowerCase();
          if (cat === 'chest') return muscle === 'chest';
          if (cat === 'back') return muscle === 'back';
          if (cat === 'shoulders') return muscle === 'shoulders';
          if (cat === 'legs') return muscle === 'legs';
          if (cat === 'biceps') return muscle === 'biceps';
          if (cat === 'triceps') return muscle === 'triceps';
          if (cat === 'forearms') return muscle === 'forearms';
          if (cat === 'abs') return muscle === 'abs' || muscle === 'core';
          return muscle === cat;
        });
      };

      let filtered = getSelectedFiltered(true);
      if (filtered.length < 2) {
        const unfiltered = getSelectedFiltered(false);
        if (unfiltered.length > 0) {
          filtered = unfiltered;
        }
      }

      const workoutsCount = (profile?.program_workouts_completed || 0) + 1;
      selectedExercises = selectExercisesForMuscle(selectedMuscle, filtered, profile || {}, workoutsCount);

      workoutName = `${selectedMuscle} Split`;
    } else {
      if (selectedCustomIds.size === 0) {
        Alert.alert('Selection Required', 'Please select at least one exercise.');
        return;
      }
      selectedExercises = exercisesList.filter((ex) => selectedCustomIds.has(ex.id));
      workoutName = 'Custom Split';
    }

    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises Found', 'There are no exercises available for the selected routines.');
      return;
    }

    navigation.navigate('ActiveWorkout', {
      session,
      exercises: selectedExercises,
      workoutName,
    });
  };

  const toggleSelectExercise = (id: string) => {
    setSelectedCustomIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredExercises = (() => {
    const filtered = exercisesList.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const env = profile?.training_environment;
      const level = profile?.home_equipment_level;
      return isExerciseMatch(e, env, level);
    });
    const matchesSearchOnly = exercisesList.filter((e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length < 2 && matchesSearchOnly.length > 0) {
      return matchesSearchOnly;
    }
    return filtered;
  })();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Start Session</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'muscle' && styles.tabActive]}
          onPress={() => setActiveTab('muscle')}
        >
          <Text style={[styles.tabText, activeTab === 'muscle' && styles.tabTextActive]}>
            Muscle Split
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'custom' && styles.tabActive]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
            Custom Routine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'program' && styles.tabActive]}
          onPress={() => setActiveTab('program')}
        >
          <Text style={[styles.tabText, activeTab === 'program' && styles.tabTextActive]}>
            100-Day Program
          </Text>
        </TouchableOpacity>
      </View>


      {activeTab === 'muscle' && (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>Select Muscle Target</Text>
          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map((m) => {
              const isSelected = selectedMuscle === m.key;
              const imageSource = MUSCLE_IMAGES[m.key];
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.muscleCard, isSelected && styles.muscleCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedMuscle(m.key)}
                >
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      style={styles.muscleImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.muscleFallbackContainer}>
                      <Text style={styles.muscleIcon}>{m.icon}</Text>
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

                  <Text style={[styles.muscleLabel, isSelected && styles.muscleLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {activeTab === 'custom' && (
        <View style={{ flex: 1 }}>
          {customMode === 'routines' ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={() => (
                  <TouchableOpacity
                    style={styles.buildWorkoutBtn}
                    onPress={() => setCustomMode('builder')}
                  >
                    <Text style={styles.buildWorkoutBtnText}>➕ BUILD ONE-OFF WORKOUT</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyRoutinesContainer}>
                    <Text style={styles.emptyRoutinesIcon}>📋</Text>
                    <Text style={styles.emptyRoutinesTitle}>No Saved Routines Yet</Text>
                    <Text style={styles.emptyRoutinesSubtext}>
                      Complete a workout session and select "Save as Routine" to turn it into a repeatable template.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyRoutinesBtn}
                      onPress={() => setCustomMode('builder')}
                    >
                      <Text style={styles.emptyRoutinesBtnText}>Create Custom Workout</Text>
                    </TouchableOpacity>
                  </View>
                )}
                renderItem={({ item }) => {
                  const exerciseNames = item.exercise_ids
                    .map((id) => exercisesList.find((ex) => ex.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <TouchableOpacity
                      style={styles.routineCard}
                      onPress={() => handleStartRoutine(item)}
                      onLongPress={() => handleLongPressRoutine(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.routineCardHeader}>
                        <Text style={styles.routineCardName}>{item.name}</Text>
                        <Text style={styles.routineCardCount}>
                          {item.exercise_ids.length} {item.exercise_ids.length === 1 ? 'Exercise' : 'Exercises'}
                        </Text>
                      </View>
                      <Text style={styles.routineCardExercises} numberOfLines={2}>
                        {exerciseNames || 'No exercises'}
                      </Text>
                      <Text style={styles.routineCardHint}>Press to start • Long press to manage</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.backToRoutinesBtn}
                onPress={() => {
                  setCustomMode('routines');
                  setSelectedCustomIds(new Set());
                }}
              >
                <Text style={styles.backToRoutinesBtnText}>← Back to Saved Routines</Text>
              </TouchableOpacity>
              
              <View style={styles.searchBarContainer}>
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search exercises..."
                  placeholderTextColor="#7A7A7A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => {
                  const isChecked = selectedCustomIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.exRow, isChecked && styles.exRowChecked]}
                      onPress={() => toggleSelectExercise(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exName}>{item.name}</Text>
                        <Text style={styles.exMuscle}>
                          {item.muscle_group} • {item.equipment_required || 'Bodyweight'}
                        </Text>
                        {progressionSuggestions[item.id] && (
                          <View style={styles.suggestionPill}>
                            <Text style={styles.suggestionText}>
                              📈 {progressionSuggestions[item.id]}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </View>
      )}

      {activeTab === 'program' && renderProgramTab()}

      {/* Start Button */}
      {(activeTab === 'muscle' || (activeTab === 'custom' && customMode === 'builder')) && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>START WORKOUT SESSION 🏋️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Rename Routine Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={renameRoutine !== null}
        onRequestClose={() => setRenameRoutine(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 280 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RENAME ROUTINE</Text>
              <TouchableOpacity onPress={() => setRenameRoutine(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                ROUTINE NAME
              </Text>
              <TextInput
                style={[styles.modalSearchInput, { paddingVertical: 12, marginBottom: 20 }]}
                placeholder="Enter routine name..."
                placeholderTextColor="#6B7280"
                value={renameInputText}
                onChangeText={setRenameInputText}
              />
              <TouchableOpacity
                style={[styles.startBtn, { marginBottom: 0, backgroundColor: '#D4FF13' }]}
                onPress={handleSaveRenameRoutine}
                disabled={isRenaming}
              >
                {isRenaming ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.startBtnText}>RENAME ROUTINE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4FF13',
  },
  tabText: {
    color: '#7A7A7A',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#D4FF13',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleCard: {
    width: '48%',
    height: 120,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    justifyContent: 'flex-end',
  },
  muscleCardSelected: {
    borderColor: '#D4FF13',
    borderWidth: 2,
  },
  muscleImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  muscleIcon: {
    fontSize: 24,
  },
  muscleFallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  muscleLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    margin: 12,
    zIndex: 10,
  },
  muscleLabelSelected: {
    color: '#D4FF13',
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#222222',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exRowChecked: {
    borderColor: '#D4FF13',
  },
  exName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  exMuscle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#7A7A7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#D4FF13',
    backgroundColor: '#D4FF13',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#222222',
  },
  startBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  suggestionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 255, 19, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 19, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  suggestionText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
  },
  buildWorkoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  buildWorkoutBtnText: {
    color: '#D4FF13',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backToRoutinesBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
    marginBottom: 10,
  },
  backToRoutinesBtnText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
  },
  routineCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  routineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  routineCardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  routineCardCount: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  routineCardExercises: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  routineCardHint: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyRoutinesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyRoutinesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyRoutinesTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyRoutinesSubtext: {
    color: '#A0A0A0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyRoutinesBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoutinesBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222222',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalCloseText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSearchInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  setupCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  programSetupTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    fontFamily: 'Outfit',
    letterSpacing: 0.5,
  },
  programSetupSubtitle: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldSublabel: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: -8,
    marginBottom: 12,
  },
  freqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  freqButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    borderRadius: 30,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  freqButtonSelected: {
    backgroundColor: '#D4FF13',
    borderColor: '#D4FF13',
  },
  freqButtonText: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '800',
  },
  freqButtonTextSelected: {
    color: '#000000',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.15)',
  },
  dayCircleText: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
  },
  dayCircleTextSelected: {
    color: '#D4FF13',
  },
  generateBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  generateBtnDisabled: {
    backgroundColor: '#333A44',
  },
  generateBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  programCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  programDaySub: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  programFocusTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Outfit',
    marginBottom: 6,
  },
  programDateLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
  },
  weeklyCalendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 20,
    padding: 12,
    marginBottom: 24,
  },
  calendarCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  calendarColActive: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
  },
  calendarColToday: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarWeekdayText: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calendarWeekdayActiveText: {
    color: '#D4FF13',
  },
  calendarDateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  calendarDateActiveText: {
    color: '#D4FF13',
  },
  calendarBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    width: '90%',
  },
  calendarBadgeRest: {
    backgroundColor: '#2A2A2A',
  },
  calendarBadgeWork: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 19, 0.3)',
  },
  calendarBadgeActive: {
    backgroundColor: '#D4FF13',
    borderColor: '#D4FF13',
  },
  calendarBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarBadgeRestText: {
    color: '#7A7A7A',
  },
  calendarBadgeWorkText: {
    color: '#D4FF13',
  },
  calendarBadgeActiveText: {
    color: '#000000',
  },
  calendarEmptyText: {
    color: '#444444',
    fontSize: 10,
  },
  activeDot: {
    color: '#D4FF13',
    fontSize: 10,
    position: 'absolute',
    bottom: 2,
  },
  restContainer: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  restIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  restIcon: {
    fontSize: 32,
  },
  restTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  restDescription: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  recoveryTipBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  tipLabel: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  tipText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  optionalSessionBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#444444',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  optionalSessionBtnText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '800',
  },
  workoutContainer: {
    marginBottom: 20,
  },
  programExerciseCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIdxContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIdx: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '900',
  },
  exerciseNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseMuscleText: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  exerciseCardSetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingTop: 12,
  },
  setsInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewDetailLink: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '800',
  },
  startProgramSessionBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startProgramSessionBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetProgramBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  resetProgramBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  congratsContainer: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  congratsEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  congratsTitle: {
    color: '#D4FF13',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  congratsSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  congratsText: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

