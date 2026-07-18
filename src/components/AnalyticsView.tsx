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

interface NormalizedSet {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  reps: number;
  weight: number;
}

interface NormalizedWorkout {
  date: string;
  sets: NormalizedSet[];
}

export default function AnalyticsView({ session }: AnalyticsViewProps) {
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [hasWorkouts, setHasWorkouts] = useState(false);
  const [workoutsCache, setWorkoutsCache] = useState<any[]>([]);

  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'volume' | 'strength' | 'consistency'>('volume');

  // Streak state
  const [streak, setStreak] = useState(0);

  // Volume tab states
  const [selectedVolumeMuscle, setSelectedVolumeMuscle] = useState<string>('Chest');
  const [volumeDateRange, setVolumeDateRange] = useState<'4wk' | '12wk' | 'all'>('12wk');

  // Strength tab states
  const [exerciseOptions, setExerciseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEx, setSelectedEx] = useState<{ id: string; name: string } | null>(null);
  const [showExModal, setShowExModal] = useState(false);

  // Load local mock workouts helper
  const SecureStoreGet = async () => {
    try {
      const local = await SecureStore.getItemAsync('govio_workouts');
      return local ? JSON.parse(local) : null;
    } catch (e) {
      return null;
    }
  };

  // Calculate workout streak
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

  const fetchAnalyticsData = async () => {
    setLoading(true);
    if (!user || user.id === 'mock-user-id-12345') {
      // Bounded delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        const localData = await SecureStoreGet();
        const workoutsList = localData && localData.length > 0 ? localData : MOCK_WORKOUTS;
        
        if (workoutsList.length === 0) {
          setHasWorkouts(false);
        } else {
          setHasWorkouts(true);
          setWorkoutsCache(workoutsList);
          
          // Compute streak
          const dates = workoutsList.map((w: any) => w.date).filter(Boolean);
          setStreak(calculateStreak(dates));

          // Extract unique exercises logged
          const uniqueExs: Array<{ id: string; name: string }> = [];
          workoutsList.forEach((w: any) => {
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
          if (uniqueExs.length > 0 && !selectedEx) {
            setSelectedEx(uniqueExs[0]);
          }
        }
      } catch (e) {
        setWorkoutsCache(MOCK_WORKOUTS);
        setHasWorkouts(true);
      } finally {
        setLoading(false);
      }
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

      if (data && data.length > 0) {
        setHasWorkouts(true);
        setWorkoutsCache(data);
        const dates = data.map((w) => w.date).filter(Boolean);
        setStreak(calculateStreak(dates));

        const uniqueExs: Array<{ id: string; name: string }> = [];
        data.forEach((w) => {
          const sets = w.workout_sets || [];
          sets.forEach((set: any) => {
            const exId = set.exercises?.id || set.exercise_id;
            const exName = set.exercises?.name;
            if (exId && exName && !uniqueExs.some((e) => e.id === exId)) {
              uniqueExs.push({ id: exId, name: exName });
            }
          });
        });
        uniqueExs.sort((a, b) => a.name.localeCompare(b.name));
        setExerciseOptions(uniqueExs);
        if (uniqueExs.length > 0 && !selectedEx) {
          setSelectedEx(uniqueExs[0]);
        }
      } else {
        setHasWorkouts(false);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Standardize workout data representation
  const getNormalizedWorkouts = (): NormalizedWorkout[] => {
    return workoutsCache.map((w) => {
      const rawSets = w.workout_sets || w.sets || [];
      const sets: NormalizedSet[] = rawSets.map((s: any) => {
        return {
          exerciseId: s.exercises?.id || s.exercise_id || '',
          exerciseName: s.exercises?.name || s.exercise_name || '',
          muscleGroup: s.exercises?.muscle_group || s.muscle_group || '',
          reps: parseInt(s.reps, 10) || 0,
          weight: parseFloat(s.weight_kg) || 0,
        };
      });
      return {
        date: w.date,
        sets,
      };
    });
  };

  // LOADING SKELETON RENDERER
  const renderLoadingSkeleton = () => (
    <View style={styles.container}>
      <Text style={styles.tabTitle}>Analytics</Text>
      
      {/* Tab Switcher Skeleton */}
      <View style={styles.skeletonTabs}>
        <View style={styles.skeletonTabButton} />
        <View style={styles.skeletonTabButton} />
        <View style={styles.skeletonTabButton} />
      </View>

      {/* Main Graph Card Skeleton */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonHeaderRow}>
          <View style={styles.skeletonTitleLine} />
          <View style={styles.skeletonDropdown} />
        </View>
        <View style={styles.skeletonGraphPlaceholder} />
      </View>

      {/* Secondary Metrics Card Skeleton */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonHeaderRow}>
          <View style={styles.skeletonTitleLine2} />
        </View>
        <View style={styles.skeletonStatsPlaceholder} />
      </View>
    </View>
  );

  if (loading) {
    return renderLoadingSkeleton();
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

  const normalizedWorkouts = getNormalizedWorkouts();

  // 1. VOLUME CHART CALCULATIONS
  const getWeeklyVolumeData = () => {
    // Determine date limit
    let limitDate = new Date();
    if (volumeDateRange === '4wk') {
      limitDate.setDate(limitDate.getDate() - 28);
    } else if (volumeDateRange === '12wk') {
      limitDate.setDate(limitDate.getDate() - 84);
    } else {
      limitDate.setFullYear(limitDate.getFullYear() - 5); // 5 years ago
    }

    const filtered = normalizedWorkouts.filter(w => new Date(w.date) >= limitDate);

    // Group sets by week starting on Sunday
    const weekMap: { [key: string]: number } = {};

    filtered.forEach((wk) => {
      const d = new Date(wk.date);
      const day = d.getDay();
      const diff = d.getDate() - day; // Adjust to Sunday
      const sunday = new Date(d.setDate(diff));
      sunday.setHours(0, 0, 0, 0);
      const sundayStr = sunday.toISOString().split('T')[0];

      // Sum volume for target muscle
      const muscleVol = wk.sets
        .filter(s => s.muscleGroup.toLowerCase() === selectedVolumeMuscle.toLowerCase())
        .reduce((sum, s) => sum + s.weight * s.reps, 0);

      if (muscleVol > 0) {
        weekMap[sundayStr] = (weekMap[sundayStr] || 0) + muscleVol;
      }
    });

    // Construct final sorted array
    const sortedWeeks = Object.keys(weekMap).sort().map((dateStr) => {
      const d = new Date(dateStr);
      return {
        dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        volume: weekMap[dateStr],
      };
    });

    return sortedWeeks;
  };

  const volumePoints = getWeeklyVolumeData();

  // 2. STRENGTH (Estimated 1RM) CALCULATIONS
  const getStrengthData = () => {
    if (!selectedEx) return [];
    
    const points: Array<{ date: string; label: string; oneRepMax: number }> = [];

    normalizedWorkouts.forEach((w) => {
      const matchedSets = w.sets.filter((s) => s.exerciseId === selectedEx.id);
      if (matchedSets.length > 0) {
        // Compute Epley 1RM: Weight * (1 + Reps/30)
        const max1RM = Math.max(
          ...matchedSets.map((s) => s.weight * (1 + s.reps / 30))
        );
        
        const d = new Date(w.date);
        points.push({
          date: w.date,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          oneRepMax: Math.round(max1RM),
        });
      }
    });

    // Sort chronologically and limit to last 10 points
    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10);
  };

  const strengthPoints = getStrengthData();

  // 3. CONSISTENCY HEATMAP CALCULATIONS
  const getHeatmapGrid = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the Monday of the current week, then go back 11 weeks (to get 12 weeks total)
    const day = today.getDay();
    const diffToMonday = today.getDate() - (day === 0 ? 6 : day - 1);
    const currentMonday = new Date(today.getTime());
    currentMonday.setDate(diffToMonday);
    
    const startMonday = new Date(currentMonday.getTime());
    startMonday.setDate(startMonday.getDate() - 11 * 7); // Go back 11 weeks

    const grid: Array<Array<{ dateStr: string; volume: number; hasWorkout: boolean }>> = [];
    
    // Create 12 columns (weeks)
    for (let w = 0; w < 12; w++) {
      const weekCols: Array<{ dateStr: string; volume: number; hasWorkout: boolean }> = [];
      // 7 rows (Mon to Sun)
      for (let d = 0; d < 7; d++) {
        const targetDate = new Date(startMonday.getTime());
        targetDate.setDate(targetDate.getDate() + w * 7 + d);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        // Sum volume on this day
        const workoutOnDate = normalizedWorkouts.find((wk) => wk.date === dateStr);
        let vol = 0;
        if (workoutOnDate) {
          vol = workoutOnDate.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        }
        
        weekCols.push({
          dateStr,
          volume: vol,
          hasWorkout: !!workoutOnDate,
        });
      }
      grid.push(weekCols);
    }
    return grid;
  };

  const heatmapGrid = getHeatmapGrid();

  // HELPER TO RENDER HEATMAP CELLS BY ROW (Monday, Tuesday, etc.)
  const renderHeatmapRow = (dayIdx: number) => {
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    return (
      <View key={dayIdx} style={styles.heatmapRow}>
        <Text style={styles.heatmapDayLabel}>{DAY_LABELS[dayIdx]}</Text>
        <View style={styles.heatmapRowCells}>
          {heatmapGrid.map((week, weekIdx) => {
            const cell = week[dayIdx];
            let cellStyle = styles.heatmapCellEmpty;
            
            if (cell.hasWorkout) {
              if (cell.volume < 1000) {
                cellStyle = styles.heatmapCellLow;
              } else if (cell.volume < 4000) {
                cellStyle = styles.heatmapCellMid;
              } else {
                cellStyle = styles.heatmapCellHigh;
              }
            }

            return (
              <View 
                key={weekIdx} 
                style={[styles.heatmapCell, cellStyle]} 
              />
            );
          })}
        </View>
      </View>
    );
  };

  // CUSTOM LINE CHART SVG PLOTTER (Reusable)
  const drawSvgLineChart = (dataPoints: Array<{ label: string; value: number }>, unit: string = '') => {
    const svgHeight = 160;
    const padding = 20;
    const windowWidth = Dimensions.get('window').width;
    const svgWidth = windowWidth - 40 - padding * 2;
    const plotWidth = svgWidth - padding * 1.5;
    const plotHeight = svgHeight - padding * 2.5;

    if (dataPoints.length === 0) {
      return (
        <View style={styles.emptyChartBox}>
          <Text style={styles.emptyChartText}>No progression logs found in this period.</Text>
        </View>
      );
    }

    const values = dataPoints.map((p) => p.value);
    let maxVal = Math.max(...values);
    let minVal = Math.min(...values);

    const valDiff = maxVal - minVal;
    if (valDiff === 0) {
      maxVal = maxVal + 10;
      minVal = Math.max(0, minVal - 10);
    } else {
      maxVal = maxVal + valDiff * 0.15;
      minVal = Math.max(0, minVal - valDiff * 0.15);
    }

    const totalPoints = dataPoints.length;
    const points = dataPoints.map((pt, idx) => {
      const x = padding * 1.5 + (totalPoints > 1 ? (idx / (totalPoints - 1)) * plotWidth : plotWidth / 2);
      const y = padding + plotHeight - ((pt.value - minVal) / (maxVal - minVal)) * plotHeight;
      return { x, y, value: pt.value, label: pt.label };
    });

    const pathString = points.reduce((path, pt, idx) => {
      return path + `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `;
    }, '');

    return (
      <View style={styles.chartWrapper}>
        <Svg height={svgHeight} width={svgWidth + padding * 2}>
          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = padding + ratio * plotHeight;
            const value = Math.round(maxVal - ratio * (maxVal - minVal));
            return (
              <G key={idx}>
                <Line
                  x1={padding * 1.5}
                  y1={y}
                  x2={svgWidth + padding}
                  y2={y}
                  stroke="#2A2A2A"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={10}
                  y={y + 4}
                  fill="#7A7A7A"
                  fontSize={8}
                  fontWeight="700"
                >
                  {value}
                  {unit}
                </SvgText>
              </G>
            );
          })}

          {/* Connected progression line path */}
          {pathString !== '' && (
            <Path
              d={pathString}
              fill="none"
              stroke="#D4FF13"
              strokeWidth={3}
            />
          )}

          {/* Dots and Labels */}
          {points.map((pt, idx) => (
            <G key={idx}>
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="#000000"
                stroke="#D4FF13"
                strokeWidth={2}
              />
              {/* Show labels on alternate dots to avoid overlap clutter if date range is wide */}
              {(totalPoints < 8 || idx % 2 === 0 || idx === totalPoints - 1) && (
                <>
                  <SvgText
                    x={pt.x}
                    y={pt.y - 8}
                    fill="#FFFFFF"
                    fontSize={8}
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {pt.value}
                  </SvgText>
                  <SvgText
                    x={pt.x}
                    y={svgHeight - 6}
                    fill="#7A7A7A"
                    fontSize={8}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </SvgText>
                </>
              )}
            </G>
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tabTitle}>Analytics</Text>

      {/* Tab Switcher Headers */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'volume' && styles.tabActive]}
          onPress={() => setActiveSubTab('volume')}
        >
          <Text style={[styles.tabText, activeSubTab === 'volume' && styles.tabTextActive]}>
            VOLUME
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'strength' && styles.tabActive]}
          onPress={() => setActiveSubTab('strength')}
        >
          <Text style={[styles.tabText, activeSubTab === 'strength' && styles.tabTextActive]}>
            STRENGTH
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeSubTab === 'consistency' && styles.tabActive]}
          onPress={() => setActiveSubTab('consistency')}
        >
          <Text style={[styles.tabText, activeSubTab === 'consistency' && styles.tabTextActive]}>
            CONSISTENCY
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: VOLUME PROGRESSION */}
      {activeSubTab === 'volume' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Weekly Muscle Volume</Text>
            
            {/* Muscle selector dropdown trigger */}
            <TouchableOpacity 
              style={styles.dropdownSelect} 
              onPress={() => {
                // Collect muscle group options
                const muscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Forearms'];
                const opts = muscles.map(m => ({ id: m, name: m }));
                setExerciseOptions(opts);
                setSelectedEx({ id: selectedVolumeMuscle, name: selectedVolumeMuscle });
                setShowExModal(true);
              }}
            >
              <Text style={styles.dropdownText}>{selectedVolumeMuscle.toUpperCase()} ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Date range filter selector */}
          <View style={styles.rangeRow}>
            {(['4wk', '12wk', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.rangeBtn, volumeDateRange === range && styles.rangeBtnActive]}
                onPress={() => setVolumeDateRange(range)}
              >
                <Text style={[styles.rangeBtnText, volumeDateRange === range && styles.rangeBtnTextActive]}>
                  {range === '4wk' ? '4 WEEKS' : range === '12wk' ? '12 WEEKS' : 'ALL-TIME'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plot Weekly Volume */}
          {drawSvgLineChart(
            volumePoints.map((p) => ({ label: p.label, value: p.volume })),
            ' kg'
          )}
        </View>
      )}

      {/* VIEW 2: STRENGTH PROGRESSION (Estimated 1RM) */}
      {activeSubTab === 'strength' && (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Estimated 1RM over time</Text>
              
              {/* Exercise Selector Trigger */}
              {selectedEx && (
                <TouchableOpacity 
                  style={styles.dropdownSelect} 
                  onPress={async () => {
                    // Restore original unique exercises list for selection
                    setLoading(true);
                    await fetchAnalyticsData();
                    setShowExModal(true);
                  }}
                >
                  <Text style={styles.dropdownText}>{selectedEx.name.toUpperCase()} ▾</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.strengthFormulaTip}>
              * Calculated using Epley formula: 1RM = Weight × (1 + Reps/30)
            </Text>

            {/* Plot 1RM Progression */}
            {drawSvgLineChart(
              strengthPoints.map((p) => ({ label: p.label, value: p.oneRepMax })),
              ' kg'
            )}
          </View>

          {/* 1RM Best Stats Box */}
          {strengthPoints.length > 0 && (
            <View style={styles.highlightStatsGrid}>
              <View style={styles.highlightStatCard}>
                <Text style={styles.highlightLabel}>EST. 1RM BEST</Text>
                <Text style={styles.highlightVal}>
                  {Math.max(...strengthPoints.map((p) => p.oneRepMax))} kg
                </Text>
              </View>
              <View style={styles.highlightStatCard}>
                <Text style={styles.highlightLabel}>LATEST 1RM</Text>
                <Text style={styles.highlightVal}>
                  {strengthPoints[strengthPoints.length - 1].oneRepMax} kg
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* VIEW 3: CONSISTENCY HEATMAP */}
      {activeSubTab === 'consistency' && (
        <>
          {/* Streak Indicator */}
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

          {/* GitHub Style Heatmap Grid */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Consistency Heatmap</Text>
            <Text style={styles.heatmapSubtitle}>Daily training frequency over last 12 weeks</Text>

            <View style={styles.heatmapWrapper}>
              <View style={styles.heatmapGridContainer}>
                {/* Render days of week Monday to Sunday */}
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => renderHeatmapRow(dayIdx))}
              </View>

              {/* Heatmap Legend */}
              <View style={styles.legendRow}>
                <Text style={styles.legendText}>Muted</Text>
                <View style={[styles.heatmapCell, styles.heatmapCellEmpty]} />
                <View style={[styles.heatmapCell, styles.heatmapCellLow]} />
                <View style={[styles.heatmapCell, styles.heatmapCellMid]} />
                <View style={[styles.heatmapCell, styles.heatmapCellHigh]} />
                <Text style={styles.legendText}>Active</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Dynamic Exercise Picker Modal */}
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
              <Text style={styles.modalTitle}>
                {activeSubTab === 'volume' ? 'SELECT MUSCLE' : 'SELECT EXERCISE'}
              </Text>
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
                    ((activeSubTab === 'volume' && selectedVolumeMuscle === item.name) ||
                     (activeSubTab === 'strength' && selectedEx?.id === item.id)) && styles.modalItemRowActive
                  ]}
                  onPress={() => {
                    if (activeSubTab === 'volume') {
                      setSelectedVolumeMuscle(item.name);
                    } else {
                      setSelectedEx(item);
                    }
                    setShowExModal(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.modalItemText,
                      ((activeSubTab === 'volume' && selectedVolumeMuscle === item.name) ||
                       (activeSubTab === 'strength' && selectedEx?.id === item.id)) && styles.modalItemTextActive
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 40,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: '#D4FF13',
  },
  tabText: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#D4FF13',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
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
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownSelect: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#222222',
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
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeBtnActive: {
    backgroundColor: '#D4FF13',
  },
  rangeBtnText: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rangeBtnTextActive: {
    color: '#000000',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingTop: 10,
  },
  emptyChartBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '600',
  },
  strengthFormulaTip: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: -8,
  },
  highlightStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  highlightStatCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  highlightLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  highlightVal: {
    color: '#D4FF13',
    fontSize: 18,
    fontWeight: '900',
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
  heatmapSubtitle: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 16,
  },
  heatmapWrapper: {
    alignItems: 'center',
  },
  heatmapGridContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  heatmapDayLabel: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    width: 16,
    marginRight: 6,
    textAlign: 'center',
  },
  heatmapRowCells: {
    flexDirection: 'row',
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  heatmapCellEmpty: {
    backgroundColor: '#121212',
  },
  heatmapCellLow: {
    backgroundColor: 'rgba(212, 255, 19, 0.25)',
  },
  heatmapCellMid: {
    backgroundColor: 'rgba(212, 255, 19, 0.6)',
  },
  heatmapCellHigh: {
    backgroundColor: '#D4FF13',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#181818',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  legendText: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  emptyStateCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
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
    color: '#000000',
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
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222222',
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

  // PULSING LOADING SKELETON STYLES
  skeletonTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
  },
  skeletonTabButton: {
    width: '28%',
    height: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginVertical: 12,
  },
  skeletonCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    height: 220,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonTitleLine: {
    width: '45%',
    height: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  skeletonTitleLine2: {
    width: '30%',
    height: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  skeletonDropdown: {
    width: '25%',
    height: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  skeletonGraphPlaceholder: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginVertical: 10,
  },
  skeletonStatsPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
