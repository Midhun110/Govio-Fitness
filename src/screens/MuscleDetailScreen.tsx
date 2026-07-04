import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';

type MuscleDetailScreenRouteProp = RouteProp<
  RootStackParamList & {
    MuscleDetail: { session: any; muscleGroup: string };
  },
  'MuscleDetail'
>;

export default function MuscleDetailScreen() {
  const route = useRoute<MuscleDetailScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, muscleGroup } = route.params;
  const user = session?.user;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const getExerciseImageUrl = (muscleGroup: string) => {
    const muscle = muscleGroup.toLowerCase();
    if (muscle === 'chest') {
      return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=150';
    }
    if (muscle === 'back') {
      return 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=150';
    }
    if (muscle === 'shoulders') {
      return 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=150';
    }
    if (muscle === 'legs' || muscle === 'glutes' || muscle === 'calves') {
      return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=150';
    }
    if (muscle === 'core' || muscle === 'abs') {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150';
    }
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=150';
  };

  const MOCK_EXERCISES: Exercise[] = [
    {
      id: 'ex-1',
      name: 'Bench Press',
      muscle_group: 'Chest',
      primary_muscle: 'Pectoralis Major',
      secondary_muscles: ['Triceps', 'Anterior Deltoids'],
      instructions: ['Lie flat on the bench.', 'Lower bar to chest.', 'Push straight up.'],
      form_tips: ['Retract scapula.'],
      common_mistakes: ['Flaring elbows.'],
      image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600'
    },
    {
      id: 'ex-2',
      name: 'Squat',
      muscle_group: 'Legs',
      primary_muscle: 'Quadriceps',
      secondary_muscles: ['Glutes', 'Hamstrings'],
      instructions: ['Bar on back.', 'Squat deep.', 'Stand up.'],
      form_tips: ['Knees out.'],
      common_mistakes: ['Heels lifting.'],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    },
    {
      id: 'ex-3',
      name: 'Deadlift',
      muscle_group: 'Legs',
      primary_muscle: 'Hamstrings & Glutes',
      secondary_muscles: ['Erector Spinae', 'Latissimus Dorsi'],
      instructions: ['Flatten back.', 'Pull bar up close shins.', 'Lock out hips.'],
      form_tips: ['Lats tight.'],
      common_mistakes: ['Rounding back.'],
      image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
    },
    {
      id: 'ex-4',
      name: 'Overhead Press',
      muscle_group: 'Shoulders',
      primary_muscle: 'Anterior Deltoids',
      secondary_muscles: ['Triceps'],
      instructions: ['Unrack collarbones.', 'Press straight overhead.', 'Lock elbows.'],
      form_tips: ['Squeeze core.'],
      common_mistakes: ['Arching back.'],
      image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600'
    },
    {
      id: 'ex-5',
      name: 'Pull-up',
      muscle_group: 'Back',
      primary_muscle: 'Latissimus Dorsi',
      secondary_muscles: ['Biceps'],
      instructions: ['Hang straight.', 'Chest to bar.', 'Lower controlled.'],
      form_tips: ['Drive elbows down.'],
      common_mistakes: ['Kipping.'],
      image_url: 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=600'
    },
    {
      id: 'ex-6',
      name: 'Bicep Curl',
      muscle_group: 'Biceps',
      primary_muscle: 'Biceps Brachii',
      secondary_muscles: ['Brachialis'],
      instructions: ['Hold dumbbells.', 'Curl upward.', 'Lower slow.'],
      form_tips: ['Keep elbows tucked.'],
      common_mistakes: ['Swinging arms.'],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-7',
      name: 'Tricep Dip',
      muscle_group: 'Triceps',
      primary_muscle: 'Triceps Brachii',
      secondary_muscles: ['Chest'],
      instructions: ['On bars.', 'Lower to 90 degrees.', 'Push up.'],
      form_tips: ['Control descent.'],
      common_mistakes: ['Shrugging shoulders.'],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-8',
      name: 'Abs Crunch',
      muscle_group: 'Abs',
      primary_muscle: 'Rectus Abdominis',
      instructions: ['Lie on back.', 'Lift shoulders.', 'Squeeze core.'],
      form_tips: ['Look forward.'],
      common_mistakes: ['Pulling neck.'],
      image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
    },
    {
      id: 'ex-9',
      name: 'Wrist Curl',
      muscle_group: 'Forearms',
      primary_muscle: 'Wrist Flexors',
      instructions: ['Rest forearms bench.', 'Curl wrists up.', 'Lower slow.'],
      form_tips: ['Slow pace.'],
      common_mistakes: ['Lifting arms.'],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-10',
      name: 'Hip Thrust',
      muscle_group: 'Glutes',
      primary_muscle: 'Gluteus Maximus',
      instructions: ['Upper back on bench.', 'Drive hips up.', 'Squeeze glutes.'],
      form_tips: ['Shin vertical.'],
      common_mistakes: ['Hyperextension.'],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    },
    {
      id: 'ex-11',
      name: 'Calf Raise',
      muscle_group: 'Calves',
      primary_muscle: 'Gastrocnemius',
      instructions: ['Stand on elevated block.', 'Lower heels.', 'Push to toes.'],
      form_tips: ['Pause top.'],
      common_mistakes: ['Bouncing.'],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    }
  ];

  const fetchExercises = async () => {
    if (!user || user.id === 'mock-user-id-12345') {
      const filtered = MOCK_EXERCISES.filter(ex => {
        const cat = muscleGroup.toLowerCase();
        const muscle = ex.muscle_group.toLowerCase();
        
        if (cat === 'chest') return muscle === 'chest';
        if (cat === 'back') return muscle === 'back';
        if (cat === 'shoulders') return muscle === 'shoulders';
        if (cat === 'legs') return muscle === 'legs';
        if (cat === 'biceps') return muscle === 'biceps';
        if (cat === 'triceps') return muscle === 'triceps';
        if (cat === 'forearms') return muscle === 'forearms';
        if (cat === 'abs') return muscle === 'abs';
        if (cat === 'glutes') return muscle === 'glutes';
        if (cat === 'calves') return muscle === 'calves';
        return muscle === cat;
      });
      setExercises(filtered);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const filtered = data.filter((ex: any) => {
          const cat = muscleGroup.toLowerCase();
          const muscle = ex.muscle_group.toLowerCase();
          
          if (cat === 'chest') return muscle === 'chest';
          if (cat === 'back') return muscle === 'back';
          if (cat === 'shoulders') return muscle === 'shoulders';
          if (cat === 'legs') return muscle === 'legs';
          if (cat === 'biceps') {
            return muscle === 'biceps' || (muscle === 'arms' && ex.name.toLowerCase().includes('bicep'));
          }
          if (cat === 'triceps') {
            return muscle === 'triceps' || (muscle === 'arms' && ex.name.toLowerCase().includes('tricep'));
          }
          if (cat === 'forearms') {
            return muscle === 'forearms' || (muscle === 'arms' && !ex.name.toLowerCase().includes('bicep') && !ex.name.toLowerCase().includes('tricep'));
          }
          if (cat === 'abs') {
            return muscle === 'abs' || muscle === 'core';
          }
          if (cat === 'glutes') {
            return muscle === 'glutes' || (muscle === 'legs' && (ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('squat')));
          }
          if (cat === 'calves') {
            return muscle === 'calves' || (muscle === 'legs' && ex.name.toLowerCase().includes('calf'));
          }
          return muscle === cat;
        });
        setExercises(filtered);
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [muscleGroup]);

  const { height: windowHeight } = useWindowDimensions();
  const scaleStyle = Platform.OS === 'web' && windowHeight < 900
    ? { transform: [{ scale: Math.max(0.65, windowHeight / 920) }], transformOrigin: 'top center' }
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.innerContainer, scaleStyle]}>
        
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{muscleGroup.toUpperCase()}</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4FF13" />
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>Targeted Training Library</Text>
            
            {exercises.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises found for {muscleGroup}.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {exercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ExerciseDetail', {
                      session: session!,
                      exerciseId: exercise.id,
                      name: exercise.name,
                      muscleGroup: exercise.muscle_group,
                    })}
                  >
                    <Image
                      source={{ uri: exercise.image_url || getExerciseImageUrl(exercise.muscle_group) }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardMuscleTag}>{exercise.primary_muscle || exercise.muscle_group.toUpperCase()}</Text>
                      <Text style={styles.cardTitleText}>{exercise.name}</Text>
                      <View style={styles.cardActionRow}>
                        <Text style={styles.cardLink}>VIEW DETAILS</Text>
                        <Text style={styles.cardArrow}>→</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  innerContainer: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2D2D37',
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#7A7A7A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#7A7A7A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7A7A7A',
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#2A2A2A',
  },
  cardBody: {
    padding: 12,
  },
  cardMuscleTag: {
    color: '#D4FF13',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    height: 36,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2D2D37',
    paddingTop: 8,
  },
  cardLink: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardArrow: {
    color: '#D4FF13',
    fontSize: 12,
    fontWeight: '900',
  },
});
