import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, SafeAreaView, Platform, useWindowDimensions, Modal, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { Exercise } from '../utils/calculations';
import { MOCK_EXERCISES, getExerciseImageSource } from '../data/exercisesData';
import { getLocalCustomExercises, addLocalCustomExercise } from '../utils/customExercises';
import { triggerSuccessHaptic } from '../utils/haptics';

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

  // Modal & Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [exName, setExName] = useState('');
  const [primaryTarget, setPrimaryTarget] = useState('');
  const [secondaryTargets, setSecondaryTargets] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formTips, setFormTips] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      // Merge with local custom exercises
      const localCustoms = await getLocalCustomExercises();
      const filteredLocal = localCustoms.filter(ex => {
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

      setExercises([...filtered, ...filteredLocal]);
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

  const handleSaveExercise = async () => {
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
        muscle_group: muscleGroup,
        primary_muscle: primaryTarget.trim(),
        secondary_muscles: parsedSecondary,
        instructions: parsedInstructions,
        form_tips: parsedTips,
        common_mistakes: [] as string[],
        image_url: ''
      };

      if (!user || user.id === 'mock-user-id-12345') {
        await addLocalCustomExercise(exercisePayload);
        triggerSuccessHaptic();
        Alert.alert('Success', 'Custom exercise added successfully.');
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert({
            id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ...exercisePayload,
            user_id: user.id,
            is_custom: true
          });
        
        if (error) throw error;
        triggerSuccessHaptic();
        Alert.alert('Success', 'Custom exercise added successfully.');
      }

      setExName('');
      setPrimaryTarget('');
      setSecondaryTargets('');
      setInstructions('');
      setFormTips('');
      setModalVisible(false);
      fetchExercises();

    } catch (err: any) {
      console.error('Error adding custom exercise:', err);
      Alert.alert('Error', err.message || 'Failed to add custom exercise.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExercises();
    });
    return unsubscribe;
  }, [muscleGroup, navigation]);

  const scaleStyle = {};

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
                      source={getExerciseImageSource(exercise)}
                      style={styles.cardImage}
                      resizeMode="cover"
                      {...({ loading: 'lazy' } as any)}
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardMuscleTag}>
                        {exercise.primary_muscle || exercise.muscle_group.toUpperCase()}
                        {exercise.is_custom && <Text style={{ color: '#F97316' }}> • CUSTOM</Text>}
                      </Text>
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

            <TouchableOpacity 
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addBtnText}>+ ADD EXERCISE</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Add Exercise Modal */}
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
                <Text style={styles.modalTitle}>ADD EXERCISE</Text>
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
                  onPress={handleSaveExercise}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>SAVE EXERCISE</Text>
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
    borderColor: '#222222',
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
    borderTopColor: '#222222',
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
  addBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
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
});
