import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DayRingHistory {
  dayName: string;
  dateStr: string;
  move: number;
  effort: number;
  consistency: number;
  isToday: boolean;
}

interface ActivityRingsProps {
  loading: boolean;
  data: {
    today: { move: number; effort: number; consistency: number };
    history: DayRingHistory[];
  } | null;
}

export default function ActivityRings({ loading, data }: ActivityRingsProps) {
  // Main Ring Animations
  const moveAnim = useRef(new Animated.Value(0)).current;
  const effortAnim = useRef(new Animated.Value(0)).current;
  const consistencyAnim = useRef(new Animated.Value(0)).current;

  // Glow Celebration Animations
  const glowScale = useRef(new Animated.Value(0.9)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowCompletedRef = useRef(false);

  useEffect(() => {
    if (loading || !data) {
      moveAnim.setValue(0);
      effortAnim.setValue(0);
      consistencyAnim.setValue(0);
      glowCompletedRef.current = false;
      return;
    }

    const { move, effort, consistency } = data.today;

    // Animate rings
    Animated.parallel([
      Animated.timing(moveAnim, {
        toValue: move,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(effortAnim, {
        toValue: effort,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(consistencyAnim, {
        toValue: consistency,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // Check if 100% completion is reached
    const isCompleted = move >= 1.0 && effort >= 1.0 && consistency >= 1.0;
    if (isCompleted && !glowCompletedRef.current) {
      glowCompletedRef.current = true;
      
      // Trigger soft glow pulse celebration
      glowScale.setValue(0.9);
      glowOpacity.setValue(0.7);
      
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 1.4,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!isCompleted) {
      glowCompletedRef.current = false;
    }
  }, [loading, data]);

  if (loading || !data) {
    // RENDER LOADING SKELETON PLACEHOLDERS
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>DAILY ACTIVITY</Text>
        <View style={styles.ringsRow}>
          <View style={styles.svgContainer}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              <Circle cx={70} cy={70} r={55} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={12} fill="none" />
              <Circle cx={70} cy={70} r={40} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={12} fill="none" />
              <Circle cx={70} cy={70} r={25} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={12} fill="none" />
            </Svg>
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.skeletonLegendItem} />
            <View style={styles.skeletonLegendItem} />
            <View style={styles.skeletonLegendItem} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.historyStrip}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <View key={idx} style={styles.historyDayContainer}>
              <View style={styles.skeletonDayLabel} />
              <Svg width={36} height={36} viewBox="0 0 36 36">
                <Circle cx={18} cy={18} r={14} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={3} fill="none" />
                <Circle cx={18} cy={18} r={10} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={3} fill="none" />
                <Circle cx={18} cy={18} r={6} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={3} fill="none" />
              </Svg>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const { today, history } = data;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>DAILY ACTIVITY</Text>

      <View style={styles.ringsRow}>
        <View style={styles.svgContainer}>
          {/* Celebratory soft glow pulse */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              },
            ]}
          />

          <Svg width={140} height={140} viewBox="0 0 140 140">
            {/* Move Track & Fill (Outer) */}
            <Circle cx={70} cy={70} r={55} stroke="rgba(255, 45, 85, 0.15)" strokeWidth={12} fill="none" />
            <AnimatedCircle
              cx={70}
              cy={70}
              r={55}
              stroke="#FF2D55"
              strokeWidth={12}
              fill="none"
              strokeDasharray="345.58"
              strokeDashoffset={moveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [345.58, 0],
              })}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />

            {/* Effort Track & Fill (Middle) */}
            <Circle cx={70} cy={70} r={40} stroke="rgba(212, 255, 19, 0.15)" strokeWidth={12} fill="none" />
            <AnimatedCircle
              cx={70}
              cy={70}
              r={40}
              stroke="#D4FF13"
              strokeWidth={12}
              fill="none"
              strokeDasharray="251.33"
              strokeDashoffset={effortAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [251.33, 0],
              })}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />

            {/* Consistency Track & Fill (Inner) */}
            <Circle cx={70} cy={70} r={25} stroke="rgba(0, 210, 255, 0.15)" strokeWidth={12} fill="none" />
            <AnimatedCircle
              cx={70}
              cy={70}
              r={25}
              stroke="#00D2FF"
              strokeWidth={12}
              fill="none"
              strokeDasharray="157.08"
              strokeDashoffset={consistencyAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [157.08, 0],
              })}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
          </Svg>
        </View>

        {/* Legend Panel */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.colorIndicator, { backgroundColor: '#FF2D55' }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendName}>MOVE</Text>
                <Text style={[styles.legendValue, { color: '#FF2D55' }]}>
                  {Math.round(today.move * 100)}%
                </Text>
              </View>
              <Text style={styles.legendDesc}>
                {today.move >= 1 ? '1 session logged today' : 'No sessions logged today'}
              </Text>
            </View>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.colorIndicator, { backgroundColor: '#D4FF13' }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendName}>EFFORT</Text>
                <Text style={[styles.legendValue, { color: '#D4FF13' }]}>
                  {Math.round(today.effort * 100)}%
                </Text>
              </View>
              <Text style={styles.legendDesc}>Today's volume vs. 30d rolling average</Text>
            </View>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.colorIndicator, { backgroundColor: '#00D2FF' }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendName}>CONSISTENCY</Text>
                <Text style={[styles.legendValue, { color: '#00D2FF' }]}>
                  {Math.round(today.consistency * 100)}%
                </Text>
              </View>
              <Text style={styles.legendDesc}>
                {Math.round(today.consistency * 4)} of 4 sessions completed this week
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 7-Day History Strip */}
      <View style={styles.historyStrip}>
        {history.map((day) => {
          const outerOffset = 87.96 * (1 - Math.min(Math.max(day.move, 0), 1));
          const middleOffset = 62.83 * (1 - Math.min(Math.max(day.effort, 0), 1));
          const innerOffset = 37.70 * (1 - Math.min(Math.max(day.consistency, 0), 1));

          return (
            <View
              key={day.dateStr}
              style={[
                styles.historyDayContainer,
                day.isToday && styles.todayHistoryContainer,
              ]}
            >
              <Text style={[styles.dayLabel, day.isToday && styles.todayDayLabel]}>
                {day.dayName}
              </Text>
              
              <Svg width={36} height={36} viewBox="0 0 36 36">
                {/* Outer Ring */}
                <Circle cx={18} cy={18} r={14} stroke="rgba(255, 45, 85, 0.12)" strokeWidth={3} fill="none" />
                <Circle
                  cx={18}
                  cy={18}
                  r={14}
                  stroke="#FF2D55"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray="87.96"
                  strokeDashoffset={outerOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />

                {/* Middle Ring */}
                <Circle cx={18} cy={18} r={10} stroke="rgba(212, 255, 19, 0.12)" strokeWidth={3} fill="none" />
                <Circle
                  cx={18}
                  cy={18}
                  r={10}
                  stroke="#D4FF13"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset={middleOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />

                {/* Inner Ring */}
                <Circle cx={18} cy={18} r={6} stroke="rgba(0, 210, 255, 0.12)" strokeWidth={3} fill="none" />
                <Circle
                  cx={18}
                  cy={18}
                  r={6}
                  stroke="#00D2FF"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray="37.70"
                  strokeDashoffset={innerOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </Svg>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121212',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  svgContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
    borderColor: '#D4FF13',
    zIndex: -1,
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 5,
    height: 32,
    borderRadius: 2.5,
    marginRight: 8,
    marginTop: 2,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  legendName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  legendDesc: {
    color: '#7A7A7A',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 16,
  },
  historyStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  todayHistoryContainer: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#D4FF13',
  },
  dayLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  todayDayLabel: {
    color: '#D4FF13',
  },
  // Skeleton Styles
  skeletonLegendItem: {
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    marginBottom: 12,
    width: '100%',
  },
  skeletonDayLabel: {
    height: 10,
    width: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginBottom: 8,
  },
});
