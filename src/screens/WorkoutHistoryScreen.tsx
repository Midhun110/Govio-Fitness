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
  FlatList,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { MOCK_WORKOUTS } from './HomeScreen';

type WorkoutHistoryScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutHistory'>;

type WorkoutHistoryScreenProps = {
  route: WorkoutHistoryScreenRouteProp;
};

interface WorkoutItem {
  id: string;
  date: string;
  notes: string | null;
  exercisesCount: number;
  groupedExercises: Array<{
    name: string;
    muscleGroup: string;
    notes?: string | null;
    sets: Array<{
      set_number: number;
      reps: number;
      weight_kg: number;
    }>;
  }>;
}

interface GroupedDateWorkouts {
  date: string;
  muscleGroupsText: string;
  exercisesCount: number;
  workouts: WorkoutItem[];
}

export default function WorkoutHistoryScreen({ route }: WorkoutHistoryScreenProps) {
  const session = route.params.session;
  const user = session.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<GroupedDateWorkouts[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const groupSetsByExercise = (sets: any[]) => {
    const groups: { [key: string]: { name: string; muscleGroup: string; notes?: string | null; sets: any[] } } = {};
    
    sets.forEach((set) => {
      const name = set.exercises?.name || set.exercise_name || 'Unknown Exercise';
      const muscleGroup = set.exercises?.muscle_group || set.muscle_group || 'other';
      const notes = set.notes || null;

      if (!groups[name]) {
        groups[name] = {
          name,
          muscleGroup,
          notes,
          sets: [],
        };
      } else if (notes && !groups[name].notes) {
        groups[name].notes = notes;
      }
      groups[name].sets.push({
        set_number: set.set_number,
        reps: set.reps,
        weight_kg: parseFloat(set.weight_kg),
      });
    });

    // Sort sets chronologically inside exercise
    Object.keys(groups).forEach((key) => {
      groups[key].sets.sort((a, b) => a.set_number - b.set_number);
    });

    return Object.values(groups);
  };

  const groupWorkoutsByDate = (workoutsList: WorkoutItem[]): GroupedDateWorkouts[] => {
    const map: { [date: string]: GroupedDateWorkouts } = {};
    const orderedDates: string[] = [];

    workoutsList.forEach((w) => {
      const date = w.date;
      if (!map[date]) {
        map[date] = {
          date,
          muscleGroupsText: '',
          exercisesCount: 0,
          workouts: [],
        };
        orderedDates.push(date);
      }
      map[date].workouts.push(w);
    });

    orderedDates.forEach((date) => {
      const dayGroup = map[date];
      const muscleGroups = new Set<string>();
      let totalExercises = 0;

      dayGroup.workouts.forEach((w) => {
        totalExercises += w.groupedExercises.length;
        w.groupedExercises.forEach((ge) => {
          if (ge.muscleGroup) {
            const mg = ge.muscleGroup.charAt(0).toUpperCase() + ge.muscleGroup.slice(1).toLowerCase();
            muscleGroups.add(mg);
          }
        });
      });

      dayGroup.exercisesCount = totalExercises;
      dayGroup.muscleGroupsText = Array.from(muscleGroups).join(' + ') || 'General';
    });

    return orderedDates.map((d) => map[d]);
  };

  const fetchWorkoutsHistory = async () => {
    if (user.id === 'mock-user-id-12345') {
      // Load mock items
      const formattedMock: WorkoutItem[] = MOCK_WORKOUTS.map((mw) => ({
        id: mw.id,
        date: mw.date,
        notes: mw.notes,
        exercisesCount: mw.exercisesCount,
        groupedExercises: groupSetsByExercise(mw.sets),
      }));
      const grouped = groupWorkoutsByDate(formattedMock);
      setWorkouts(grouped);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          notes,
          workout_sets (
            id,
            set_number,
            reps,
            weight_kg,
            notes,
            exercises (
              name,
              muscle_group
            )
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData: WorkoutItem[] = (data || []).map((w: any) => {
        const sets = w.workout_sets || [];
        const grouped = groupSetsByExercise(sets);
        return {
          id: w.id,
          date: w.date,
          notes: w.notes,
          exercisesCount: grouped.length,
          groupedExercises: grouped,
        };
      });

      const grouped = groupWorkoutsByDate(formattedData);
      setWorkouts(grouped);
    } catch (err) {
      console.error('Error fetching workout history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutsHistory();
  }, []);

  const toggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    // Standardize to local time zone display
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 80 }} /> {/* Spacer for balance */}
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No workouts recorded yet</Text>
          <Text style={styles.emptySubtitle}>Log your training sessions on the dashboard to build your history logbook</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isExpanded = expandedDate === item.date;
            return (
              <View style={styles.workoutCard}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.date)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutDate}>{formatDisplayDate(item.date)}</Text>
                    <Text style={styles.workoutSummary}>
                      {item.muscleGroupsText}
                    </Text>
                    <Text style={styles.workoutExercisesCount}>
                      {item.exercisesCount} exercise{item.exercisesCount !== 1 ? 's' : ''} logged
                    </Text>
                  </View>
                  <Text style={styles.expandIndicator}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.detailsBox}>
                    {item.workouts.map((w, wIdx) => (
                      <View key={w.id} style={[styles.singleWorkoutContainer, wIdx > 0 && styles.multiWorkoutSeparator]}>
                        {item.workouts.length > 1 && (
                          <Text style={styles.workoutInstanceHeader}>Session #{item.workouts.length - wIdx}</Text>
                        )}
                        {w.notes && (
                          <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Notes</Text>
                            <Text style={styles.notesContent}>{w.notes}</Text>
                          </View>
                        )}

                        {w.groupedExercises.map((ge) => (
                          <View key={ge.name} style={styles.exerciseDetailItem}>
                            <Text style={styles.exerciseName}>{ge.name}</Text>
                            <Text style={styles.exerciseMuscle}>{ge.muscleGroup}</Text>
                            
                            {ge.notes ? (
                              <View style={styles.exerciseNotesBox}>
                                <Text style={styles.exerciseNotesLabel}>EXERCISE NOTES</Text>
                                <Text style={styles.exerciseNotesContent}>{ge.notes}</Text>
                              </View>
                            ) : null}

                            <View style={styles.setsGrid}>
                              {ge.sets.map((set) => (
                                <View key={set.set_number} style={styles.setRow}>
                                  <Text style={styles.setNum}>Set {set.set_number}</Text>
                                  <Text style={styles.setWeight}>{set.weight_kg} kg</Text>
                                  <Text style={styles.setReps}>x {set.reps}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderColor: '#222222',
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#D4FF13',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#A0A0A0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  workoutCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24, // highly rounded corners
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  workoutSummary: {
    fontSize: 13,
    color: '#D4FF13',
    fontWeight: '800',
    marginTop: 4,
  },
  notesPreview: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 6,
  },
  expandIndicator: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 12,
  },
  detailsBox: {
    borderTopWidth: 1.5,
    borderColor: '#222222',
    padding: 16,
    backgroundColor: '#000000',
  },
  notesContainer: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesContent: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseDetailItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderColor: '#222222',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exerciseMuscle: {
    fontSize: 11,
    color: '#D4FF13',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  exerciseNotesBox: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  exerciseNotesLabel: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  exerciseNotesContent: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  setsGrid: {
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#222222',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  setNum: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '800',
  },
  setWeight: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginRight: 10,
  },
  setReps: {
    color: '#A0A0A0',
    fontSize: 13,
    width: 40,
    textAlign: 'right',
    fontWeight: '700',
  },
  workoutExercisesCount: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  singleWorkoutContainer: {
    paddingVertical: 8,
  },
  multiWorkoutSeparator: {
    borderTopWidth: 1.5,
    borderColor: '#222222',
    marginTop: 16,
    paddingTop: 16,
  },
  workoutInstanceHeader: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
});
