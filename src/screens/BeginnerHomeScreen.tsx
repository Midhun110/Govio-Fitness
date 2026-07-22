import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { classifyUserProfile } from '../utils/calculations';
import { ErrorState } from '../components/ErrorState';

type BeginnerHomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function BeginnerHomeScreen({ onProfileUpdate }: { onProfileUpdate?: () => void } = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<BeginnerHomeScreenRouteProp>();
  const session = route.params.session;
  const user = session.user;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    setFetchError(null);
    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        if (cached) {
          setProfile(JSON.parse(cached));
        } else {
          setProfile({ full_name: 'Midhun Nikhil', experience_level: 'beginner' });
        }
      } catch (e) {
        console.error(e);
        setProfile({ full_name: 'Midhun Nikhil', experience_level: 'beginner' });
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (data) {
          setProfile(data);
        }
      } catch (err: any) {
        console.error('Error fetching profile in BeginnerHomeScreen:', err);
        setFetchError(err?.message || 'Network error occurred while fetching beginner profile.');
      } finally {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleStartWorkout = () => {
    navigation.navigate('StartWorkout', { session });
  };

  const handleAiChat = () => {
    navigation.navigate('AiChat', { session });
  };

  const handleQuickRevert = async () => {
    setLoading(true);
    const revertedState = {
      experience_level: 'intermediate',
      training_environment: 'gym',
      home_equipment_level: 'some'
    };

    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        let localProfile = cached ? JSON.parse(cached) : {};
        localProfile = { ...localProfile, ...revertedState };
        const classifications = classifyUserProfile(localProfile);
        localProfile = { ...localProfile, ...classifications };
        if (Platform.OS === 'web') {
          window.localStorage.setItem('govio_pending_onboarding', JSON.stringify(localProfile));
        } else {
          await SecureStore.setItemAsync('govio_pending_onboarding', JSON.stringify(localProfile));
        }
        if (onProfileUpdate) onProfileUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update(revertedState)
          .eq('id', user.id);
        if (!error) {
          try {
            const currentProfile = { ...profile, ...revertedState };
            const classifications = classifyUserProfile(currentProfile);
            await supabase.from('user_profiles').update({
              classified_age_group: classifications.classified_age_group,
              classified_experience: classifications.classified_experience,
              classified_location: classifications.classified_location,
              classified_equipment: classifications.classified_equipment,
              classified_goal: classifications.classified_goal
            }).eq('id', user.id);
          } catch (classErr) {
            console.warn('Failed to update classifications on revert:', classErr);
          }
          if (onProfileUpdate) onProfileUpdate();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
      </View>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ErrorState message={fetchError} onRetry={fetchProfile} />
      </SafeAreaView>
    );
  }

  const displayName = profile?.full_name || 'Athlete';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>GOVIO</Text>
            <Text style={styles.headerSubtitle}>Beginner Path Active 🟢</Text>
          </View>
          <TouchableOpacity 
            style={styles.chatIconBtn}
            onPress={handleAiChat}
            activeOpacity={0.8}
          >
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome, {displayName}!</Text>
          <Text style={styles.welcomeText}>
            You are currently on the Home-based, No-Equipment Beginner track. Everything has been simplified to help you build consistency and form habits.
          </Text>
        </View>

        {/* Daily Tasks / Habit Loop Widget */}
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        <View style={styles.focusContainer}>
          <View style={styles.focusCard}>
            <Text style={styles.focusEmoji}>💧</Text>
            <Text style={styles.focusLabel}>Hydration</Text>
            <Text style={styles.focusValue}>Aim for 2.5L</Text>
          </View>
          <View style={styles.focusCard}>
            <Text style={styles.focusEmoji}>👟</Text>
            <Text style={styles.focusLabel}>Movement</Text>
            <Text style={styles.focusValue}>5,000 steps</Text>
          </View>
          <View style={styles.focusCard}>
            <Text style={styles.focusEmoji}>🛌</Text>
            <Text style={styles.focusLabel}>Sleep</Text>
            <Text style={styles.focusValue}>7-8 hours</Text>
          </View>
        </View>

        {/* Highlight Banner for Beginner Exercises */}
        <TouchableOpacity 
          style={styles.workoutBanner}
          onPress={handleStartWorkout}
          activeOpacity={0.9}
        >
          <View style={styles.workoutBannerContent}>
            <Text style={styles.bannerPill}>START TRAINING</Text>
            <Text style={styles.bannerTitle}>Beginner Home Session</Text>
            <Text style={styles.bannerText}>
              Launch your session. Exercises are filtered automatically to require zero equipment.
            </Text>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </TouchableOpacity>

        {/* Onboarding Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Tip of the Day</Text>
          <Text style={styles.tipText}>
            Consistency over intensity. When starting out, just showing up is 80% of the battle. Focus on mastering execution first, rather than pushing to absolute failure.
          </Text>
        </View>

        {/* Settings Notice / Personalization CTA */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Want to change your track?</Text>
          <Text style={styles.infoText}>
            If you get gym access or purchase equipment, you can switch back to the standard gym dashboard at any time.
          </Text>
          <TouchableOpacity 
            style={styles.revertBtn}
            onPress={handleQuickRevert}
            activeOpacity={0.8}
          >
            <Text style={styles.revertBtnText}>SWITCH BACK TO STANDARD GYM PATH 🔁</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTitle: {
    color: '#D4FF13',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  chatIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: {
    fontSize: 20,
  },
  welcomeCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Outfit',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  focusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  focusCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  focusEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  focusLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  focusValue: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
  },
  workoutBanner: {
    backgroundColor: '#D4FF13',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  workoutBannerContent: {
    flex: 1,
    marginRight: 16,
  },
  bannerPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: '#000000',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bannerTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit',
    marginBottom: 6,
  },
  bannerText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 12,
    lineHeight: 18,
  },
  bannerArrow: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '900',
  },
  tipCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  tipTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  tipText: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 20,
    padding: 20,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoText: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
  },
  revertBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  revertBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
});
