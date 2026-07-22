// Dev-only configuration. Feel free to modify this locally for testing.
// This file is git-ignored to prevent committing local test configurations.

export const DEV_DEMO_EMAIL = 'demo@govio.app';
// The fixed password for the demo account already created in your Supabase Auth dashboard.
export const DEV_DEMO_PASSWORD = 'GovioDemo123!';
export const DEV_DEMO_OTP = '123456';

/**
 * Returns true for local dev (__DEV__), development client APKs, and preview builds on mobile devices.
 * Returns false ONLY when explicitly built for production release.
 */
export const isDemoModeAllowed = (): boolean => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || process.env.EXPO_PUBLIC_APP_VARIANT;
  if (env === 'production') {
    return false;
  }
  if (env === 'development' || env === 'preview') {
    return true;
  }
  // Default to true for __DEV__ local server and non-production test builds
  return true;
};

