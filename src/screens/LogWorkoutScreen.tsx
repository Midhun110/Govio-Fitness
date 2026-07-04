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
  FlatList,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { MOCK_WORKOUTS } from './HomeScreen';

type LogWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'LogWorkout'>;

type LogWorkoutScreenProps = {
  route: LogWorkoutScreenRouteProp;
};

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

interface LoggedSet {
  set_number: number;
  reps: string;
  weight_kg: string;
}

interface ActiveExercise {
  exercise: Exercise;
  sets: LoggedSet[];
  inputReps: string;
  inputWeight: string;
  notes?: string;
}

const MOCK_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest' },
  { id: 'ex-2', name: 'Squat', muscle_group: 'legs' },
  { id: 'ex-3', name: 'Deadlift', muscle_group: 'legs' },
  { id: 'ex-4', name: 'Overhead Press', muscle_group: 'shoulders' },
  { id: 'ex-5', name: 'Pull-up', muscle_group: 'back' },
  { id: 'ex-6', name: 'Barbell Row', muscle_group: 'back' },
  { id: 'ex-7', name: 'Lunges', muscle_group: 'legs' },
  { id: 'ex-8', name: 'Plank', muscle_group: 'core' },
  { id: 'ex-9', name: 'Bicep Curl', muscle_group: 'arms' },
  { id: 'ex-10', name: 'Tricep Dip', muscle_group: 'arms' },
  { id: 'ex-11', name: 'Leg Press', muscle_group: 'legs' },
  { id: 'ex-12', name: 'Lat Pulldown', muscle_group: 'back' },
  { id: 'ex-13', name: 'Push-up', muscle_group: 'chest' },
  { id: 'ex-14', name: 'Romanian Deadlift', muscle_group: 'legs' },
  { id: 'ex-15', name: 'Shoulder Press', muscle_group: 'shoulders' }
];

export default function LogWorkoutScreen({ route }: LogWorkoutScreenProps) {
  const session = route.params.session;
  const user = session.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  
  // Active workout structure
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Exercise Search Modal State
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  const fetchExercises = async () => {
    if (user.id === 'mock-user-id-12345') {
      setExercisesList(MOCK_EXERCISES);
      setLoading(false);
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
      setExercisesList(MOCK_EXERCISES); // Fallback to mocks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();

    // Initialize with exercises if passed from WorkoutDetailScreen
    const initialEx = route.params?.initialExercises;
    if (initialEx && initialEx.length > 0) {
      const activeExs: ActiveExercise[] = initialEx.map((ex: any) => ({
        exercise: {
          id: ex.id || `ex-${Math.random()}`,
          name: ex.name,
          muscle_group: ex.muscle_group || 'core',
        },
        sets: [],
        inputReps: ex.reps ? ex.reps.replace(/\D/g, '') || '10' : '10',
        inputWeight: '60',
      }));
      setActiveExercises(activeExs);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (timerSeconds !== null && timerSeconds > 0 && timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      setTimerSeconds(null);
      playAlertSound();
      Alert.alert('Rest Over!', 'Time to perform your next set.');
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerSeconds, timerActive]);

  const playAlertSound = () => {
    try {
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
        audioCtx.close();
      }, 350);
    } catch (e) {
      console.log('Audio Context beep failed/blocked', e);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    // Avoid duplicates
    if (activeExercises.some((ae) => ae.exercise.id === exercise.id)) {
      setShowExerciseModal(false);
      return;
    }

    setActiveExercises((prev) => [
      ...prev,
      {
        exercise,
        sets: [],
        inputReps: '10',
        inputWeight: '60',
      },
    ]);
    setShowExerciseModal(false);
    setSearchQuery('');
  };

  const handleLogSet = (index: number) => {
    const ae = activeExercises[index];
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

    setActiveExercises((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...ae,
        sets: [...ae.sets, newSet],
      };
      return copy;
    });

    // Start rest timer (90s default)
    setTimerSeconds(90);
    setTimerActive(true);
  };

  const handleUpdateInput = (index: number, field: 'inputReps' | 'inputWeight', value: string) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleUpdateExerciseNotes = (index: number, value: string) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        notes: value,
      };
      return copy;
    });
  };

  const handleEditSetField = (exerciseIndex: number, setNumber: number, field: 'weight_kg' | 'reps', value: string) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const ae = copy[exerciseIndex];
      const updatedSets = ae.sets.map((s) => {
        if (s.set_number === setNumber) {
          return { ...s, [field]: value };
        }
        return s;
      });
      copy[exerciseIndex] = {
        ...ae,
        sets: updatedSets,
      };
      return copy;
    });
  };

  const handleDeleteSet = (exerciseIndex: number, setNumber: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const ae = copy[exerciseIndex];
      const filteredSets = ae.sets.filter((s) => s.set_number !== setNumber);
      // Re-index remaining sets
      const reindexedSets = filteredSets.map((s, idx) => ({
        ...s,
        set_number: idx + 1,
      }));
      copy[exerciseIndex] = {
        ...ae,
        sets: reindexedSets,
      };
      return copy;
    });
  };

  const handleRemoveExercise = (index: number) => {
    setActiveExercises((prev) => prev.filter((_, i) => i !== index));
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

  const handleFinishWorkout = async () => {
    // 1. Validate workout has sets
    const totalSets = activeExercises.reduce((sum, ae) => sum + ae.sets.length, 0);
    if (totalSets === 0) {
      Alert.alert('Empty Workout', 'Please log at least one set before finishing.');
      return;
    }

    setSaving(true);

    const todayDateIso = new Date().toISOString().split('T')[0];

    if (user.id === 'mock-user-id-12345') {
      // Mock dev bypass save
      const mockSets = activeExercises.flatMap((ae) => 
        ae.sets.map((set) => ({
          exercise_name: ae.exercise.name,
          muscle_group: ae.exercise.muscle_group,
          set_number: set.set_number,
          reps: parseInt(set.reps, 10),
          weight_kg: parseFloat(set.weight_kg),
          notes: ae.notes || null,
        }))
      );
      
      MOCK_WORKOUTS.unshift({
        id: `wk-${Date.now()}`,
        date: todayDateIso,
        notes: workoutNotes,
        exercisesCount: activeExercises.length,
        sets: mockSets,
      });

      setTimeout(() => {
        setSaving(false);
        navigation.navigate('Home', { session });
      }, 1000);
      return;
    }

    try {
      // 1. Insert workout record
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

      // 2. Prep sets batch insert
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

      // 3. Batch insert sets
      const { error: setsErr } = await supabase
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsErr) throw setsErr;

      navigation.navigate('Home', { session });
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Failed to save workout.');
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exercisesList.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Floating Rest Timer Display (Active Overlay) */}
      {timerActive && timerSeconds !== null && (
        <View style={styles.timerBanner}>
          <View style={styles.timerContent}>
            <Text style={styles.timerTitle}>REST TIMER</Text>
            <Text style={styles.timerCountdown}>{formatTimer(timerSeconds)}</Text>
          </View>
          <View style={styles.timerButtons}>
            <TouchableOpacity style={styles.timerControlBtn} onPress={() => adjustTimer(-15)}>
              <Text style={styles.timerBtnText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timerControlBtn} onPress={() => adjustTimer(15)}>
              <Text style={styles.timerBtnText}>+15s</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Log Workout</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Workout Notes */}
        <TextInput
          style={styles.notesInput}
          placeholder="Workout notes (e.g. Felt strong today, push-pull day)"
          placeholderTextColor="#6B7280"
          multiline={true}
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
        />

        {/* Active Exercises List */}
        {activeExercises.length === 0 ? (
          <View style={styles.emptyPlaceholder}>
            <Text style={styles.emptyText}>No exercises added yet.</Text>
            <Text style={styles.emptySubtext}>Tap below to search and construct your routine.</Text>
          </View>
        ) : (
          activeExercises.map((ae, index) => (
            <View key={ae.exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{ae.exercise.name}</Text>
                  <Text style={styles.exerciseMuscle}>{ae.exercise.muscle_group.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                  <Text style={styles.removeLink}>Remove</Text>
                </TouchableOpacity>
              </View>

              {/* Notes Input per Exercise */}
              <TextInput
                style={styles.exerciseNotesInput}
                placeholder="Exercise coaching notes..."
                placeholderTextColor="#6B7280"
                value={ae.notes || ''}
                onChangeText={(val) => handleUpdateExerciseNotes(index, val)}
              />

              {/* Logged Sets Table */}
              {ae.sets.length > 0 && (
                <View style={styles.setsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
                    <Text style={[styles.tableCol, styles.colWeight]}>WEIGHT (KG)</Text>
                    <Text style={[styles.tableCol, styles.colReps]}>REPS</Text>
                    <Text style={[styles.tableCol, styles.colAction]}></Text>
                  </View>
                  {ae.sets.map((set) => (
                    <View key={set.set_number} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.colSet, styles.setNumCell]}>
                        {set.set_number}
                      </Text>
                      <TextInput
                        style={[styles.tableInput, styles.colWeight]}
                        keyboardType="numeric"
                        value={set.weight_kg}
                        onChangeText={(val) => handleEditSetField(index, set.set_number, 'weight_kg', val)}
                      />
                      <TextInput
                        style={[styles.tableInput, styles.colReps]}
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(val) => handleEditSetField(index, set.set_number, 'reps', val)}
                      />
                      <TouchableOpacity
                        style={[styles.deleteSetBtn, styles.colAction]}
                        activeOpacity={0.7}
                        onPress={() => handleDeleteSet(index, set.set_number)}
                      >
                        <Text style={styles.deleteSetBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Input Row for New Set */}
              <View style={styles.setInputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.setFieldInput}
                    keyboardType="numeric"
                    value={ae.inputWeight}
                    onChangeText={(val) => handleUpdateInput(index, 'inputWeight', val)}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.setFieldInput}
                    keyboardType="numeric"
                    value={ae.inputReps}
                    onChangeText={(val) => handleUpdateInput(index, 'inputReps', val)}
                  />
                </View>

                <TouchableOpacity style={styles.logSetBtn} onPress={() => handleLogSet(index)}>
                  <Text style={styles.logSetBtnText}>Log Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add Exercise Trigger Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowExerciseModal(true)}>
          <Text style={styles.addBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Finish Workout Trigger Button */}
        <TouchableOpacity 
          style={[styles.finishBtn, activeExercises.length === 0 && styles.disabledBtn]} 
          onPress={handleFinishWorkout}
          disabled={saving || activeExercises.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.finishBtnText}>Finish Workout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Exercises Selector Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search exercises or muscle groups..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.exerciseItem} onPress={() => handleAddExercise(item)}>
                <Text style={styles.exerciseItemName}>{item.name}</Text>
                <Text style={styles.exerciseItemMuscle}>{item.muscle_group}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.flatListContent}
          />
        </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cancelLink: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    color: '#FFFFFF',
    padding: 14,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  emptyPlaceholder: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#7A7A7A',
    fontSize: 12,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  exerciseMuscle: {
    fontSize: 11,
    color: '#D4FF13',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  removeLink: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  setsTable: {
    marginBottom: 16,
    borderTopWidth: 1.5,
    borderColor: '#2D2D37',
    paddingTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tableCol: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7A7A',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  colSet: { width: 45 },
  colWeight: { flex: 1 },
  colReps: { flex: 1 },
  colAction: { width: 40, alignItems: 'center', justifyContent: 'center' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderColor: '#121212',
    alignItems: 'center',
  },
  tableCell: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  setNumCell: {
    fontWeight: '900',
    color: '#D4FF13',
  },
  exerciseNotesInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2D2D37',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  tableInput: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#2D2D37',
    borderRadius: 8,
    color: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  deleteSetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSetBtnText: {
    color: '#EF4444',
    fontSize: 14,
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderColor: '#2D2D37',
    paddingTop: 16,
  },
  inputContainer: {
    flex: 1.2,
    marginRight: 10,
  },
  inputLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  setFieldInput: {
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 12,
    color: '#FFFFFF',
    padding: 10,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  logSetBtn: {
    flex: 1.5,
    backgroundColor: '#D4FF13',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logSetBtnText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '900',
  },
  addBtn: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    borderRadius: 30, // pill
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  addBtnText: {
    color: '#D4FF13',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  finishBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30, // pill
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  finishBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerBanner: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4FF13', // neon green border
    zIndex: 9999,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  timerContent: {
    flexDirection: 'column',
  },
  timerTitle: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerCountdown: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  timerButtons: {
    flexDirection: 'row',
  },
  timerControlBtn: {
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
  },
  timerSkipBtn: {
    borderColor: '#EF4444',
  },
  timerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderColor: '#2D2D37',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseText: {
    color: '#D4FF13',
    fontSize: 15,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    color: '#FFFFFF',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 14,
  },
  exerciseItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exerciseItemMuscle: {
    fontSize: 11,
    color: '#D4FF13',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1.5,
    backgroundColor: '#2D2D37',
  },
  flatListContent: {
    paddingBottom: 40,
  },
});
