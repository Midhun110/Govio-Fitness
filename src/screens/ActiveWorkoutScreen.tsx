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
  Animated
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
}

export default function ActiveWorkoutScreen() {
  const route = useRoute<ActiveWorkoutScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, exercises, workoutName } = route.params;
  const user = session.user;

  // Active workout states
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');

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

  // Initialize active exercises and start stopwatch on mount
  useEffect(() => {
    const initialStates: ActiveExerciseState[] = exercises.map((ex) => ({
      exercise: ex,
      sets: [],
      inputWeight: '60',
      inputReps: '10',
    }));
    setActiveExercises(initialStates);
    setLoading(false);

    // Start Stopwatch
    stopwatchIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [exercises]);

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
        // Auto-fill Weight & Reps inputs with the first set from last performance
        let fillWeight = '60';
        let fillReps = '10';
        if (lastPerformance.length > 0) {
          fillWeight = lastPerformance[0].weight_kg;
          fillReps = lastPerformance[0].reps;
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
        };
      }
      return copy;
    });
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

    triggerLightHaptic();

    // Start rest timer (90s countdown)
    setTimerSeconds(90);
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
        const localData = await SecureStore.getItemAsync('govio_workouts');
        const parsed = localData ? JSON.parse(localData) : [];
        parsed.unshift(newWorkout);
        await SecureStore.setItemAsync('govio_workouts', JSON.stringify(parsed));
      } catch (e) {
        console.error('Error saving workout to SecureStore:', e);
      }

      setSaving(false);
      triggerSuccessHaptic();
      Alert.alert('Success', 'Workout session saved successfully! 💪');
      navigation.navigate('Home', { session });
      return;
    }

    // Save to real database
    try {
      const { data: workoutData, error: workoutErr } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          date: todayDateIso,
          notes: workoutNotes || null,
        })
        .select('id')
        .single();

      if (workoutErr) throw workoutErr;
      const workoutId = workoutData.id;

      const setsToInsert = activeExercises.flatMap((ae) =>
        ae.sets.map((set) => ({
          workout_id: workoutId,
          exercise_id: ae.exercise.id,
          set_number: set.set_number,
          reps: parseInt(set.reps, 10),
          weight_kg: parseFloat(set.weight_kg),
          notes: ae.notes || null,
        }))
      );

      const { error: setsErr } = await supabase
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsErr) throw setsErr;

      triggerSuccessHaptic();
      Alert.alert('Success', 'Workout session saved successfully! 💪');
      navigation.navigate('Home', { session });
    } catch (err: any) {
      console.error('Error saving workout:', err);
      Alert.alert('Save Error', err.message || 'Failed to save workout session.');
    } finally {
      setSaving(false);
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
      'Are you sure you want to exit? Your current workout progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => {
            if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
            navigation.goBack();
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

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveWorkout}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#0D141D" />
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
        <Text style={styles.workoutNameText}>{workoutName.toUpperCase()}</Text>
        <View style={styles.stopwatchContainer}>
          <Text style={styles.stopwatchText}>⏱ {formatStopwatch(elapsedTime)}</Text>
        </View>
      </View>

      {ae ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Progress Bar Indicators */}
          <View style={styles.progressBar}>
            {activeExercises.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.progressDot, 
                  i === currentIdx && styles.progressDotActive,
                  i < currentIdx && styles.progressDotDone
                ]}
              />
            ))}
          </View>

          {/* Exercise Info Card */}
          <View style={styles.exerciseHeaderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeExName}>{ae.exercise.name}</Text>
              <Text style={styles.activeExMuscle}>
                {ae.exercise.primary_muscle || ae.exercise.muscle_group.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.guideBtn} onPress={() => setShowGuideModal(true)}>
              <Text style={styles.guideBtnText}>VIEW GUIDE</Text>
            </TouchableOpacity>
          </View>

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
                    <Text style={[styles.tableCell, styles.colSet, styles.setNumCell]}>
                      {set.set_number}
                    </Text>
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

                  {/* PR badges row */}
                  {(set.isWeightPR || set.isRepsPR || set.isVolumePR) && (
                    <View style={styles.prBadgeRow}>
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
                    </View>
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
              <Text style={styles.lastPerformanceLabel}>LAST LOGGED PERFORMANCE</Text>
              <Text style={styles.lastPerformanceText}>
                {ae.lastPerformance.map((set) => `${set.weight_kg}kg × ${set.reps}`).join('  |  ')}
              </Text>
            </View>
          )}

          {/* Input Row for New Set */}
          <View style={styles.setInputCard}>
            <Text style={styles.inputCardTitle}>Log Next Set</Text>
            <View style={styles.setInputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.setFieldInput}
                  keyboardType="numeric"
                  value={ae.inputWeight}
                  onChangeText={(val) => handleUpdateInput('inputWeight', val)}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.setFieldInput}
                  keyboardType="numeric"
                  value={ae.inputReps}
                  onChangeText={(val) => handleUpdateInput('inputReps', val)}
                />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D141D',
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
    borderBottomColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    backgroundColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    backgroundColor: '#192029',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D4A3D',
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
    paddingLeft: '15%',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  prPill: {
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  prPillText: {
    color: '#D4FF13',
    fontSize: 8,
    fontWeight: '900',
  },
  lastPerformanceBox: {
    backgroundColor: '#151C25',
    borderWidth: 1,
    borderColor: '#3D4A3D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  lastPerformanceLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lastPerformanceText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
  },
  setInputCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    padding: 16,
    marginBottom: 16,
  },
  inputCardTitle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
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
    backgroundColor: '#192029',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
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
    color: '#0D141D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#3D4A3D',
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
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
    color: '#0D141D',
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
    color: '#0D141D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  timerCountdown: {
    color: '#0D141D',
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
    borderColor: '#0D141D',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  timerSkipBtn: {
    backgroundColor: '#0D141D',
  },
  timerBtnText: {
    color: '#0D141D',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0D141D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    color: '#0D141D',
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
    color: '#0D141D',
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
    backgroundColor: '#0D141D',
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
    backgroundColor: '#3D4A3D',
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
});
