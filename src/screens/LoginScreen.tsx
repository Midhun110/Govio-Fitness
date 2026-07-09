import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { DEV_DEMO_EMAIL, DEV_DEMO_OTP, DEV_DEMO_PASSWORD } from '../config/devConfig';

export default function LoginScreen() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setError(null);
    setMessage(null);

    const identifier = authMethod === 'email' ? email.trim() : phone.trim();
    if (!identifier) {
      setError(`Please enter a valid ${authMethod === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    if (authMethod === 'phone' && !identifier.startsWith('+')) {
      setError('Phone number must include country code starting with + (e.g. +1234567890)');
      return;
    }

    if (__DEV__ && authMethod === 'email' && identifier.toLowerCase() === DEV_DEMO_EMAIL.toLowerCase()) {
      setOtpSent(true);
      setMessage(`A 6-digit verification code has been sent to your ${authMethod}.`);
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp(
        authMethod === 'email' ? { email: identifier } : { phone: identifier }
      );

      if (otpError) throw otpError;

      setOtpSent(true);
      setMessage(`A 6-digit verification code has been sent to your ${authMethod}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setMessage(null);

    if (!token.trim() || token.trim().length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    const identifier = authMethod === 'email' ? email.trim() : phone.trim();

    if (__DEV__ && authMethod === 'email' && identifier.toLowerCase() === DEV_DEMO_EMAIL.toLowerCase()) {
      setLoading(true);
      try {
        // Sign in using local client-side session mocking
        (supabase.auth as any).setMockSession({
          user: { id: 'mock-user-id-12345', email: DEV_DEMO_EMAIL },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        });
      } catch (err: any) {
        setError(err.message || 'Verification failed. Please check the credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp(
        authMethod === 'email'
          ? { email: identifier, token: token.trim(), type: 'email' }
          : { phone: identifier, token: token.trim(), type: 'sms' }
      );

      if (verifyError) throw verifyError;
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOtpSent(false);
    setToken('');
    setError(null);
    setMessage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D141D" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>GOVIO</Text>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {otpSent ? 'Verification' : 'Get Started'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {otpSent
                ? `Enter the 6-digit code we sent to ${authMethod === 'email' ? email : phone}`
                : 'Receive a secure one-time passcode to sign in or sign up.'}
            </Text>

            {error && (
              <View style={styles.errorAlert}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {message && (
              <View style={styles.successAlert}>
                <Text style={styles.successText}>✓ {message}</Text>
              </View>
            )}

            {!otpSent ? (
              <>
                {/* Custom Tab Bar styled to match Stitch */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      authMethod === 'email' && styles.activeTabButton,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAuthMethod('email');
                      setError(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        authMethod === 'email' && styles.activeTabButtonText,
                      ]}
                    >
                      Email Address
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      authMethod === 'phone' && styles.activeTabButton,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAuthMethod('phone');
                      setError(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        authMethod === 'phone' && styles.activeTabButtonText,
                      ]}
                    >
                      Phone Number
                    </Text>
                  </TouchableOpacity>
                </View>

                {authMethod === 'email' ? (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                      {__DEV__ && (
                        <TouchableOpacity
                          onPress={() => setEmail(DEV_DEMO_EMAIL)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.devLinkText}>Use Demo Account</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="hello@govio.fit"
                      placeholderTextColor="#7A7A7A"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+1234567890"
                      placeholderTextColor="#7A7A7A"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={phone}
                      onChangeText={setPhone}
                    />
                    <Text style={styles.helperText}>
                      Include international country code starting with +
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  activeOpacity={0.85}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D141D" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Passcode</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
                    {__DEV__ && email.trim().toLowerCase() === DEV_DEMO_EMAIL.toLowerCase() && (
                      <Text style={styles.devHintText}>Passcode: {DEV_DEMO_OTP}</Text>
                    )}
                  </View>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor="#7A7A7A"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={token}
                    onChangeText={setToken}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  activeOpacity={0.85}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D141D" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  activeOpacity={0.7}
                  onPress={handleReset}
                >
                  <Text style={styles.secondaryButtonText}>
                    Change {authMethod === 'email' ? 'Email' : 'Phone'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D141D',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D4FF13', // Neon Lime Green
    letterSpacing: 4,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3D4A3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 24,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0D141D',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#2A2A2A',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  activeTabButtonText: {
    color: '#D4FF13', // Active tab lights up in Lime Green
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 1,
  },
  devLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4FF13',
    textTransform: 'uppercase',
  },
  devHintText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A0A0A0',
  },
  input: {
    backgroundColor: '#192029',
    color: '#FFFFFF',
    borderRadius: 16, // highly rounded inputs matching Stitch
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 12,
    fontWeight: '800',
    paddingLeft: 24, // center align helper
  },
  helperText: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#D4FF13', // Neon Lime Green matching Stitch
    borderRadius: 30, // pill button
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#0D141D',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '700',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
});
