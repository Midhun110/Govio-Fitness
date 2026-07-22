// Example dev-only configuration template.
// Copy this file to devConfig.ts for local development testing.

export const DEV_DEMO_EMAIL = 'your-demo-email@example.com';
export const DEV_DEMO_PASSWORD = 'your-demo-password';
export const DEV_DEMO_OTP = '123456';

/**
 * Returns true ONLY when EXPO_PUBLIC_APP_ENV is explicitly 'development' or 'preview'.
 * Defaults to false so an unset env var never enables demo mode / auth bypass.
 */
export const isDemoModeAllowed = (): boolean => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || process.env.EXPO_PUBLIC_APP_VARIANT;
  return env === 'development' || env === 'preview';
};
