import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, SafeAreaView, Platform, useWindowDimensions, Modal, TextInput, Alert, KeyboardAvoidingView, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';
import { MOCK_EXERCISES, getExerciseImageSource, getExerciseVideoSource } from '../data/exercisesData';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getLocalCustomExercises, editLocalCustomExercise, deleteLocalCustomExercise } from '../utils/customExercises';

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

  // Modal & Form States for editing
  const [modalVisible, setModalVisible] = useState(false);
  const [exName, setExName] = useState('');
  const [primaryTarget, setPrimaryTarget] = useState('');
  const [secondaryTargets, setSecondaryTargets] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formTips, setFormTips] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  // Video player states & handlers
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<any>(null);

  const handlePlayPause = () => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteUnmute = () => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleReplay = () => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      if (nativePlayer && resolvedVideoUri) {
        nativePlayer.currentTime = 0;
        nativePlayer.play();
        setIsPlaying(true);
      }
    }
  };

  const handleFullscreen = () => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        }
      }
    }
  };

  const videoAsset = exercise ? getExerciseVideoSource(exercise) : null;
  const resolvedVideoUri = videoAsset
    ? (typeof videoAsset === 'number' ? Image.resolveAssetSource(videoAsset)?.uri : videoAsset)
    : null;

  const nativePlayer = useVideoPlayer(resolvedVideoUri, (player) => {
    player.loop = true;
    player.muted = isMuted;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  });

  useEffect(() => {
    if (Platform.OS !== 'web' && nativePlayer && resolvedVideoUri) {
      nativePlayer.muted = isMuted;
      if (isPlaying) {
        nativePlayer.play();
      } else {
        nativePlayer.pause();
      }
    }
  }, [isPlaying, isMuted, nativePlayer, resolvedVideoUri]);

  const renderControlsOverlay = () => {
    if (!videoAsset) return null;
    return (
      <View style={styles.controlsOverlay}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
          <Text style={styles.controlText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReplay} style={styles.controlButton}>
          <Text style={styles.controlText}>🔄</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMuteUnmute} style={styles.controlButton}>
          <Text style={styles.controlText}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <TouchableOpacity onPress={handleFullscreen} style={styles.controlButton}>
            <Text style={styles.controlText}>⛶</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderVideoSection = () => {
    if (!exercise || !videoAsset) {
      return (
        <Image
          source={getExerciseImageSource(exercise || { name: '', image_url: '', muscle_group: '' })}
          style={styles.exerciseImage}
          resizeMode="cover"
          {...({ loading: 'lazy' } as any)}
        />
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.videoContainer}>
          <video
            ref={videoRef}
            src={resolvedVideoUri}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onLoadStart={() => setIsVideoLoading(true)}
            onCanPlay={() => setIsVideoLoading(false)}
            onWaiting={() => setIsVideoLoading(true)}
            onPlaying={() => setIsVideoLoading(false)}
          />
          {isVideoLoading && (
            <View style={styles.videoLoader}>
              <ActivityIndicator size="large" color="#D4FF13" />
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.videoContainer}>
        {nativePlayer && resolvedVideoUri && (
          <VideoView
            style={{ width: '100%', height: '100%' }}
            player={nativePlayer}
            nativeControls={true}
            contentFit="contain"
          />
        )}
      </View>
    );
  };

  // Entry animation states
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!loading && exercise) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [loading, exercise]);

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
    if (muscle === 'legs') {
      return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600';
    }
    if (muscle === 'core' || muscle === 'abs') {
      return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600';
    }
    return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600';
  };



  const fetchExerciseDetails = async () => {
    if (!user || user.id === 'mock-user-id-12345') {
      const localCustoms = await getLocalCustomExercises();
      const match = localCustoms.find(ex => ex.id === exerciseId) || MOCK_EXERCISES.find(ex => ex.id === exerciseId);
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
      // Fallback to local custom or mock
      const localCustoms = await getLocalCustomExercises();
      const match = localCustoms.find(ex => ex.id === exerciseId) || MOCK_EXERCISES.find(ex => ex.id === exerciseId);
      setExercise(match || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = () => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this custom exercise? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user || user.id === 'mock-user-id-12345') {
                await deleteLocalCustomExercise(exerciseId);
              } else {
                const { error } = await supabase
                  .from('exercises')
                  .delete()
                  .eq('id', exerciseId);

                if (error) throw error;
              }
              Alert.alert('Success', 'Exercise deleted successfully.');
              navigation.goBack();
            } catch (err: any) {
              console.error('Error deleting custom exercise:', err);
              Alert.alert('Error', err.message || 'Failed to delete custom exercise.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateExercise = async () => {
    if (!exName.trim()) {
      Alert.alert('Validation Error', 'Exercise Name is required.');
      return;
    }
    if (!primaryTarget.trim()) {
      Alert.alert('Validation Error', 'Primary Target Muscle is required.');
      return;
    }

    setSubmitting(true);
    try {
      const parsedSecondary = secondaryTargets
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const parsedInstructions = instructions
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const parsedTips = formTips
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const exercisePayload = {
        name: exName.trim(),
        primary_muscle: primaryTarget.trim(),
        secondary_muscles: parsedSecondary,
        instructions: parsedInstructions,
        form_tips: parsedTips
      };

      if (!user || user.id === 'mock-user-id-12345') {
        const updated = await editLocalCustomExercise(exerciseId, exercisePayload);
        if (updated) {
          setExercise(updated);
        }
        Alert.alert('Success', 'Custom exercise updated successfully.');
      } else {
        const { data, error } = await supabase
          .from('exercises')
          .update(exercisePayload)
          .eq('id', exerciseId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setExercise(data);
        }
        Alert.alert('Success', 'Custom exercise updated successfully.');
      }

      setModalVisible(false);
    } catch (err: any) {
      console.error('Error updating custom exercise:', err);
      Alert.alert('Error', err.message || 'Failed to update custom exercise.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId]);

  const scaleStyle = {};

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
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Exercise Video/Image */}
              <View style={styles.imageCard}>
                {renderVideoSection()}
                <View style={styles.imageOverlay} pointerEvents="none" />
                <View style={styles.titleInfo} pointerEvents="none">
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.musclesRow}>
                    <View style={styles.muscleBadge}>
                      <Text style={styles.muscleBadgeText}>PRIMARY: {exercise.primary_muscle || exercise.muscle_group}</Text>
                    </View>
                  </View>
                </View>
                {renderControlsOverlay()}
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

              {exercise.is_custom && (
                <View style={styles.customActionsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      setExName(exercise.name);
                      setPrimaryTarget(exercise.primary_muscle || '');
                      setSecondaryTargets((exercise.secondary_muscles || []).join(', '));
                      setInstructions((exercise.instructions || []).join('\n'));
                      setFormTips((exercise.form_tips || []).join('\n'));
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.editBtnText}>EDIT GUIDE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteExercise}
                  >
                    <Text style={styles.deleteBtnText}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Edit Exercise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>EDIT EXERCISE</Text>
                <View style={{ width: 60 }} />
              </View>

              <ScrollView
                contentContainerStyle={styles.modalFormScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Name Input */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>EXERCISE NAME *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Incline Cable Press"
                    placeholderTextColor="#7A7A7A"
                    value={exName}
                    onChangeText={setExName}
                  />
                </View>

                {/* Muscle Group (Read-Only) */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>MUSCLE GROUP</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputDisabled]}
                    value={muscleGroup}
                    editable={false}
                  />
                </View>

                {/* Primary Target Input */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>PRIMARY TARGET *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Upper Chest"
                    placeholderTextColor="#7A7A7A"
                    value={primaryTarget}
                    onChangeText={setPrimaryTarget}
                  />
                </View>

                {/* Secondary Targets Input */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>SECONDARY TARGETS (OPTIONAL)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Triceps, Anterior Deltoids (comma separated)"
                    placeholderTextColor="#7A7A7A"
                    value={secondaryTargets}
                    onChangeText={setSecondaryTargets}
                  />
                </View>

                {/* How-To-Perform Input */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>HOW TO PERFORM (OPTIONAL, ONE STEP PER LINE)</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    multiline={true}
                    numberOfLines={4}
                    placeholder="e.g. Adjust cables to chest height.&#10;Step forward and press handle."
                    placeholderTextColor="#7A7A7A"
                    value={instructions}
                    onChangeText={setInstructions}
                  />
                </View>

                {/* Pro Form Tips Input */}
                <View style={styles.formInputGroup}>
                  <Text style={styles.formLabel}>PRO FORM TIPS (OPTIONAL, ONE TIP PER LINE)</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    multiline={true}
                    numberOfLines={3}
                    placeholder="e.g. Keep shoulder blades squeezed.&#10;Exhale as you press."
                    placeholderTextColor="#7A7A7A"
                    value={formTips}
                    onChangeText={setFormTips}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, submitting && styles.modalSubmitBtnDisabled]}
                  onPress={handleUpdateExercise}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>SAVE CHANGES</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    borderBottomColor: '#222222',
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
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#222222',
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
    borderColor: '#222222',
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
  customActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#D4FF13',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  editBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#222222',
  },
  modalCancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#7A7A7A',
    borderRadius: 8,
  },
  modalCancelBtnText: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  modalFormScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  formInputGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#222222',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#181818',
  },
  formInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  videoLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 12,
    alignItems: 'center',
    zIndex: 20,
  },
  controlButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    color: '#D4FF13',
    fontSize: 16,
  },
});
