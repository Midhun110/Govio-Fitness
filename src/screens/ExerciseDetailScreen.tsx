import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';

type ExerciseDetailScreenRouteProp = RouteProp<
  RootStackParamList & {
    ExerciseDetail: { session: any; exerciseId: string; name: string; muscleGroup: string };
  },
  'ExerciseDetail'
>;

export default function ExerciseDetailScreen() {
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, exerciseId, name, muscleGroup } = route.params;
  const user = session?.user;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const getExerciseImageUrl = (muscleGroup: string) => {
    const muscle = muscleGroup.toLowerCase();
    if (muscle === 'chest') {
      return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600';
    }
    if (muscle === 'back') {
      return 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=600';
    }
    if (muscle === 'shoulders') {
      return 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600';
    }
    if (muscle === 'legs' || muscle === 'glutes' || muscle === 'calves') {
      return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600';
    }
    if (muscle === 'core' || muscle === 'abs') {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600';
    }
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600';
  };

  const MOCK_EXERCISES: Exercise[] = [
    {
      id: 'ex-1',
      name: 'Bench Press',
      muscle_group: 'Chest',
      primary_muscle: 'Pectoralis Major',
      secondary_muscles: ['Triceps', 'Anterior Deltoids'],
      instructions: [
        'Lie flat on the bench with your feet flat on the floor.',
        'Grip the barbell slightly wider than shoulder-width.',
        'Unrack the bar and lower it slowly to your mid-chest.',
        'Push the bar back up powerfully while keeping your elbows tucked at a 45-degree angle.'
      ],
      form_tips: [
        'Keep your shoulder blades retracted and depressed throughout the lift.',
        'Drive your feet into the floor to create leg drive.'
      ],
      common_mistakes: [
        'Bouncing the bar off your chest.',
        'Flaring your elbows out completely, which places excessive stress on the rotator cuffs.'
      ],
      image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600'
    },
    {
      id: 'ex-2',
      name: 'Squat',
      muscle_group: 'Legs',
      primary_muscle: 'Quadriceps',
      secondary_muscles: ['Glutes', 'Hamstrings', 'Lower Back'],
      instructions: [
        'Place the barbell across your upper back (traps).',
        'Stand with feet shoulder-width apart, toes pointing slightly out.',
        'Hinge at your hips and bend your knees to lower your body.',
        'Keep lowering until your thighs are parallel or below parallel to the floor.',
        'Push through your heels to return to the starting standing position.'
      ],
      form_tips: [
        'Keep your chest up and your spine neutral throughout the movement.',
        'Make sure your knees track in the direction of your toes, not caving inward.'
      ],
      common_mistakes: [
        'Allowing knees to cave inwards (valgus collapse).',
        'Lifting heels off the floor, which shifts load excessively to knee joints.'
      ],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    },
    {
      id: 'ex-3',
      name: 'Deadlift',
      muscle_group: 'Legs',
      primary_muscle: 'Hamstrings & Glutes',
      secondary_muscles: ['Erector Spinae', 'Latissimus Dorsi', 'Forearms'],
      instructions: [
        'Stand with your mid-foot under the barbell.',
        'Bend over and grab the bar with a shoulder-width grip.',
        'Drop your hips slightly and flatten your back completely.',
        'Drive through your legs and pull the bar vertically up close to your shins.',
        'Lock out at the top by squeezing your glutes, then lower the bar with control.'
      ],
      form_tips: [
        'Keep the bar as close to your body as possible during the entire lift.',
        'Engage your lats by imagining squeezing oranges in your armpits.'
      ],
      common_mistakes: [
        'Rounding the lower back, which can cause lumbar injury.',
        'Jerking the bar off the floor rather than pulling with progressive tension.'
      ],
      image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
    },
    {
      id: 'ex-4',
      name: 'Overhead Press',
      muscle_group: 'Shoulders',
      primary_muscle: 'Anterior Deltoids',
      secondary_muscles: ['Triceps', 'Upper Trapezius', 'Core'],
      instructions: [
        'Set the bar on a rack at collarbone height.',
        'Grip the bar slightly wider than shoulder-width with forearms vertical.',
        'Unrack the bar and take a step back, keeping your core tight.',
        'Press the bar straight up over your head, moving your face back slightly to clear the bar.',
        'Lock out your arms at the top, then lower it slowly back to collarbone level.'
      ],
      form_tips: [
        'Squeeze your glutes and core to stabilize your spine.',
        'Keep your forearms perfectly vertical under the bar.'
      ],
      common_mistakes: [
        'Excessively arching the lower back.',
        'Not locking out the elbows at the top of the repetition.'
      ],
      image_url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600'
    },
    {
      id: 'ex-5',
      name: 'Pull-up',
      muscle_group: 'Back',
      primary_muscle: 'Latissimus Dorsi',
      secondary_muscles: ['Biceps', 'Rhomboids', 'Rear Deltoids'],
      instructions: [
        'Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulder-width.',
        'Depress your shoulders and engage your core.',
        'Pull your chest up towards the bar by driving your elbows down toward your ribs.',
        'Clear the bar with your chin, hold for a split second, then lower back to a dead hang.'
      ],
      form_tips: [
        'Focus on pulling through your elbows rather than squeezing with your hands.',
        'Control the eccentric lowering phase for maximum muscle activation.'
      ],
      common_mistakes: [
        'Kicking or using momentum (kipping) to get over the bar.',
        'Not completing the full range of motion.'
      ],
      image_url: 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=600'
    },
    {
      id: 'ex-6',
      name: 'Bicep Curl',
      muscle_group: 'Biceps',
      primary_muscle: 'Biceps Brachii',
      secondary_muscles: ['Brachialis', 'Brachioradialis'],
      instructions: [
        'Hold a pair of dumbbells at your sides, palms facing forward.',
        'Keep your elbows tucked close to your torso.',
        'Squeeze your biceps and curl the weights up toward shoulder height.',
        'Lower the dumbbells slowly back to the starting point.'
      ],
      form_tips: [
        'Keep your wrists straight and avoid using momentum.',
        'Keep your shoulders down and back.'
      ],
      common_mistakes: [
        'Swinging the elbows forward to lift heavier weight.',
        'Using the lower back to swing the body for momentum.'
      ],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-7',
      name: 'Tricep Dip',
      muscle_group: 'Triceps',
      primary_muscle: 'Triceps Brachii',
      secondary_muscles: ['Anterior Deltoids', 'Pectoralis Major'],
      instructions: [
        'Hoist yourself up on parallel dip bars with arms fully locked out.',
        'Inhale, bend your elbows, and lower your body slowly.',
        'Stop lowering when your elbows reach a 90-degree angle.',
        'Exhale and push yourself back up to the starting position.'
      ],
      form_tips: [
        'Keep your chest slightly tilted forward to engage chest, or upright for triceps.',
        'Do not go past a 90-degree angle to protect your shoulders.'
      ],
      common_mistakes: [
        'Shrugging the shoulders up toward the ears.',
        'Flaring the elbows out excessively.'
      ],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-8',
      name: 'Abs Crunch',
      muscle_group: 'Abs',
      primary_muscle: 'Rectus Abdominis',
      secondary_muscles: ['Transverse Abdominis', 'Obliques'],
      instructions: [
        'Lie on your back with knees bent and feet flat on the floor.',
        'Place your hands lightly behind your head or crossed over your chest.',
        'Engage your abdominal muscles and lift your shoulders off the floor.',
        'Exhale as you rise, hold for a moment, then lower slowly back to the start.'
      ],
      form_tips: [
        'Do not pull on your neck with your hands.',
        'Focus on rib-to-pelvis contraction.'
      ],
      common_mistakes: [
        'Using hip flexors to pull the body up.',
        'Tucking the chin aggressively into the chest.'
      ],
      image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'
    },
    {
      id: 'ex-9',
      name: 'Wrist Curl',
      muscle_group: 'Forearms',
      primary_muscle: 'Wrist Flexors',
      secondary_muscles: ['Brachioradialis'],
      instructions: [
        'Sit on a bench, holding dumbbells with an underhand grip.',
        'Rest your forearms on your thighs with wrists hanging off the knees.',
        'Let the weight roll down to your fingers, then curl your wrists upward.',
        'Squeeze the flexors at the top, then lower with control.'
      ],
      form_tips: [
        'Perform the movement slowly through the full range of motion.',
        'Keep your forearms flat against your legs.'
      ],
      common_mistakes: [
        'Lifting the forearms off the thighs.',
        'Jerking the wrist quickly, which can cause tendonitis.'
      ],
      image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    },
    {
      id: 'ex-10',
      name: 'Hip Thrust',
      muscle_group: 'Glutes',
      primary_muscle: 'Gluteus Maximus',
      secondary_muscles: ['Hamstrings', 'Core'],
      instructions: [
        'Sit on the floor with your upper back resting against a sturdy bench.',
        'Roll a barbell over your hips, using a pad for comfort.',
        'Place feet flat on the floor, hip-width apart.',
        'Drive through your heels to lift your hips until thighs are parallel to floor.',
        'Squeeze glutes at lockout, then lower hips back down.'
      ],
      form_tips: [
        'Keep your chin tucked and look forward, not up at the ceiling.',
        'Ensure shins are vertical at the top of the lift.'
      ],
      common_mistakes: [
        'Hyperextending the lower back at the top.',
        'Pushing through the toes instead of the heels.'
      ],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    },
    {
      id: 'ex-11',
      name: 'Calf Raise',
      muscle_group: 'Calves',
      primary_muscle: 'Gastrocnemius',
      secondary_muscles: ['Soleus'],
      instructions: [
        'Stand with the balls of your feet on an elevated step or block.',
        'Hold onto a support for balance if needed.',
        'Lower your heels below the step level to feel a stretch.',
        'Push up high onto your toes, contracting the calves.',
        'Hold the contraction for a second, then lower slowly.'
      ],
      form_tips: [
        'Keep your knees straight but not completely locked out.',
        'Pause at the bottom stretch and top contraction.'
      ],
      common_mistakes: [
        'Bouncing quickly at the bottom using Achilles tendon elasticity.',
        'Not using a full range of motion.'
      ],
      image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600'
    }
  ];

  const fetchExerciseDetails = async () => {
    if (!user || user.id === 'mock-user-id-12345') {
      const match = MOCK_EXERCISES.find(ex => ex.id === exerciseId);
      if (match) {
        setExercise(match);
      } else {
        // Fallback generic object
        setExercise({
          id: exerciseId,
          name: name,
          muscle_group: muscleGroup,
          primary_muscle: muscleGroup,
          secondary_muscles: [],
          instructions: ['Stand in good form.', 'Execute the exercise slowly.', 'Repeat for desired repetitions.'],
          form_tips: ['Focus on mind-muscle connection.'],
          common_mistakes: ['Using momentum or swinging body weights.']
        });
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (error) throw error;
      setExercise(data);
    } catch (err) {
      console.error('Error fetching exercise details:', err);
      // Fallback
      const match = MOCK_EXERCISES.find(ex => ex.id === exerciseId);
      setExercise(match || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId]);

  const { height: windowHeight } = useWindowDimensions();
  const scaleStyle = Platform.OS === 'web' && windowHeight < 900
    ? { transform: [{ scale: Math.max(0.65, windowHeight / 920) }], transformOrigin: 'top center' }
    : {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.innerContainer, scaleStyle]}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EXERCISE GUIDE</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4FF13" />
          </View>
        ) : !exercise ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Failed to load guide details.</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Exercise Image */}
            <View style={styles.imageCard}>
              <Image
                source={{ uri: exercise.image_url || getExerciseImageUrl(exercise.muscle_group) }}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
              <View style={styles.titleInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.musclesRow}>
                  <View style={styles.muscleBadge}>
                    <Text style={styles.muscleBadgeText}>PRIMARY: {exercise.primary_muscle || exercise.muscle_group}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Secondary Muscles */}
            {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
              <View style={styles.metaSection}>
                <Text style={styles.sectionLabel}>SECONDARY TARGETS</Text>
                <View style={styles.secondaryMusclesContainer}>
                  {exercise.secondary_muscles.map((muscle, idx) => (
                    <View key={idx} style={styles.secondaryBadge}>
                      <Text style={styles.secondaryBadgeText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <View style={styles.guideSection}>
                <Text style={styles.sectionLabel}>HOW TO PERFORM</Text>
                {exercise.instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumberContainer}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Form Tips (Success green theme) */}
            {exercise.form_tips && exercise.form_tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={[styles.sectionLabel, { color: '#10B981' }]}>PRO FORM TIPS</Text>
                {exercise.form_tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <Text style={styles.tipCheck}>✓</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Common Mistakes (Warning red theme) */}
            {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
              <View style={styles.mistakesSection}>
                <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>COMMON MISTAKES TO AVOID</Text>
                {exercise.common_mistakes.map((mistake, idx) => (
                  <View key={idx} style={styles.mistakeItem}>
                    <Text style={styles.mistakeCross}>✗</Text>
                    <Text style={styles.mistakeText}>{mistake}</Text>
                  </View>
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
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  imageCard: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  titleInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  musclesRow: {
    flexDirection: 'row',
  },
  muscleBadge: {
    backgroundColor: '#D4FF13',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  muscleBadgeText: {
    color: '#121212',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    padding: 16,
    marginBottom: 16,
  },
  secondaryMusclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  secondaryBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3D3D4A',
  },
  secondaryBadgeText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#7A7A7A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  guideSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    padding: 16,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  stepNumberContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
    borderWidth: 1,
    borderColor: '#D4FF13',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '900',
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  tipsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  tipCheck: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 10,
  },
  tipText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  mistakesSection: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 16,
    marginBottom: 16,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  mistakeCross: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 10,
  },
  mistakeText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
});
