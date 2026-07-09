import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { MOCK_WORKOUTS } from '../screens/HomeScreen';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';

interface AnalyticsViewProps {
  session: Session | null;
}

interface MuscleFreq {
  muscle: string;
  count7Days: number;
  count30Days: number;
  lastTrainedDate: Date | null;
  untrained: boolean;
}

interface StrengthPoint {
  date: string;
  weight: number;
}

export default function AnalyticsView({ session }: AnalyticsViewProps) {
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [hasWorkouts, setHasWorkouts] = useState(false);

  // States for computed metrics
  const [streak, setStreak] = useState(0);
  const [muscleBalance, setMuscleBalance] = useState<MuscleFreq[]>([]);
  
  // Exercise Selection & Strength Progression
  const [exerciseOptions, setExerciseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEx, setSelectedEx] = useState<{ id: string; name: string } | null>(null);
  const [strengthHistory, setStrengthHistory] = useState<StrengthPoint[]>([]);
  const [showExModal, setShowExModal] = useState(false);

  // Raw workouts data cache
  const [workoutsCache, setWorkoutsCache] = useState<any[]>([]);

  const calculateStreak = (workoutDates: string[]): number => {
    if (workoutDates.length === 0) return 0;
    const dates = Array.from(new Set(workoutDates))
      .map((d) => {
        const dateObj = new Date(d);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecent = dates[0];
    if (mostRecent < yesterday) return 0;

    let currentStreak = 1;
    let currentDate = mostRecent;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i];
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        currentDate = prevDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    return currentStreak;
  };

  const processAnalytics = (workoutsList: any[]) => {
    if (!workoutsList || workoutsList.length === 0) {
      setHasWorkouts(false);
      return;
    }
    setHasWorkouts(true);
    setWorkoutsCache(workoutsList);

    // 1. Calculate Streak
    const workoutDates = workoutsList.map((w) => w.date).filter(Boolean);
    setStreak(calculateStreak(workoutDates));

    // 2. Extract Unique Exercises logged in history
    const uniqueExs: Array<{ id: string; name: string }> = [];
    workoutsList.forEach((w) => {
      const sets = w.workout_sets || w.sets || [];
      sets.forEach((set: any) => {
        const exId = set.exercises?.id || set.exercise_id;
        const exName = set.exercises?.name || set.exercise_name;
        if (exId && exName && !uniqueExs.some((e) => e.id === exId)) {
          uniqueExs.push({ id: exId, name: exName });
        }
      });
    });

    uniqueExs.sort((a, b) => a.name.localeCompare(b.name));
    setExerciseOptions(uniqueExs);

    // Select default exercise if none is selected
    if (uniqueExs.length > 0 && !selectedEx) {
      setSelectedEx(uniqueExs[0]);
    }

    // 3. Compute Muscle Group Balance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ALL_MUSCLES = [
      'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Forearms', 'Glutes', 'Calves'
    ];

    const balanceMap: { [key: string]: MuscleFreq } = {};
    ALL_MUSCLES.forEach((m) => {
      balanceMap[m] = {
        muscle: m,
        count7Days: 0,
        count30Days: 0,
        lastTrainedDate: null,
        untrained: true,
      };
    });

    workoutsList.forEach((w) => {
      const wDate = new Date(w.date);
      const isWithin7 = wDate >= sevenDaysAgo;
      const isWithin30 = wDate >= thirtyDaysAgo;

      const sets = w.workout_sets || w.sets || [];
      const musclesInWorkout = new Set<string>();

      sets.forEach((set: any) => {
        let muscle = set.exercises?.muscle_group || set.muscle_group || '';
        if (muscle) {
          muscle = muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase();
          if (muscle === 'Core') muscle = 'Abs';
          if (ALL_MUSCLES.includes(muscle)) {
            musclesInWorkout.add(muscle);
          }
        }
      });

      musclesInWorkout.forEach((muscle) => {
        const item = balanceMap[muscle];
        if (isWithin7) item.count7Days++;
        if (isWithin30) item.count30Days++;
        
        if (!item.lastTrainedDate || wDate > item.lastTrainedDate) {
          item.lastTrainedDate = wDate;
        }
      });
    });

    // Update untrained status
    Object.keys(balanceMap).forEach((key) => {
      const item = balanceMap[key];
      if (item.lastTrainedDate) {
        const diffMs = today.getTime() - item.lastTrainedDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        item.untrained = diffDays >= 7;
      } else {
        item.untrained = true;
      }
    });

    const balanceList = Object.values(balanceMap).sort((a, b) => b.count30Days - a.count30Days);
    setMuscleBalance(balanceList);
  };

  // Process selected exercise strength progression over time
  useEffect(() => {
    if (!selectedEx || workoutsCache.length === 0) return;

    const points: StrengthPoint[] = [];
    workoutsCache.forEach((w) => {
      const sets = w.workout_sets || w.sets || [];
      const matchingSets = sets.filter((set: any) => {
        const exId = set.exercises?.id || set.exercise_id;
        return exId === selectedEx.id;
      });

      if (matchingSets.length > 0) {
        const maxWeight = Math.max(...matchingSets.map((s: any) => parseFloat(s.weight_kg) || 0));
        points.push({
          date: w.date,
          weight: maxWeight,
        });
      }
    });

    // Sort chronologically and limit to last 10 points
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStrengthHistory(points.slice(-10));
  }, [selectedEx, workoutsCache]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    if (!user || user.id === 'mock-user-id-12345') {
      try {
        const localData = await SecureStoreGet();
        const workoutsList = localData && localData.length > 0 ? localData : MOCK_WORKOUTS;
        // Make sure it calculates empty state correctly if there are no workouts at all
        if (workoutsList.length === 0) {
          setHasWorkouts(false);
        } else {
          processAnalytics(workoutsList);
        }
      } catch (e) {
        processAnalytics(MOCK_WORKOUTS);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          workout_sets (
            id,
            reps,
            weight_kg,
            exercise_id,
            exercises (
              id,
              name,
              muscle_group
            )
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      processAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load from SecureStore (local mock helper)
  const SecureStoreGet = async () => {
    try {
      const local = await SecureStore.getItemAsync('govio_workouts');
      return local ? JSON.parse(local) : null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
      </View>
    );
  }

  // RENDER EMPTY STATE
  if (!hasWorkouts) {
    return (
      <View style={styles.container}>
        <Text style={styles.tabTitle}>Analytics</Text>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateEmoji}>📊</Text>
          <Text style={styles.emptyStateTitle}>No Workout Data Yet</Text>
          <Text style={styles.emptyStateText}>
            Consistency is key! Start logging your workout splits and active sessions to generate progression charts, streaks, and muscle balance maps.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateBtn}
            onPress={() => navigation.navigate('StartWorkout', { session: session! })}
          >
            <Text style={styles.emptyStateBtnText}>START YOUR FIRST WORKOUT ⚡</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // CUSTOM LINE CHART MATH (SVG)
  const chartHeight = 150;
  const padding = 20;
  const windowWidth = Dimensions.get('window').width;
  // Account for sidebar/padding in layout
  const chartWidth = windowWidth - 40 - padding * 2;
  const plotWidth = chartWidth - padding;
  const plotHeight = chartHeight - padding * 2;

  let maxWeight = 10;
  let minWeight = 0;
  let pointsPath = '';
  let svgPoints: Array<{ x: number; y: number; weight: number; date: string }> = [];

  if (strengthHistory.length > 0) {
    const weights = strengthHistory.map((p) => p.weight);
    maxWeight = Math.max(...weights);
    minWeight = Math.min(...weights);

    // Padding on min/max to keep points off the absolute borders
    const weightDiff = maxWeight - minWeight;
    if (weightDiff === 0) {
      maxWeight = maxWeight + 10;
      minWeight = Math.max(0, minWeight - 10);
    } else {
      maxWeight = maxWeight + weightDiff * 0.15;
      minWeight = Math.max(0, minWeight - weightDiff * 0.15);
    }

    const totalPoints = strengthHistory.length;
    svgPoints = strengthHistory.map((pt, idx) => {
      const x = padding * 1.5 + (totalPoints > 1 ? (idx / (totalPoints - 1)) * plotWidth : plotWidth / 2);
      const y = padding + plotHeight - ((pt.weight - minWeight) / (maxWeight - minWeight)) * plotHeight;
      return { x, y, weight: pt.weight, date: pt.date };
    });

    // Create SVG Path string
    pointsPath = svgPoints.reduce((path, pt, idx) => {
      return path + `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `;
    }, '');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.tabTitle}>Analytics</Text>

      {/* Streak Dashboard Card */}
      <View style={styles.card}>
        <View style={styles.streakContainer}>
          <Text style={styles.streakIcon}>🔥</Text>
          <View style={styles.streakTextContent}>
            <Text style={styles.streakTitle}>WORKOUT STREAK</Text>
            <Text style={styles.streakCount}>
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </View>
        <Text style={styles.streakMotivate}>
          {streak > 0
            ? 'Keep the momentum going! Great training consistency.'
            : 'Get back into the groove. Log a workout today to start a new streak!'}
        </Text>
      </View>

      {/* Strength Progression Line Graph */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>Strength Progression</Text>
          {selectedEx && (
            <TouchableOpacity style={styles.dropdownSelect} onPress={() => setShowExModal(true)}>
              <Text style={styles.dropdownText}>{selectedEx.name.toUpperCase()} ▾</Text>
            </TouchableOpacity>
          )}
        </View>

        {strengthHistory.length > 0 ? (
          <View style={styles.chartWrapper}>
            <Svg height={chartHeight} width={chartWidth + padding * 2}>
              {/* Horizontal Grid lines (4 divisions) */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = padding + ratio * plotHeight;
                const value = Math.round(maxWeight - ratio * (maxWeight - minWeight));
                return (
                  <G key={idx}>
                    <Line
                      x1={padding * 1.5}
                      y1={y}
                      x2={chartWidth + padding}
                      y2={y}
                      stroke="#2A2A2A"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <SvgText
                      x={10}
                      y={y + 4}
                      fill="#7A7A7A"
                      fontSize={9}
                      fontWeight="700"
                    >
                      {value}kg
                    </SvgText>
                  </G>
                );
              })}

              {/* Trend Path */}
              {pointsPath !== '' && (
                <Path
                  d={pointsPath}
                  fill="none"
                  stroke="#D4FF13"
                  strokeWidth={3}
                />
              )}

              {/* Data Points */}
              {svgPoints.map((pt, idx) => (
                <G key={idx}>
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={5}
                    fill="#0D141D"
                    stroke="#D4FF13"
                    strokeWidth={2.5}
                  />
                  <SvgText
                    x={pt.x}
                    y={pt.y - 8}
                    fill="#FFFFFF"
                    fontSize={8}
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {pt.weight}
                  </SvgText>
                  <SvgText
                    x={pt.x}
                    y={chartHeight - 4}
                    fill="#7A7A7A"
                    fontSize={8}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {formatShortDate(pt.date)}
                  </SvgText>
                </G>
              ))}
            </Svg>
          </View>
        ) : (
          <Text style={styles.emptyChartText}>No records logged for this exercise yet.</Text>
        )}
      </View>

      {/* Muscle Group Balance View */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Muscle Group Balance</Text>
        <Text style={styles.muscleSubtext}>Days trained in the last 7d vs 30d splits</Text>
        
        {muscleBalance.map((item, idx) => {
          const maxDays = 12; // Cap scale at 12 sessions
          const progressPct = `${Math.min(100, Math.max(10, (item.count30Days / maxDays) * 100))}%`;

          return (
            <View key={idx} style={styles.muscleBalanceRow}>
              <View style={styles.muscleInfoCol}>
                <Text style={styles.muscleNameText}>{item.muscle}</Text>
                <Text style={styles.muscleStatsText}>
                  {item.count7Days}x (7d)  |  {item.count30Days}x (30d)
                </Text>
              </View>

              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarTrack}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: progressPct as any },
                      item.untrained && styles.progressBarFillUntrained
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.statusCol}>
                {item.untrained ? (
                  <View style={[styles.statusBadge, styles.statusBadgeUntrained]}>
                    <Text style={[styles.statusBadgeText, styles.statusBadgeTextUntrained]}>
                      UNTRAINED
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Exercise Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showExModal}
        onRequestClose={() => setShowExModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowExModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT EXERCISE</Text>
              <TouchableOpacity onPress={() => setShowExModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={exerciseOptions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItemRow,
                    selectedEx?.id === item.id && styles.modalItemRowActive
                  ]}
                  onPress={() => {
                    setSelectedEx(item);
                    setShowExModal(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.modalItemText,
                      selectedEx?.id === item.id && styles.modalItemTextActive
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#0D141D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D141D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakIcon: {
    fontSize: 42,
    marginRight: 16,
  },
  streakTextContent: {
    flexDirection: 'column',
  },
  streakTitle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakCount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  streakMotivate: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 18,
  },
  dropdownSelect: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3D4A3D',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dropdownText: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chartWrapper: {
    alignItems: 'center',
    paddingTop: 10,
  },
  emptyChartText: {
    color: '#7A7A7A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 40,
  },
  muscleSubtext: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 20,
  },
  muscleBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 10,
  },
  muscleInfoCol: {
    flex: 1.5,
  },
  muscleNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  muscleStatsText: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBarWrapper: {
    flex: 1.2,
    marginHorizontal: 10,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#192029',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4FF13',
    borderRadius: 4,
  },
  progressBarFillUntrained: {
    backgroundColor: '#EF4444',
    opacity: 0.5,
  },
  statusCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeUntrained: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeTextUntrained: {
    color: '#EF4444',
  },
  emptyStateCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateBtnText: {
    color: '#0D141D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    maxHeight: '60%',
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
    fontSize: 15,
    fontWeight: '900',
  },
  modalCloseText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '700',
  },
  modalList: {
    padding: 10,
  },
  modalItemRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalItemRowActive: {
    backgroundColor: '#2A2A2A',
  },
  modalItemText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '700',
  },
  modalItemTextActive: {
    color: '#D4FF13',
    fontWeight: '800',
  },
});
