import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { isExerciseMatch } from '../utils/calculations';
import { MOCK_EXERCISES } from '../data/exercisesData';

type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;

type WorkoutDetailScreenProps = {
  route: WorkoutDetailScreenRouteProp;
};

export default function WorkoutDetailScreen({ route }: WorkoutDetailScreenProps) {
  const { session, workoutId, title, duration, difficulty, calories, description, exercisesList, profile } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isFavorite, setIsFavorite] = useState(false);

  // Automatic Exercise Recommendation/Replacement Engine
  const recommendedExercises = useMemo(() => {
    if (!exercisesList) return [];
    if (!profile || !profile.training_environment) return exercisesList;

    const env = profile.training_environment;
    const level = profile.home_equipment_level;

    return exercisesList.map((originalEx) => {
      // Find the exercise definition
      const exerciseDef = MOCK_EXERCISES.find(e => e.id === originalEx.id) || 
                          MOCK_EXERCISES.find(e => e.name.toLowerCase() === originalEx.name.toLowerCase());
      
      if (!exerciseDef) return originalEx;

      // Check if it matches user's current environment/equipment
      if (isExerciseMatch(exerciseDef, env, level)) {
        return originalEx; // Suitable, keep it!
      }

      // Not suitable! Let's find an alternative that:
      // 1. Has the same muscle group
      // 2. Is suitable for the user's current environment/equipment
      const alternatives = MOCK_EXERCISES.filter(ex => 
        ex.id !== exerciseDef.id &&
        ex.muscle_group.toLowerCase() === exerciseDef.muscle_group.toLowerCase() &&
        isExerciseMatch(ex, env, level)
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives[0];
        return {
          ...originalEx,
          id: bestAlternative.id,
          name: bestAlternative.name,
          muscle_group: bestAlternative.muscle_group,
          isSwapped: true,
          originalName: originalEx.name
        };
      }

      // Fallback to original if no suitable alternative found
      return originalEx;
    });
  }, [exercisesList, profile]);

  const handleStartWorkout = () => {
    // Navigate to LogWorkout and pass the recommended/swapped exercises
    navigation.navigate('LogWorkout', {
      session,
      initialExercises: recommendedExercises,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Image Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: workoutId.startsWith('popular-')
                ? (workoutId === 'popular-1' 
                  ? 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800' // HIIT
                  : workoutId === 'popular-2'
                  ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800' // Strength
                  : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800') // General
                : workoutId.startsWith('teen-')
                ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800'
                : workoutId.startsWith('senior-')
                ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800'
                : workoutId.startsWith('home-')
                ? 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800'
                : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800',
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Navigation Bar Overlay */}
          <View style={styles.navBarOverlay}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Text style={styles.navIconText}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => setIsFavorite(!isFavorite)}>
              <Text style={[styles.navIconText, isFavorite && styles.favoriteActive]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workout Info Box */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{title}</Text>

          {/* Stats Badges */}
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>⏱</Text>
              <Text style={styles.statText}>{duration}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statText}>{difficulty}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statText}>{calories}</Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Workout</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* Exercises Header */}
          <View style={styles.exercisesHeaderRow}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Text style={styles.exercisesCountText}>{recommendedExercises?.length || 0} Moves</Text>
          </View>

          {/* Exercises List */}
          <View style={styles.exercisesList}>
            {recommendedExercises?.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.exerciseItem}>
                <View style={styles.exerciseIndexContainer}>
                  <Text style={styles.exerciseIndexText}>
                    {(index + 1).toString().padStart(2, '0')}
                  </Text>
                </View>

                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  {item.isSwapped && (
                    <Text style={{ color: '#D4FF13', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      🔄 Recommended swap from {item.originalName}
                    </Text>
                  )}
                  <Text style={styles.exerciseSubtitle}>
                    {item.sets || 3} Sets • {item.reps || '10-12 reps'}
                  </Text>
                </View>

                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>
                    {item.muscle_group || 'Core'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  navBarOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 20, 29, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#121212',
  },
  navIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoriteActive: {
    color: '#D4FF13', // Neon Lime Green
  },
  detailsContainer: {
    padding: 24,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderTopWidth: 1,
    borderColor: '#1E1E1E',
    paddingTop: 20,
  },
  exercisesCountText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '700',
  },
  exercisesList: {
    marginBottom: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  exerciseIndexContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exerciseIndexText: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '800',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  targetBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  targetBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 20, 29, 0.85)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: '#1E1E1E',
  },
  startButton: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
