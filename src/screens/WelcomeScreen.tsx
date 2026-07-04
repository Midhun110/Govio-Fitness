import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for rich typography readability */}
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            {/* Top Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>GOVIO</Text>
              <View style={styles.logoUnderline} />
            </View>

            {/* Bottom Tagline & Button */}
            <View style={styles.bottomSection}>
              <Text style={styles.title}>Ignite Your Fitness</Text>
              <Text style={styles.tagline}>
                Track your workouts, log nutrition, stay fit, and achieve your health goals.
              </Text>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.75)', // Glassy dark vignette
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#D4FF13', // Neon Lime Green
    letterSpacing: 6,
    textShadowColor: 'rgba(212, 255, 19, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  logoUnderline: {
    width: 48,
    height: 4,
    backgroundColor: '#D4FF13',
    borderRadius: 2,
    marginTop: 8,
  },
  bottomSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#A0A0A0', // Cool Grey
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#D4FF13', // Neon Lime Green
    borderRadius: 30, // Highly rounded pill
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#121212', // Black text
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
