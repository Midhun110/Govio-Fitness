import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  FlatList
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';
import { triggerLightHaptic, triggerSuccessHaptic } from '../utils/haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getLocalCustomExercises } from '../utils/customExercises';
import { addLocalRoutine } from '../utils/customRoutines';
import { MOCK_WORKOUTS } from './HomeScreen';
import * as SecureStore from 'expo-secure-store';

type ActiveWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveWorkout'>;

interface LoggedSet {
  set_number: number;
  reps: string;
  weight_kg: string;
  isWeightPR?: boolean;
  isRepsPR?: boolean;
  isVolumePR?: boolean;
  set_type?: 'Normal' | 'Warmup' | 'Drop Set' | 'Failure';
}

interface ActiveExerciseState {
  exercise: Exercise;
  sets: LoggedSet[];
  inputWeight: string;
  inputReps: string;
  historyLoaded?: boolean;
  lastPerformance?: LoggedSet[];
  historicalMaxWeight?: number;
  historicalMaxReps?: number;
  historicalMaxVolume?: number;
  notes?: string;
  isSuperset?: boolean;
  supersetWithNext?: boolean;
  restTimeSeconds?: number;
  progressionHint?: string;
}

export default function ActiveWorkoutScreen() {
  const route = useRoute<ActiveWorkoutScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, exercises: initialExercises, workoutName: initialWorkoutName, resumeDraft, programDay } = route.params;
  const user = session.user;


  // Active workout states
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseState[]>([]);
  const [dbWorkoutId, setDbWorkoutId] = useState<string | null>(route.params?.workoutId || null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [localWorkoutName, setLocalWorkoutName] = useState(initialWorkoutName || 'Active Session');
  const [showSaveRoutineModal, setShowSaveRoutineModal] = useState(false);
  const [routineName, setRoutineName] = useState(initialWorkoutName || '');
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Set-type tagging state
  const [selectedSetType, setSelectedSetType] = useState<'Normal' | 'Warmup' | 'Drop Set' | 'Failure'>('Normal');

  // Add Exercise & Superset state hooks
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [supersetToggle, setSupersetToggle] = useState(false);
  const [allExercisesList, setAllExercisesList] = useState<Exercise[]>([]);
  const [pendingSupersetStartIdx, setPendingSupersetStartIdx] = useState<number | null>(null);

  const fetchAllExercises = async () => {
    try {
      const customs = await getLocalCustomExercises();
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setAllExercisesList([...data, ...customs]);
      } else {
        const { MOCK_EXERCISES } = require('../data/exercisesData');
        setAllExercisesList([...MOCK_EXERCISES, ...customs]);
      }
    } catch (e) {
      try {
        const { MOCK_EXERCISES } = require('../data/exercisesData');
        setAllExercisesList(MOCK_EXERCISES || []);
      } catch (err) {
        console.error('Failed to load MOCK_EXERCISES', err);
      }
    }
  };

  // Active Workout Stopwatch states
  const [elapsedTime, setElapsedTime] = useState(0);
  const stopwatchIntervalRef = useRef<any>(null);

  // Rest Timer States (using our robust, single-interval countdown approach)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  
  // Quick Guide Modal State
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Sharing states and refs
  const shareViewRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  // PR celebration animation
  const prScaleAnim = useRef(new Animated.Value(1)).current;
  const prGlowAnim = useRef(new Animated.Value(0)).current;

  const triggerPRAnimation = () => {
    prScaleAnim.setValue(0.5);
    prGlowAnim.setValue(0);
    Animated.parallel([
      Animated.spring(prScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(prGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(prGlowAnim, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Celebration animations states
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(Array.from({ length: 8 }).map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (showSummary) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        ...confettiAnims.map((anim, idx) => {
          const angle = idx * (2 * Math.PI / 8);
          const distance = 85;
          const destX = Math.cos(angle) * distance;
          const destY = Math.sin(angle) * distance;

          return Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
              Animated.timing(anim.x, {
                toValue: destX,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(anim.y, {
                toValue: destY,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            })
          ]);
        })
      ]).start();
    } else {
      scaleValue.setValue(0);
      fadeValue.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.scale.setValue(0);
        anim.opacity.setValue(0);
      });
    }
  }, [showSummary]);

  const saveDraftWorkout = async (currentExercises: ActiveExerciseState[], currentElapsed: number, currentExerciseIdx: number) => {
    if (saving || showSummary || loading) return;
    try {
      const draft = {
        activeExercises: currentExercises,
        elapsedTime: currentElapsed,
        currentIdx: currentExerciseIdx,
        workoutName: localWorkoutName,
        timestamp: Date.now()
      };
      const draftKey = 'govio_draft_workout';
      if (Platform.OS === 'web') {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
      } else {
        await SecureStore.setItemAsync(draftKey, JSON.stringify(draft));
      }
    } catch (e) {
      console.error('Error saving draft workout:', e);
    }
  };

  const saveDbDraftWorkout = async (currentExercises: ActiveExerciseState[], currentElapsed: number, currentExerciseIdx: number) => {
    if (saving || showSummary || loading || !user || user.id === 'mock-user-id-12345') return;
    try {
      const todayDateIso = new Date().toISOString().split('T')[0];
      let workoutId = dbWorkoutId;
      
      if (!workoutId) {
        // Insert new draft workout
        const { data, error } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            date: todayDateIso,
            notes: workoutNotes || null,
            status: 'in_progress',
            elapsed_time: currentElapsed,
            current_idx: currentExerciseIdx,
            workout_name: localWorkoutName,
          })
          .select('id')
          .single();
          
        if (error) {
          console.warn('Failed to save DB draft (might need schema migration):', error);
          return;
        }
        if (data) {
          workoutId = data.id;
          setDbWorkoutId(data.id);
        }
      } else {
        // Update existing draft workout
        const { error } = await supabase
          .from('workouts')
          .update({
            elapsed_time: currentElapsed,
            current_idx: currentExerciseIdx,
            workout_name: localWorkoutName,
            notes: workoutNotes || null,
          })
          .eq('id', workoutId);
          
        if (error) {
          console.warn('Failed to update DB draft:', error);
          return;
        }
      }
      
      if (workoutId) {
        // Now save the sets: delete existing sets first to avoid duplicates
        await supabase
          .from('workout_sets')
          .delete()
          .eq('workout_id', workoutId);
          
        const setsToInsert = currentExercises.flatMap((ae) =>
          ae.sets.map((set) => ({
            workout_id: workoutId,
            exercise_id: ae.exercise.id,
            set_number: set.set_number,
            reps: parseInt(set.reps, 10) || 0,
            weight_kg: parseFloat(set.weight_kg) || 0,
            notes: ae.notes || null,
            set_type: set.set_type || 'Normal',
          }))
        );
        
        if (setsToInsert.length > 0) {
          const { error: setsErr } = await supabase
            .from('workout_sets')
            .insert(setsToInsert);
            
          if (setsErr) {
            const isColumnError = 
              setsErr.message?.includes('set_type') || 
              setsErr.hint?.includes('set_type') ||
              setsErr.code === 'PGRST204';
              
            if (isColumnError) {
              const fallbackSets = setsToInsert.map(({ set_type, ...rest }) => rest);
              await supabase
                .from('workout_sets')
                .insert(fallbackSets);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error saving DB draft workout:', err);
    }
  };

  const clearDraftWorkout = async () => {
    try {
      const draftKey = 'govio_draft_workout';
      if (Platform.OS === 'web') {
        window.localStorage.removeItem(draftKey);
      } else {
        await SecureStore.deleteItemAsync(draftKey);
      }
    } catch (e) {
      console.error('Error clearing draft workout:', e);
    }
  };


  // Debounced draft autosave: triggers 2 seconds after activeExercises or currentIdx changes
  useEffect(() => {
    if (activeExercises.length > 0 && !loading && !saving && !showSummary) {
      const timer = setTimeout(() => {
        saveDraftWorkout(activeExercises, elapsedTime, currentIdx);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeExercises, currentIdx]);

  // Initialize active exercises and start stopwatch on mount
  useEffect(() => {
    const init = async () => {
      if (resumeDraft) {
        try {
          const resWorkoutId = route.params?.workoutId;
          let loadedDraft: any = null;

          if (resWorkoutId && user && user.id !== 'mock-user-id-12345') {
            // Fetch workout session from Supabase
            const { data: workoutData, error: workoutErr } = await supabase
              .from('workouts')
              .select('*')
              .eq('id', resWorkoutId)
              .single();

            if (!workoutErr && workoutData) {
              setDbWorkoutId(workoutData.id);

              // Fetch sets for this workout
              const { data: setsData, error: setsErr } = await supabase
                .from('workout_sets')
                .select('*')
                .eq('workout_id', resWorkoutId)
                .order('created_at', { ascending: true });

              if (!setsErr && setsData) {
                // Fetch all exercises to build a pool to match exercise details
                const { data: allExData } = await supabase.from('exercises').select('*');
                const customs = await getLocalCustomExercises();
                const exercisesPool = [...(allExData || []), ...customs];

                const exerciseMap: { [key: string]: { exercise: any; sets: any[]; notes: string } } = {};
                const exerciseIdsOrder: string[] = [];

                setsData.forEach((setRow: any) => {
                  const exId = setRow.exercise_id;
                  if (!exerciseMap[exId]) {
                    const exDetail = exercisesPool.find(e => e.id === exId) || {
                      id: exId,
                      name: 'Unknown Exercise',
                      muscle_group: 'Unknown',
                    };
                    exerciseMap[exId] = {
                      exercise: exDetail,
                      sets: [],
                      notes: setRow.notes || '',
                    };
                    exerciseIdsOrder.push(exId);
                  }

                  exerciseMap[exId].sets.push({
                    set_number: setRow.set_number,
                    reps: setRow.reps?.toString() || '10',
                    weight_kg: setRow.weight_kg?.toString() || '60',
                    set_type: setRow.set_type || 'Normal',
                    is_completed: true,
                  });
                });

                const reconstructedExercises: ActiveExerciseState[] = exerciseIdsOrder.map((exId) => {
                  const item = exerciseMap[exId];
                  const lastSet = item.sets[item.sets.length - 1];
                  return {
                    exercise: item.exercise,
                    sets: item.sets,
                    inputWeight: lastSet?.weight_kg || '60',
                    inputReps: lastSet?.reps || '10',
                    restTimeSeconds: 90,
                    notes: item.notes,
                  };
                });

                loadedDraft = {
                  activeExercises: reconstructedExercises,
                  elapsedTime: workoutData.elapsed_time || 0,
                  currentIdx: workoutData.current_idx || 0,
                  workoutName: workoutData.workout_name || 'Active Session',
                  workoutNotes: workoutData.notes || '',
                };
              }
            }
          }

          // Fallback to local SecureStore if DB fetch failed or wasn't applicable
          if (!loadedDraft) {
            const draftKey = 'govio_draft_workout';
            const draftStr = Platform.OS === 'web'
              ? window.localStorage.getItem(draftKey)
              : await SecureStore.getItemAsync(draftKey);

            if (draftStr) {
              const draft = JSON.parse(draftStr);
              loadedDraft = {
                activeExercises: draft.activeExercises || [],
                elapsedTime: draft.elapsedTime || 0,
                currentIdx: draft.currentIdx || 0,
                workoutName: draft.workoutName || 'Active Session',
                workoutNotes: '',
              };
            }
          }

          if (loadedDraft) {
            setActiveExercises(loadedDraft.activeExercises || []);
            setElapsedTime(loadedDraft.elapsedTime || 0);
            setCurrentIdx(loadedDraft.currentIdx || 0);
            setLocalWorkoutName(loadedDraft.workoutName || 'Active Session');
            if (loadedDraft.workoutNotes) setWorkoutNotes(loadedDraft.workoutNotes);
          } else {
            const initialStates: ActiveExerciseState[] = (initialExercises || []).map((ex) => ({
              exercise: ex,
              sets: [],
              inputWeight: '60',
              inputReps: (ex as any).recommendedReps ? String((ex as any).recommendedReps) : '10',
              restTimeSeconds: 90,
            }));
            setActiveExercises(initialStates);
          }
        } catch (e) {
          console.error('Error resuming draft workout:', e);
          const initialStates: ActiveExerciseState[] = (initialExercises || []).map((ex) => ({
            exercise: ex,
            sets: [],
            inputWeight: '60',
            inputReps: (ex as any).recommendedReps ? String((ex as any).recommendedReps) : '10',
            restTimeSeconds: 90,
          }));
          setActiveExercises(initialStates);
        }
      } else {
        const initialStates: ActiveExerciseState[] = (initialExercises || []).map((ex) => ({
          exercise: ex,
          sets: [],
          inputWeight: '60',
          inputReps: (ex as any).recommendedReps ? String((ex as any).recommendedReps) : '10',
          restTimeSeconds: 90,
        }));
        setActiveExercises(initialStates);
      }
      fetchAllExercises();
      setLoading(false);
    };

    init();

    // Start Stopwatch
    stopwatchIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [initialExercises]);

  // Rest Timer Countdown (robust hook triggered by timerActive)
  useEffect(() => {
    let timerInterval: any = null;
    if (timerActive && timerSeconds !== null && timerSeconds > 0) {
      timerInterval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerInterval);
            setTimerActive(false);
            playAlertSound();
            Alert.alert('Rest Over!', 'Time to perform your next set.');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerActive]);

  // Fetch exercise history automatically when changing active exercise
  useEffect(() => {
    if (activeExercises.length > 0 && activeExercises[currentIdx]) {
      const ae = activeExercises[currentIdx];
      if (ae.historyLoaded === undefined) {
        // Mark historyLoaded false immediately to prevent duplicates
        setActiveExercises((prev) => {
          const copy = [...prev];
          if (copy[currentIdx]) {
            copy[currentIdx] = { ...copy[currentIdx], historyLoaded: false };
          }
          return copy;
        });
        fetchExerciseHistory(ae.exercise.id, currentIdx);
      }
    }
  }, [currentIdx, activeExercises]);

  const playAlertSound = () => {
    try {
      if (Platform.OS === 'web') {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
        }, 300);
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  };

  const fetchExerciseHistory = async (exerciseId: string, index: number) => {
    let lastPerformance: LoggedSet[] = [];
    let historicalMaxWeight = 0;
    let historicalMaxReps = 0;
    let historicalMaxVolume = 0;

    if (user.id === 'mock-user-id-12345') {
      const allMockSets: any[] = [];
      MOCK_WORKOUTS.forEach((workout) => {
        if (workout.sets) {
          workout.sets.forEach((set) => {
            const exerciseName = activeExercises[index]?.exercise?.name || '';
            const matchById = set.exercise_id && set.exercise_id === exerciseId;
            const matchByName = set.exercise_name && exerciseName && set.exercise_name.toLowerCase() === exerciseName.toLowerCase();
            if (matchById || matchByName) {
              allMockSets.push({
                date: workout.date,
                set_number: set.set_number,
                reps: set.reps,
                weight_kg: set.weight_kg,
              });
            }
          });
        }
      });

      if (allMockSets.length > 0) {
        allMockSets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const newestDate = allMockSets[0].date;
        const lastSets = allMockSets.filter((s) => s.date === newestDate);
        lastSets.sort((a, b) => a.set_number - b.set_number);

        lastPerformance = lastSets.map((s) => ({
          set_number: s.set_number,
          reps: String(s.reps),
          weight_kg: String(s.weight_kg),
        }));

        allMockSets.forEach((s) => {
          const w = parseFloat(s.weight_kg) || 0;
          const r = parseInt(s.reps, 10) || 0;
          if (w > historicalMaxWeight) historicalMaxWeight = w;
          if (r > historicalMaxReps) historicalMaxReps = r;
          const vol = w * r;
          if (vol > historicalMaxVolume) historicalMaxVolume = vol;
        });
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('workout_sets')
          .select(`
            weight_kg,
            reps,
            set_number,
            workouts (
              date,
              user_id
            )
          `)
          .eq('workouts.user_id', user.id)
          .eq('exercise_id', exerciseId)
          .order('date', { foreignTable: 'workouts', ascending: false })
          .order('set_number', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const newestDate = (data[0] as any).workouts?.date;
          const lastSets = data.filter((item: any) => item.workouts?.date === newestDate);

          lastPerformance = lastSets.map((item: any) => ({
            set_number: item.set_number,
            reps: String(item.reps),
            weight_kg: String(item.weight_kg),
          }));

          data.forEach((item: any) => {
            const w = parseFloat(item.weight_kg) || 0;
            const r = parseInt(item.reps, 10) || 0;
            if (w > historicalMaxWeight) historicalMaxWeight = w;
            if (r > historicalMaxReps) historicalMaxReps = r;
            const vol = w * r;
            if (vol > historicalMaxVolume) historicalMaxVolume = vol;
          });
        }
      } catch (err) {
        console.error('Error fetching exercise history:', err);
      }
    }

    setActiveExercises((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        let fillWeight = '60';
        let fillReps = (copy[index].exercise as any).recommendedReps ? String((copy[index].exercise as any).recommendedReps) : '10';
        let progressionHint = '';

        if (lastPerformance.length > 0) {
          const targetReps = (copy[index].exercise as any).recommendedReps || 10;
          const lastWeight = parseFloat(lastPerformance[0].weight_kg) || 60;
          const lastReps = parseInt(lastPerformance[0].reps, 10) || 10;

          const allHitTarget = lastPerformance.every((s) => (parseInt(s.reps, 10) || 0) >= targetReps);

          if (allHitTarget) {
            // Same reps at +2.5% - 5% weight (rounded to nearest 0.5kg)
            const calculatedW = Math.max(lastWeight + 1, Math.round((lastWeight * 1.025) * 2) / 2);
            fillWeight = String(calculatedW);
            fillReps = String(lastReps);
            progressionHint = `Last time: ${lastWeight}kg × ${lastReps} reps → suggested: ${fillWeight}kg × ${fillReps}`;
          } else {
            // Same weight with +1 rep
            fillWeight = String(lastWeight);
            fillReps = String(lastReps + 1);
            progressionHint = `Last time: ${lastWeight}kg × ${lastReps} reps → suggested: ${fillWeight}kg × ${fillReps}`;
          }
        }

        copy[index] = {
          ...copy[index],
          historyLoaded: true,
          lastPerformance,
          historicalMaxWeight,
          historicalMaxReps,
          historicalMaxVolume,
          inputWeight: fillWeight,
          inputReps: fillReps,
          progressionHint,
        };
      }
      return copy;
    });
  };

  const handleAddExercise = (exercise: Exercise) => {
    // Check if exercise is already added
    if (activeExercises.some((ae) => ae.exercise.id === exercise.id)) {
      Alert.alert('Already Added', `${exercise.name} is already in your workout.`);
      return;
    }

    const newExState: ActiveExerciseState = {
      exercise,
      sets: [],
      inputWeight: '60',
      inputReps: '10',
      restTimeSeconds: 90,
    };

    if (supersetToggle) {
      if (pendingSupersetStartIdx === null) {
        // First exercise of superset
        setActiveExercises((prev) => {
          const nextIdx = prev.length;
          setPendingSupersetStartIdx(nextIdx);
          return [...prev, { ...newExState, supersetWithNext: true }];
        });
        Alert.alert('Superset Started', `Select the next exercise to pair with ${exercise.name}.`);
      } else {
        // Second exercise of superset
        setActiveExercises((prev) => {
          const updated = [...prev];
          if (updated[pendingSupersetStartIdx]) {
            updated[pendingSupersetStartIdx] = {
              ...updated[pendingSupersetStartIdx],
              supersetWithNext: true,
            };
          }
          setPendingSupersetStartIdx(null);
          setSupersetToggle(false);
          setShowAddExerciseModal(false);
          return [...updated, { ...newExState, isSuperset: true }];
        });
      }
    } else {
      setActiveExercises((prev) => [...prev, newExState]);
      setShowAddExerciseModal(false);
    }
  };

  const handleLogSet = () => {
    const ae = activeExercises[currentIdx];
    const reps = parseInt(ae.inputReps, 10);
    const weight = parseFloat(ae.inputWeight);

    if (isNaN(reps) || reps < 0 || isNaN(weight) || weight < 0) {
      Alert.alert('Invalid Input', 'Please enter positive numbers for reps and weight.');
      return;
    }

    const nextSetNumber = ae.sets.length + 1;
    const newSet: LoggedSet = {
      set_number: nextSetNumber,
      reps: ae.inputReps,
      weight_kg: ae.inputWeight,
      set_type: selectedSetType,
    };

    const updatedSets = [...ae.sets, newSet];
    const finalSets = calculatePRFlags(
      updatedSets,
      ae.historicalMaxWeight || 0,
      ae.historicalMaxReps || 0,
      ae.historicalMaxVolume || 0
    );

    // Auto-fill next set inputs based on last performance's next set values
    let nextWeight = ae.inputWeight;
    let nextReps = ae.inputReps;
    if (ae.lastPerformance && ae.lastPerformance.length > nextSetNumber) {
      nextWeight = ae.lastPerformance[nextSetNumber].weight_kg;
      nextReps = ae.lastPerformance[nextSetNumber].reps;
    }

    setActiveExercises((prev) => {
      const copy = [...prev];
      copy[currentIdx] = {
        ...ae,
        sets: finalSets,
        inputWeight: nextWeight,
        inputReps: nextReps,
      };
      return copy;
    });

    // Check if the just-logged set is a PR and trigger animation
    const lastSet = finalSets[finalSets.length - 1];
    if (lastSet && (lastSet.isWeightPR || lastSet.isRepsPR || lastSet.isVolumePR)) {
      triggerPRAnimation();
      triggerSuccessHaptic();
    } else {
      triggerLightHaptic();
    }

    // Start rest timer using dynamic custom rest time per exercise (default 90s)
    const restTime = ae.restTimeSeconds ?? 90;
    setTimerSeconds(restTime);
    setTimerActive(true);
  };

  const calculatePRFlags = (
    sets: LoggedSet[],
    maxWeight: number,
    maxReps: number,
    maxVolume: number
  ): LoggedSet[] => {
    return sets.map((s) => {
      const weight = parseFloat(s.weight_kg) || 0;
      const reps = parseInt(s.reps, 10) || 0;
      const volume = weight * reps;
      return {
        ...s,
        isWeightPR: maxWeight > 0 && weight > maxWeight,
        isRepsPR: maxReps > 0 && reps > maxReps,
        isVolumePR: maxVolume > 0 && volume > maxVolume,
      };
    });
  };

  const handleEditSetField = (setNumber: number, field: 'weight_kg' | 'reps', value: string) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const ae = copy[currentIdx];
      const updatedSets = ae.sets.map((s) => {
        if (s.set_number === setNumber) {
          return { ...s, [field]: value };
        }
        return s;
      });
      const finalSets = calculatePRFlags(
        updatedSets,
        ae.historicalMaxWeight || 0,
        ae.historicalMaxReps || 0,
        ae.historicalMaxVolume || 0
      );
      copy[currentIdx] = {
        ...ae,
        sets: finalSets,
      };
      return copy;
    });
  };

  const handleDeleteSet = (setNumber: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const ae = copy[currentIdx];
      const filteredSets = ae.sets.filter((s) => s.set_number !== setNumber);
      const reindexedSets = filteredSets.map((s, idx) => ({
        ...s,
        set_number: idx + 1,
      }));
      const finalSets = calculatePRFlags(
        reindexedSets,
        ae.historicalMaxWeight || 0,
        ae.historicalMaxReps || 0,
        ae.historicalMaxVolume || 0
      );
      copy[currentIdx] = {
        ...ae,
        sets: finalSets,
      };
      return copy;
    });
  };

  const handleUpdateInput = (field: 'inputReps' | 'inputWeight', value: string) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      if (copy[currentIdx]) {
        copy[currentIdx] = {
          ...copy[currentIdx],
          [field]: value,
        };
      }
      return copy;
    });
  };

  const adjustTimer = (amount: number) => {
    setTimerSeconds((prev) => {
      if (prev === null) return null;
      const newVal = prev + amount;
      return newVal > 0 ? newVal : 0;
    });
  };

  const formatTimer = (seconds: number | null): string => {
    if (seconds === null) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatStopwatch = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateTotalVolume = (): number => {
    return activeExercises.reduce((sum, ae) => {
      const exerciseVol = ae.sets.reduce((exSum, s) => {
        const w = parseFloat(s.weight_kg) || 0;
        const r = parseInt(s.reps, 10) || 0;
        return exSum + w * r;
      }, 0);
      return sum + exerciseVol;
    }, 0);
  };

  const calculateTotalSets = (): number => {
    return activeExercises.reduce((sum, ae) => sum + ae.sets.length, 0);
  };

  const handleFinishWorkout = () => {
    const totalSets = calculateTotalSets();
    if (totalSets === 0) {
      Alert.alert('Empty Workout', 'Please log at least one set before completing.');
      return;
    }
    // Stop Stopwatch
    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    // Set default routine name
    const defaultName = localWorkoutName !== 'Active Session' ? localWorkoutName : `Routine ${new Date().toLocaleDateString()}`;
    setRoutineName(defaultName);
    // Show summary view
    setShowSummary(true);
  };

  const handleSaveWorkout = async () => {
    setSaving(true);
    const todayDateIso = new Date().toISOString().split('T')[0];
    
    // Save to local storage for mock user
    if (user.id === 'mock-user-id-12345') {
      const mockSets = activeExercises.flatMap((ae) =>
        ae.sets.map((set) => ({
          exercise_id: ae.exercise.id,
          exercise_name: ae.exercise.name,
          muscle_group: ae.exercise.muscle_group,
          set_number: set.set_number,
          reps: parseInt(set.reps, 10),
          weight_kg: parseFloat(set.weight_kg),
          notes: ae.notes || null,
          set_type: set.set_type || 'Normal',
        }))
      );

      const newWorkout = {
        id: `wk-${Date.now()}`,
        date: todayDateIso,
        notes: workoutNotes,
        exercisesCount: activeExercises.length,
        sets: mockSets,
      };

      MOCK_WORKOUTS.unshift(newWorkout);

      try {
        const localData = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_workouts')
          : await SecureStore.getItemAsync('govio_workouts');
        const parsed = localData ? JSON.parse(localData) : [];
        parsed.unshift(newWorkout);
        if (Platform.OS === 'web') {
          window.localStorage.setItem('govio_workouts', JSON.stringify(parsed));
        } else {
          await SecureStore.setItemAsync('govio_workouts', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Error saving workout to SecureStore:', e);
      }

      if (programDay) {
        try {
          const cached = Platform.OS === 'web'
            ? window.localStorage.getItem('govio_pending_onboarding')
            : await SecureStore.getItemAsync('govio_pending_onboarding');
          if (cached) {
            const localProfile = JSON.parse(cached);
            localProfile.program_day = programDay + 1;
            localProfile.program_workouts_completed = (localProfile.program_workouts_completed || 0) + 1;
            if (Platform.OS === 'web') {
              window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(localProfile));
            } else {
              await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(localProfile));
            }
          }
        } catch (e) {
          console.error('Error incrementing mock program day:', e);
        }
      }

      setSaving(false);
      triggerSuccessHaptic();
      Alert.alert('Success', 'Workout session saved successfully! 💪');
      await clearDraftWorkout();
      navigation.navigate('Home', { session });
      return;

    }

    // Save to real database
    try {
      let workoutId = dbWorkoutId;

      if (workoutId) {
        // Update existing draft workout to completed
        const { error: workoutErr } = await supabase
          .from('workouts')
          .update({
            date: todayDateIso,
            notes: workoutNotes || null,
            status: 'completed',
            elapsed_time: elapsedTime,
            current_idx: currentIdx,
            workout_name: localWorkoutName,
          })
          .eq('id', workoutId);

        if (workoutErr) throw workoutErr;
      } else {
        // Insert new completed workout
        const { data: workoutData, error: workoutErr } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            date: todayDateIso,
            notes: workoutNotes || null,
            status: 'completed',
            elapsed_time: elapsedTime,
            current_idx: currentIdx,
            workout_name: localWorkoutName,
          })
          .select('id')
          .single();

        if (workoutErr) throw workoutErr;
        workoutId = workoutData.id;
      }

      // Delete existing sets for this workout first to avoid duplicates
      await supabase
        .from('workout_sets')
        .delete()
        .eq('workout_id', workoutId);

      const setsToInsert = activeExercises.flatMap((ae) =>
        ae.sets.map((set) => ({
          workout_id: workoutId,
          exercise_id: ae.exercise.id,
          set_number: set.set_number,
          reps: parseInt(set.reps, 10) || 0,
          weight_kg: parseFloat(set.weight_kg) || 0,
          notes: ae.notes || null,
          set_type: set.set_type || 'Normal',
        }))
      );

      const { error: setsErr } = await supabase
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsErr) {
        // Safe fallback in case set_type column does not exist in target Supabase DB yet
        const isColumnError = 
          setsErr.message?.includes('set_type') || 
          setsErr.hint?.includes('set_type') ||
          setsErr.code === 'PGRST204';
        
        if (isColumnError) {
          const fallbackSets = setsToInsert.map(({ set_type, ...rest }) => rest);
          const { error: fallbackErr } = await supabase
            .from('workout_sets')
            .insert(fallbackSets);
          if (fallbackErr) throw fallbackErr;
        } else {
          throw setsErr;
        }
      }

      triggerSuccessHaptic();
      Alert.alert('Success', 'Workout session saved successfully! 💪');
      await clearDraftWorkout();

      if (programDay) {
        try {
          const { data: profData } = await supabase
            .from('user_profiles')
            .select('program_workouts_completed')
            .eq('id', user.id)
            .single();
            
          const currentCompleted = profData?.program_workouts_completed || 0;
          
          await supabase
            .from('user_profiles')
            .update({
              program_day: programDay + 1,
              program_workouts_completed: currentCompleted + 1
            })
            .eq('id', user.id);
        } catch (e) {
          console.error('Error incrementing program day in Supabase:', e);
        }
      }

      navigation.navigate('Home', { session });

    } catch (err: any) {
      console.error('Error saving workout:', err);
      Alert.alert('Save Error', err.message || 'Failed to save workout session.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name.');
      return;
    }

    setSavingRoutine(true);
    try {
      const exerciseIds = activeExercises.map((ae) => ae.exercise.id);

      if (user.id === 'mock-user-id-12345') {
        await addLocalRoutine(routineName.trim(), exerciseIds);
        triggerSuccessHaptic();
        Alert.alert('Success', 'Routine saved successfully! 📋');
        setShowSaveRoutineModal(false);
      } else {
        const { error } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: routineName.trim(),
            exercise_ids: exerciseIds,
          });

        if (error) throw error;

        triggerSuccessHaptic();
        Alert.alert('Success', 'Routine saved successfully! 📋');
        setShowSaveRoutineModal(false);
      }
    } catch (err: any) {
      console.error('Error saving routine:', err);
      Alert.alert('Error', err.message || 'Failed to save routine.');
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleShareWorkout = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      // Delay slightly to ensure view is fully drawn
      await new Promise((resolve) => setTimeout(resolve, 150));

      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 0.9,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share your workout progress!',
          mimeType: 'image/png',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this platform.');
      }
    } catch (e: any) {
      console.error('Error generating share card:', e);
      Alert.alert('Share Error', 'Failed to generate shareable workout card.');
    } finally {
      setSharing(false);
    }
  };

  const handleExitWorkout = () => {
    Alert.alert(
      'Exit Workout',
      'Are you sure you want to exit? Your progress will be saved as an in-progress draft.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: async () => {
            if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
            setSaving(true);
            try {
              await saveDraftWorkout(activeExercises, elapsedTime, currentIdx);
              await saveDbDraftWorkout(activeExercises, elapsedTime, currentIdx);
            } catch (err) {
              console.error('Error saving draft on exit:', err);
            } finally {
              setSaving(false);
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4FF13" />
        </View>
      </SafeAreaView>
    );
  }

  const ae = activeExercises[currentIdx];

  // RENDER WORKOUT SUMMARY
  if (showSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Hidden Share Card for ViewShot capture */}
        <View collapsable={false} ref={shareViewRef} style={styles.hiddenShareCard}>
          <Text style={styles.shareCardHeader}>GOVIO FITNESS</Text>
          <Text style={styles.shareCardSubtitle}>WORKOUT COMPLETE ⚡</Text>
          
          <View style={styles.shareCardDivider} />
          
          <View style={styles.shareCardStatsRow}>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatLabel}>TOTAL VOLUME</Text>
              <Text style={styles.shareCardStatVal}>{calculateTotalVolume()} kg</Text>
            </View>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatLabel}>DURATION</Text>
              <Text style={styles.shareCardStatVal}>{formatStopwatch(elapsedTime)}</Text>
            </View>
          </View>

          <View style={styles.shareCardStatsRow}>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatLabel}>EXERCISES</Text>
              <Text style={styles.shareCardStatVal}>{activeExercises.length}</Text>
            </View>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatLabel}>SETS LOGGED</Text>
              <Text style={styles.shareCardStatVal}>{calculateTotalSets()}</Text>
            </View>
          </View>

          <View style={styles.shareCardDivider} />

          <View style={styles.shareCardMuscleBox}>
            <Text style={styles.shareCardMuscleLabel}>TARGET SPLITS TRAINED</Text>
            <View style={styles.shareCardMuscleRow}>
              {Array.from(new Set(activeExercises.map(ae => ae.exercise.muscle_group))).map((muscle, idx) => (
                <View key={idx} style={styles.shareCardMuscleBadge}>
                  <Text style={styles.shareCardMuscleText}>{muscle.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.shareCardFooter}>
            <Text style={styles.shareCardFooterText}>goviofitness.app</Text>
            <Text style={styles.shareCardDate}>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Workout Summary</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.summaryTitleBox}>
            <View style={styles.celebrationContainer}>
              <Animated.View style={[styles.checkmarkCircle, { transform: [{ scale: scaleValue }] }]}>
                <Text style={styles.checkmarkIconText}>✓</Text>
              </Animated.View>
              {confettiAnims.map((anim, idx) => {
                const particleColors = ['#D4FF13', '#FFDD00', '#FFEA79', '#D4FF13', '#FFFFFF', '#D4FF13', '#FFD83B', '#D4FF13'];
                return (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.confettiParticle,
                      {
                        backgroundColor: particleColors[idx],
                        transform: [
                          { translateX: anim.x },
                          { translateY: anim.y },
                          { scale: anim.scale },
                        ],
                        opacity: anim.opacity,
                      }
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.summaryTitle}>WORKOUT COMPLETE!</Text>
            <Text style={styles.summarySubtitle}>Great work on finishing your session today!</Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL VOLUME</Text>
              <Text style={styles.summaryVal}>{calculateTotalVolume()} kg</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>DURATION</Text>
              <Text style={styles.summaryVal}>{formatStopwatch(elapsedTime)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>EXERCISES</Text>
              <Text style={styles.summaryVal}>{activeExercises.length}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SETS COMPLETED</Text>
              <Text style={styles.summaryVal}>{calculateTotalSets()}</Text>
            </View>
          </View>

          {/* Workout Notes */}
          <View style={styles.summaryNotesBox}>
            <Text style={styles.summaryNotesLabel}>WORKOUT SESSION NOTES</Text>
            <TextInput
              style={styles.summaryNotesInput}
              placeholder="e.g. Felt strong on bench press, energy was high."
              placeholderTextColor="#6B7280"
              multiline={true}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
            />
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShareWorkout}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#D4FF13" />
            ) : (
              <Text style={styles.shareBtnText}>SHARE PROGRESS ⚡</Text>
            )}
          </TouchableOpacity>

          {/* Save as Routine Button */}
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: '#F97316', marginBottom: 12 }]}
            onPress={() => setShowSaveRoutineModal(true)}
            disabled={savingRoutine}
          >
            <Text style={[styles.shareBtnText, { color: '#F97316' }]}>SAVE AS ROUTINE 📋</Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveWorkout}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.saveBtnText}>SAVE WORKOUT SPLIT</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER ACTIVE WORKOUTWALKTHROUGH
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Floating Rest Timer Display Overlay */}
      {timerActive && timerSeconds !== null && (
        <View style={styles.timerBanner}>
          <View style={styles.timerContent}>
            <Text style={styles.timerTitle}>REST TIMER</Text>
            <Text style={styles.timerCountdown}>{formatTimer(timerSeconds)}</Text>
          </View>
          <View style={styles.timerButtons}>
            <TouchableOpacity style={styles.timerControlBtn} onPress={() => adjustTimer(-30)}>
              <Text style={styles.timerBtnText}>-30s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timerControlBtn} onPress={() => adjustTimer(30)}>
              <Text style={styles.timerBtnText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.timerControlBtn, styles.timerSkipBtn]} 
              onPress={() => {
                setTimerActive(false);
                setTimerSeconds(null);
              }}
            >
              <Text style={styles.timerBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitWorkout}>
          <Text style={styles.exitBtnText}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.workoutNameText}>{localWorkoutName.toUpperCase()}</Text>
        <View style={styles.stopwatchContainer}>
          <Text style={styles.stopwatchText}>⏱ {formatStopwatch(elapsedTime)}</Text>
        </View>
      </View>

      {ae ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Progress Bar Indicators with dynamic connection bridges and + ADD Exercise button */}
          <View style={styles.progressBarRow}>
            <View style={styles.progressBar}>
              {activeExercises.map((ex, i) => {
                const hasBridge = ex.supersetWithNext && (i + 1 < activeExercises.length);
                return (
                  <React.Fragment key={i}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setCurrentIdx(i)}
                      style={[
                        styles.progressDot, 
                        i === currentIdx && styles.progressDotActive,
                        i < currentIdx && styles.progressDotDone
                      ]}
                    />
                    {hasBridge && (
                      <View style={[
                        styles.dotBridge,
                        i < currentIdx && styles.dotBridgeDone
                      ]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            <TouchableOpacity 
              style={styles.inlineAddExerciseBtn}
              onPress={() => setShowAddExerciseModal(true)}
            >
              <Text style={styles.inlineAddExerciseBtnText}>➕ ADD</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise Info Card */}
          <View style={styles.exerciseHeaderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeExName}>{ae.exercise.name}</Text>
              <Text style={styles.activeExMuscle}>
                {ae.exercise.primary_muscle || ae.exercise.muscle_group.toUpperCase()}
              </Text>
              {((ae.exercise as any).recommendedSets || (ae.exercise as any).recommendedReps) ? (
                <Text style={{ color: '#D4FF13', fontSize: 13, marginTop: 4, fontFamily: 'System', fontWeight: '600' }}>
                  🎯 Target: {(ae.exercise as any).recommendedSets} sets x {(ae.exercise as any).recommendedReps} reps
                  {(ae.exercise as any).progressionNote ? ` (${(ae.exercise as any).progressionNote})` : ''}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.guideBtn} onPress={() => setShowGuideModal(true)}>
              <Text style={styles.guideBtnText}>VIEW GUIDE</Text>
            </TouchableOpacity>
          </View>

          {/* Superset Connecting Bracket Visual Info Card */}
          {(() => {
            const isFirstInSuperset = ae.supersetWithNext;
            const isSecondInSuperset = currentIdx > 0 && activeExercises[currentIdx - 1]?.supersetWithNext;
            const isPartOfSuperset = isFirstInSuperset || isSecondInSuperset;
            if (!isPartOfSuperset) return null;
            
            const partnerEx = isFirstInSuperset 
              ? activeExercises[currentIdx + 1] 
              : activeExercises[currentIdx - 1];
            
            return (
              <View style={styles.supersetBracketCard}>
                <View style={styles.bracketLineColumn}>
                  <View style={styles.bracketTopCap} />
                  <View style={styles.bracketVerticalLine} />
                  <View style={styles.bracketBottomCap} />
                </View>
                <View style={styles.supersetTextContent}>
                  <Text style={styles.supersetLabel}>⛓ LINKED SUPERSET PAIR</Text>
                  <Text style={styles.supersetPartnerName}>
                    {isFirstInSuperset 
                      ? `${ae.exercise.name} ➔ ${partnerEx?.exercise?.name || 'Next Exercise'}`
                      : `${partnerEx?.exercise?.name || 'Prev Exercise'} ➔ ${ae.exercise.name}`}
                  </Text>
                  <TouchableOpacity 
                    style={styles.supersetJumpBtn}
                    onPress={() => setCurrentIdx(isFirstInSuperset ? currentIdx + 1 : currentIdx - 1)}
                  >
                    <Text style={styles.supersetJumpBtnText}>Switch to Partner ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* Sets Table */}
          {ae.sets.length > 0 ? (
            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
                <Text style={[styles.tableCol, styles.colWeight]}>WEIGHT (KG)</Text>
                <Text style={[styles.tableCol, styles.colReps]}>REPS</Text>
                <Text style={[styles.tableCol, styles.colAction]}></Text>
              </View>
              {ae.sets.map((set) => (
                <View key={set.set_number}>
                  <View style={styles.tableRow}>
                    <View style={[styles.colSet, styles.setNumCellContainer]}>
                      <Text style={styles.setNumText}>{set.set_number}</Text>
                      {set.set_type && set.set_type !== 'Normal' && (
                        <View style={[
                          styles.setTypeMiniBadge,
                          set.set_type === 'Warmup' && styles.typeWarmupBg,
                          set.set_type === 'Drop Set' && styles.typeDropBg,
                          set.set_type === 'Failure' && styles.typeFailureBg,
                        ]}>
                          <Text style={styles.setTypeMiniText}>
                            {set.set_type === 'Warmup' ? 'W' : set.set_type === 'Drop Set' ? 'D' : 'F'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TextInput
                      style={[styles.tableInput, styles.colWeight]}
                      keyboardType="numeric"
                      value={set.weight_kg}
                      onChangeText={(val) => handleEditSetField(set.set_number, 'weight_kg', val)}
                    />
                    <TextInput
                      style={[styles.tableInput, styles.colReps]}
                      keyboardType="numeric"
                      value={set.reps}
                      onChangeText={(val) => handleEditSetField(set.set_number, 'reps', val)}
                    />
                    <TouchableOpacity
                      style={[styles.deleteSetBtn, styles.colAction]}
                      activeOpacity={0.7}
                      onPress={() => handleDeleteSet(set.set_number)}
                    >
                      <Text style={styles.deleteSetBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Animated PR badges row */}
                  {(set.isWeightPR || set.isRepsPR || set.isVolumePR) && (
                    <Animated.View style={[
                      styles.prBadgeRow,
                      set.set_number === ae.sets.length ? {
                        transform: [{ scale: prScaleAnim }],
                        opacity: prGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      } : {},
                    ]}>
                      <Text style={styles.prTrophy}>🏆</Text>
                      {set.isWeightPR && (
                        <View style={styles.prPill}>
                          <Text style={styles.prPillText}>★ WEIGHT PR</Text>
                        </View>
                      )}
                      {set.isRepsPR && (
                        <View style={styles.prPill}>
                          <Text style={styles.prPillText}>★ REPS PR</Text>
                        </View>
                      )}
                      {set.isVolumePR && (
                        <View style={styles.prPill}>
                          <Text style={styles.prPillText}>★ VOLUME PR</Text>
                        </View>
                      )}
                      <Text style={styles.prNewRecord}>NEW RECORD!</Text>
                    </Animated.View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySetsContainer}>
              <Text style={styles.emptySetsText}>No sets logged yet for this exercise.</Text>
            </View>
          )}

          {/* Last Performance Display */}
          {ae.historyLoaded && ae.lastPerformance && ae.lastPerformance.length > 0 && (
            <View style={styles.lastPerformanceBox}>
              <View style={styles.lastPerfHeader}>
                <Text style={styles.lastPerformanceLabel}>📊 LAST SESSION</Text>
                {ae.historicalMaxWeight != null && ae.historicalMaxWeight > 0 && (
                  <View style={styles.allTimeBestPill}>
                    <Text style={styles.allTimeBestText}>🏅 BEST: {ae.historicalMaxWeight}kg × {ae.historicalMaxReps}</Text>
                  </View>
                )}
              </View>
              <View style={styles.lastPerfSetsRow}>
                {ae.lastPerformance.map((set, idx) => (
                  <View key={idx} style={styles.lastPerfSetChip}>
                    <Text style={styles.lastPerfSetNum}>S{set.set_number}</Text>
                    <Text style={styles.lastPerfSetVal}>{set.weight_kg}kg × {set.reps}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Input Row for New Set */}
          <View style={styles.setInputCard}>
            <View style={styles.inputCardHeader}>
              <Text style={styles.inputCardTitle}>Log Set {ae.sets.length + 1}</Text>
              {ae.historyLoaded && ae.lastPerformance && ae.lastPerformance.length > 0 && (() => {
                const nextSetIdx = ae.sets.length;
                const targetSet = ae.lastPerformance[Math.min(nextSetIdx, ae.lastPerformance.length - 1)];
                return (
                  <View style={styles.beatItPill}>
                    <Text style={styles.beatItText}>🎯 Beat: {targetSet.weight_kg}kg × {targetSet.reps}</Text>
                  </View>
                );
              })()}
            </View>

            {/* Progression Suggestion Hint Banner */}
            {ae.progressionHint ? (
              <View style={styles.progressionHintBanner}>
                <Text style={styles.progressionHintIcon}>💡</Text>
                <Text style={styles.progressionHintText}>{ae.progressionHint}</Text>
              </View>
            ) : null}

            {/* Set Type Pills Selector Row */}
            <View style={styles.setTagRow}>
              {(['Normal', 'Warmup', 'Drop Set', 'Failure'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.setTagPill,
                    selectedSetType === type && styles.setTagPillActive,
                    type === 'Warmup' && selectedSetType === type && styles.setTagPillWarmup,
                    type === 'Drop Set' && selectedSetType === type && styles.setTagPillDrop,
                    type === 'Failure' && selectedSetType === type && styles.setTagPillFailure,
                  ]}
                  onPress={() => setSelectedSetType(type)}
                >
                  <Text style={[
                    styles.setTagPillText,
                    selectedSetType === type && styles.setTagPillTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rest Timer Config Row */}
            <View style={styles.restConfigRow}>
              <Text style={styles.restConfigLabel}>⏳ Rest Timer:</Text>
              <View style={styles.restConfigControls}>
                <TouchableOpacity 
                  style={styles.restConfigBtn} 
                  onPress={() => {
                    const currentRest = ae.restTimeSeconds ?? 90;
                    const newRest = Math.max(15, currentRest - 15);
                    setActiveExercises((prev) => {
                      const copy = [...prev];
                      copy[currentIdx] = { ...copy[currentIdx], restTimeSeconds: newRest };
                      return copy;
                    });
                  }}
                >
                  <Text style={styles.restConfigBtnText}>-15s</Text>
                </TouchableOpacity>
                <Text style={styles.restConfigVal}>{ae.restTimeSeconds ?? 90}s</Text>
                <TouchableOpacity 
                  style={styles.restConfigBtn} 
                  onPress={() => {
                    const currentRest = ae.restTimeSeconds ?? 90;
                    const newRest = currentRest + 15;
                    setActiveExercises((prev) => {
                      const copy = [...prev];
                      copy[currentIdx] = { ...copy[currentIdx], restTimeSeconds: newRest };
                      return copy;
                    });
                  }}
                >
                  <Text style={styles.restConfigBtnText}>+15s</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.setInputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.setFieldInput}
                  keyboardType="numeric"
                  value={ae.inputWeight}
                  onChangeText={(val) => handleUpdateInput('inputWeight', val)}
                />
                {ae.historyLoaded && ae.lastPerformance && ae.lastPerformance.length > 0 && (() => {
                  const nextSetIdx = ae.sets.length;
                  const targetSet = ae.lastPerformance[Math.min(nextSetIdx, ae.lastPerformance.length - 1)];
                  const currentW = parseFloat(ae.inputWeight) || 0;
                  const lastW = parseFloat(targetSet.weight_kg) || 0;
                  const diff = currentW - lastW;
                  if (diff > 0) return <Text style={styles.inputHintUp}>▲ +{diff}kg</Text>;
                  if (diff < 0) return <Text style={styles.inputHintDown}>▼ {diff}kg</Text>;
                  return <Text style={styles.inputHintSame}>= same</Text>;
                })()}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.setFieldInput}
                  keyboardType="numeric"
                  value={ae.inputReps}
                  onChangeText={(val) => handleUpdateInput('inputReps', val)}
                />
                {ae.historyLoaded && ae.lastPerformance && ae.lastPerformance.length > 0 && (() => {
                  const nextSetIdx = ae.sets.length;
                  const targetSet = ae.lastPerformance[Math.min(nextSetIdx, ae.lastPerformance.length - 1)];
                  const currentR = parseInt(ae.inputReps, 10) || 0;
                  const lastR = parseInt(targetSet.reps, 10) || 0;
                  const diff = currentR - lastR;
                  if (diff > 0) return <Text style={styles.inputHintUp}>▲ +{diff} reps</Text>;
                  if (diff < 0) return <Text style={styles.inputHintDown}>▼ {diff} reps</Text>;
                  return <Text style={styles.inputHintSame}>= same</Text>;
                })()}
              </View>

              <TouchableOpacity style={styles.logSetBtn} onPress={handleLogSet}>
                <Text style={styles.logSetBtnText}>LOG SET</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Footer Walkthrough Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
          disabled={currentIdx === 0}
          onPress={() => setCurrentIdx((prev) => prev - 1)}
        >
          <Text style={styles.navBtnText}>← PREV</Text>
        </TouchableOpacity>

        {currentIdx < activeExercises.length - 1 ? (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setCurrentIdx((prev) => prev + 1)}
          >
            <Text style={styles.navBtnText}>NEXT →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.finishBtn]}
            onPress={handleFinishWorkout}
          >
            <Text style={styles.finishBtnText}>FINISH WORKOUT 🏋️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Exercise Guide Modal */}
      {ae && ae.exercise && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showGuideModal}
          onRequestClose={() => setShowGuideModal(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{ae.exercise.name.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setShowGuideModal(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Text style={styles.modalLabel}>Primary Target</Text>
                <Text style={styles.modalVal}>{ae.exercise.primary_muscle || ae.exercise.muscle_group}</Text>

                {ae.exercise.secondary_muscles && ae.exercise.secondary_muscles.length > 0 && (
                  <>
                    <Text style={styles.modalLabel}>Secondary Targets</Text>
                    <Text style={styles.modalVal}>{ae.exercise.secondary_muscles.join(', ')}</Text>
                  </>
                )}

                {ae.exercise.instructions && ae.exercise.instructions.length > 0 && (
                  <>
                    <Text style={styles.modalLabel}>How to Perform</Text>
                    {ae.exercise.instructions.map((step, idx) => (
                      <Text key={idx} style={styles.modalStep}>
                        {idx + 1}. {step}
                      </Text>
                    ))}
                  </>
                )}

                {ae.exercise.form_tips && ae.exercise.form_tips.length > 0 && (
                  <>
                    <Text style={styles.modalLabel}>Pro Form Tips</Text>
                    {ae.exercise.form_tips.map((tip, idx) => (
                      <Text key={idx} style={styles.modalStep}>
                        • {tip}
                      </Text>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* Add Exercise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddExerciseModal}
        onRequestClose={() => {
          setShowAddExerciseModal(false);
          setPendingSupersetStartIdx(null);
          setSupersetToggle(false);
        }}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>ADD EXERCISE</Text>
                {pendingSupersetStartIdx !== null && (
                  <Text style={styles.modalSubTitleHint}>
                    Pairing with {activeExercises[pendingSupersetStartIdx]?.exercise?.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => {
                setShowAddExerciseModal(false);
                setPendingSupersetStartIdx(null);
                setSupersetToggle(false);
              }}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search exercise..."
                placeholderTextColor="#6B7280"
                value={exerciseSearchQuery}
                onChangeText={setExerciseSearchQuery}
              />
            </View>

            {/* Superset Toggle Switcher */}
            <View style={styles.supersetToggleRow}>
              <Text style={styles.supersetToggleLabel}>Superset with next exercise</Text>
              <TouchableOpacity 
                style={[
                  styles.supersetToggleSwitch,
                  (supersetToggle || pendingSupersetStartIdx !== null) && styles.supersetToggleSwitchActive
                ]}
                disabled={pendingSupersetStartIdx !== null} // Lock it if we are already in the middle of pairing
                onPress={() => setSupersetToggle(!supersetToggle)}
              >
                <View style={[
                  styles.supersetToggleKnob,
                  (supersetToggle || pendingSupersetStartIdx !== null) && styles.supersetToggleKnobActive
                ]} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allExercisesList.filter((item: Exercise) =>
                item.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
                item.muscle_group.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
              )}
              keyExtractor={(item: Exercise) => item.id}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }: { item: Exercise }) => {
                const isAlreadyAdded = activeExercises.some((ae) => ae.exercise.id === item.id);
                return (
                  <View style={styles.modalExerciseRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalExName}>{item.name}</Text>
                      <Text style={styles.modalExMuscle}>{item.muscle_group.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.modalAddBtn,
                        isAlreadyAdded && styles.modalAddBtnDisabled
                      ]}
                      disabled={isAlreadyAdded}
                      onPress={() => handleAddExercise(item)}
                    >
                      <Text style={styles.modalAddBtnText}>
                        {isAlreadyAdded ? 'ADDED' : '➕ ADD'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Save Routine Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSaveRoutineModal}
        onRequestClose={() => setShowSaveRoutineModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 280 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SAVE AS ROUTINE</Text>
              <TouchableOpacity onPress={() => setShowSaveRoutineModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                ROUTINE NAME
              </Text>
              <TextInput
                style={[styles.modalSearchInput, { paddingVertical: 12, marginBottom: 20 }]}
                placeholder="e.g. Chest & Triceps Power"
                placeholderTextColor="#6B7280"
                value={routineName}
                onChangeText={setRoutineName}
              />
              <TouchableOpacity
                style={[styles.saveBtn, { marginBottom: 0 }]}
                onPress={handleConfirmSaveRoutine}
                disabled={savingRoutine}
              >
                {savingRoutine ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE ROUTINE</Text>
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
  centerContainer: {
    flex: 1,
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
  exitBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  exitBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  workoutNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stopwatchContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
  },
  stopwatchText: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#222222',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#D4FF13',
    width: 24,
  },
  progressDotDone: {
    backgroundColor: '#10B981',
  },
  exerciseHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 16,
    marginBottom: 16,
  },
  activeExName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  activeExMuscle: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  guideBtn: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  guideBtnText: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptySetsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySetsText: {
    color: '#7A7A7A',
    fontSize: 13,
    fontWeight: '600',
  },
  setsTable: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tableCol: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  colSet: {
    width: '15%',
    textAlign: 'center',
  },
  colWeight: {
    width: '40%',
    textAlign: 'center',
  },
  colReps: {
    width: '30%',
    textAlign: 'center',
  },
  colAction: {
    width: '15%',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tableCell: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  setNumCell: {
    textAlign: 'center',
  },
  tableInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  deleteSetBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSetBtnText: {
    fontSize: 14,
  },
  prBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: '10%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 255, 19, 0.15)',
    backgroundColor: 'rgba(212, 255, 19, 0.04)',
  },
  prTrophy: {
    fontSize: 14,
    marginRight: 6,
  },
  prPill: {
    backgroundColor: 'rgba(212, 255, 19, 0.15)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
  },
  prPillText: {
    color: '#D4FF13',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prNewRecord: {
    color: '#D4FF13',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 'auto',
    opacity: 0.7,
  },
  lastPerformanceBox: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  lastPerfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lastPerformanceLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  allTimeBestPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allTimeBestText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  lastPerfSetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lastPerfSetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 4,
  },
  lastPerfSetNum: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    marginRight: 6,
  },
  lastPerfSetVal: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
  },
  setInputCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 16,
    marginBottom: 16,
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputCardTitle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beatItPill: {
    backgroundColor: 'rgba(212, 255, 19, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 19, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  beatItText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  inputHintUp: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  inputHintDown: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  inputHintSame: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    flex: 1.2,
    marginRight: 10,
  },
  inputLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },
  setFieldInput: {
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#222222',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  logSetBtn: {
    flex: 1.5,
    backgroundColor: '#D4FF13',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  logSetBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#222222',
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  finishBtn: {
    backgroundColor: '#D4FF13',
    borderColor: '#D4FF13',
  },
  finishBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#D4FF13',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
    elevation: 10,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerTitle: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  timerCountdown: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
  },
  timerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerControlBtn: {
    backgroundColor: 'rgba(13, 20, 29, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  timerSkipBtn: {
    backgroundColor: '#000000',
  },
  timerBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
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
    height: '65%',
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
  },
  modalCloseText: {
    color: '#D4FF13',
    fontSize: 14,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
  },
  modalLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  modalVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalStep: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginVertical: 4,
  },
  summaryTitleBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  summaryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: '#7A7A7A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryVal: {
    color: '#D4FF13',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryNotesBox: {
    marginBottom: 24,
  },
  summaryNotesLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryNotesInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#222222',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  celebrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    width: 100,
    marginBottom: 20,
    position: 'relative',
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D4FF13',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  checkmarkIconText: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '900',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  shareBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shareBtnDisabled: {
    opacity: 0.5,
  },
  shareBtnText: {
    color: '#D4FF13',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hiddenShareCard: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 360,
    height: 480,
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#D4FF13',
    padding: 24,
    justifyContent: 'space-between',
  },
  shareCardHeader: {
    color: '#D4FF13',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  shareCardSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  shareCardDivider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 16,
  },
  shareCardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  shareCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  shareCardStatLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  shareCardStatVal: {
    color: '#D4FF13',
    fontSize: 20,
    fontWeight: '900',
  },
  shareCardMuscleBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  shareCardMuscleLabel: {
    color: '#7A7A7A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  shareCardMuscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shareCardMuscleBadge: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    margin: 3,
  },
  shareCardMuscleText: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '900',
  },
  shareCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  shareCardFooterText: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
  },
  shareCardDate: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  dotBridge: {
    width: 12,
    height: 3,
    backgroundColor: '#222222',
    marginHorizontal: -2,
    zIndex: -1,
  },
  dotBridgeDone: {
    backgroundColor: '#10B981',
  },
  inlineAddExerciseBtn: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inlineAddExerciseBtnText: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '900',
  },
  supersetBracketCard: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  bracketLineColumn: {
    width: 10,
    alignItems: 'center',
    marginRight: 12,
    height: 48,
    justifyContent: 'space-between',
  },
  bracketTopCap: {
    width: 10,
    height: 2,
    backgroundColor: '#D4FF13',
  },
  bracketVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D4FF13',
  },
  bracketBottomCap: {
    width: 10,
    height: 2,
    backgroundColor: '#D4FF13',
  },
  supersetTextContent: {
    flex: 1,
  },
  supersetLabel: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  supersetPartnerName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  supersetJumpBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  supersetJumpBtnText: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
  },
  setNumCellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '15%',
  },
  setNumText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  setTypeMiniBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  typeWarmupBg: {
    backgroundColor: '#3B82F6',
  },
  typeDropBg: {
    backgroundColor: '#8B5CF6',
  },
  typeFailureBg: {
    backgroundColor: '#EF4444',
  },
  setTypeMiniText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  setTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setTagPill: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    paddingVertical: 6,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  setTagPillActive: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  setTagPillWarmup: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  setTagPillDrop: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  setTagPillFailure: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  setTagPillText: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
  },
  setTagPillTextActive: {
    color: '#FFFFFF',
  },
  restConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 8,
    marginBottom: 12,
  },
  restConfigLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  restConfigControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restConfigBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginHorizontal: 4,
  },
  restConfigBtnText: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: '800',
  },
  restConfigVal: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  modalSearchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  supersetToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginBottom: 8,
  },
  supersetToggleLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  supersetToggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  supersetToggleSwitchActive: {
    backgroundColor: 'rgba(212, 255, 19, 0.2)',
    borderColor: '#D4FF13',
  },
  supersetToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7A7A7A',
  },
  supersetToggleKnobActive: {
    backgroundColor: '#D4FF13',
    alignSelf: 'flex-end',
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  modalExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modalExName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalExMuscle: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  modalAddBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#222222',
  },
  modalAddBtnText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  modalSubTitleHint: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  progressionHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 19, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  progressionHintIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  progressionHintText: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
