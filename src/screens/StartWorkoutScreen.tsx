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
  Image
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';
import { MOCK_EXERCISES } from '../data/exercisesData';
import { getLocalCustomExercises } from '../utils/customExercises';
import * as SecureStore from 'expo-secure-store';

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
  { key: 'Glutes', label: 'Glutes', icon: '🎯' },
  { key: 'Calves', label: 'Calves', icon: '👟' },
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
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  
  // Custom selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomIds, setSelectedCustomIds] = useState<Set<string>>(new Set());

  // Smart suggestions states
  const [progressionSuggestions, setProgressionSuggestions] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    fetchExercises();
  }, []);

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
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.muscleCard, isSelected && styles.muscleCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMuscle(m.key)}
                >
                  {MUSCLE_IMAGES[m.key] ? (
                    <Image
                      source={MUSCLE_IMAGES[m.key]}
                      style={styles.muscleImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.muscleIcon}>{m.icon}</Text>
                  )}
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

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
          <Text style={styles.startBtnText}>START WORKOUT SESSION 🏋️</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D141D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D141D',
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
    borderBottomColor: '#3D4A3D',
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
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  muscleCardSelected: {
    borderColor: '#D4FF13',
    backgroundColor: '#2A2A2A',
  },
  muscleImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  muscleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  muscleLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    borderColor: '#3D4A3D',
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
    borderColor: '#3D4A3D',
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
    color: '#0D141D',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#3D4A3D',
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
    color: '#0D141D',
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
});
