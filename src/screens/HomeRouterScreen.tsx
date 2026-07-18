import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from './HomeScreen';
import BeginnerHomeScreen from './BeginnerHomeScreen';

type HomeRouterScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeRouterScreen() {
  const route = useRoute<HomeRouterScreenRouteProp>();
  const session = route.params.session;
  const user = session.user;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const checkPersonalization = async () => {
    if (user.id === 'mock-user-id-12345') {
      try {
        const cached = Platform.OS === 'web'
          ? window.localStorage.getItem('govio_pending_onboarding')
          : await SecureStore.getItemAsync('govio_pending_onboarding');
        if (cached) {
          setProfile(JSON.parse(cached));
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('experience_level, training_environment, home_equipment_level')
          .eq('id', user.id)
          .single();
        if (data && !error) {
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching profile in HomeRouterScreen:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkPersonalization();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
      </View>
    );
  }

  // Personalization logic:
  // If the user selects Beginner + Home + No Equipment, route them to the new beginner dashboard.
  // Otherwise, route them to the standard dashboard.
  const isBeginnerHomeNoEquip = 
    profile &&
    profile.experience_level === 'beginner' &&
    profile.training_environment === 'home' &&
    profile.home_equipment_level === 'none';

  if (isBeginnerHomeNoEquip) {
    return <BeginnerHomeScreen onProfileUpdate={checkPersonalization} />;
  }

  return <HomeScreen route={route} onProfileUpdate={checkPersonalization} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
