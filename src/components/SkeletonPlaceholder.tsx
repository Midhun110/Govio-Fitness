import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#232A34',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={{ flex: 1 }}>
          <SkeletonBox width={120} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBox width={200} height={24} borderRadius={8} style={{ marginBottom: 6 }} />
          <SkeletonBox width={160} height={12} borderRadius={6} />
        </View>
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>

      {/* Subtab switcher skeleton */}
      <View style={styles.tabRowSkeleton}>
        <SkeletonBox width="48%" height={40} borderRadius={20} />
        <SkeletonBox width="48%" height={40} borderRadius={20} />
      </View>

      {/* Recommended Target Card skeleton */}
      <View style={styles.cardSkeleton}>
        <SkeletonBox width={140} height={12} borderRadius={6} style={{ marginBottom: 12 }} />
        <SkeletonBox width={180} height={22} borderRadius={8} style={{ marginBottom: 8 }} />
        <SkeletonBox width={220} height={14} borderRadius={6} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={44} borderRadius={22} />
      </View>

      {/* Stats Card skeleton */}
      <View style={styles.cardSkeleton}>
        <SkeletonBox width={100} height={12} borderRadius={6} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBox width="30%" height={50} borderRadius={12} />
          <SkeletonBox width="30%" height={50} borderRadius={12} />
          <SkeletonBox width="30%" height={50} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

export const HistorySkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.cardSkeleton}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SkeletonBox width={140} height={18} borderRadius={6} />
            <SkeletonBox width={24} height={24} borderRadius={12} />
          </View>
          <SkeletonBox width={180} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
          <SkeletonBox width={100} height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );
};

export const FoodListSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonBox width="100%" height={48} borderRadius={16} style={{ marginBottom: 20 }} />
      {[1, 2, 3, 5, 6].map((i) => (
        <View key={i} style={styles.itemSkeletonRow}>
          <View style={{ flex: 1 }}>
            <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonBox width="85%" height={12} borderRadius={6} />
          </View>
          <SkeletonBox width={28} height={28} borderRadius={14} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: 16,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardSkeleton: {
    backgroundColor: '#151C25',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#232A34',
    padding: 16,
    marginBottom: 16,
  },
  itemSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A232E',
  },
});
