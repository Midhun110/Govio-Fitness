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
  Modal
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';
import { MOCK_EXERCISES } from '../data/exercisesData';
import { getLocalCustomExercises } from '../utils/customExercises';
import { Routine, getLocalRoutines, deleteLocalRoutine, renameLocalRoutine } from '../utils/customRoutines';
import * as SecureStore from 'expo-secure-store';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

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
  const [activeTab, setActiveTab] = useState<'muscle' | 'custom'>('muscle');
  
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
    if (user.id === 'mock-user-id-12345') {
      const customs = await getLocalCustomExercises();
      setExercisesList([...MOCK_EXERCISES, ...customs]);
      
      try {
        const localData = await SecureStore.getItemAsync('govio_workouts');
        const workoutsList = localData ? JSON.parse(localData) : [];
        const suggestions = calculateProgressionSuggestions(workoutsList);
        setProgressionSuggestions(suggestions);
      } catch (e) {
        console.error(e);
      }

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
      setExercisesList([...MOCK_EXERCISES, ...customs]);
    } finally {
      setLoading(false);
    }
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
      selectedExercises = exercisesList.filter((ex) => {
        const muscle = ex.muscle_group.toLowerCase();
        if (cat === 'chest') return muscle === 'chest';
        if (cat === 'back') return muscle === 'back';
        if (cat === 'shoulders') return muscle === 'shoulders';
        if (cat === 'legs') return muscle === 'legs';
        if (cat === 'biceps') return muscle === 'biceps';
        if (cat === 'triceps') return muscle === 'triceps';
        if (cat === 'forearms') return muscle === 'forearms';
        if (cat === 'abs') return muscle === 'abs' || muscle === 'core';
        if (cat === 'glutes') {
          return muscle === 'glutes' || (muscle === 'legs' && (ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('squat')));
        }
        if (cat === 'calves') {
          return muscle === 'calves' || (muscle === 'legs' && ex.name.toLowerCase().includes('calf'));
        }
        return muscle === cat;
      });

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
      </View>

      {activeTab === 'muscle' ? (
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
      ) : (
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
                      <Text style={styles.routineCardHint}>Tap to start • Long-press to edit</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.backToRoutinesBtn}
                onPress={() => setCustomMode('routines')}
              >
                <Text style={styles.backToRoutinesBtnText}>← BACK TO SAVED ROUTINES</Text>
              </TouchableOpacity>
              <View style={styles.searchBarContainer}>
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search exercises..."
                  placeholderTextColor="#6B7280"
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
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exName}>{item.name}</Text>
                        <Text style={styles.exMuscle}>{item.muscle_group.toUpperCase()}</Text>
                        {progressionSuggestions[item.id] && (
                          <View style={styles.suggestionPill}>
                            <Text style={styles.suggestionText}>📈 {progressionSuggestions[item.id]}</Text>
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
});
