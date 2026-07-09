import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const WebLocalStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

const storageAdapter = Platform.OS === 'web' ? WebLocalStorageAdapter : ExpoSecureStoreAdapter;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// DEV-ONLY: Client-Side Auth Bypass Mocking
if (__DEV__) {
  let mockSession: any = null;
  const listeners = new Set<any>();

  const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
  const originalOnAuthStateChange = supabase.auth.onAuthStateChange.bind(supabase.auth);
  const originalSignOut = supabase.auth.signOut.bind(supabase.auth);

  // Load persisted mock session from storage adapter on start
  storageAdapter.getItem('govio_mock_session').then((val) => {
    if (val) {
      try {
        mockSession = JSON.parse(val);
        listeners.forEach((callback) => callback('SIGNED_IN', mockSession));
      } catch (e) {
        console.error('Failed to parse persisted mock session:', e);
      }
    }
  });

  supabase.auth.getSession = async () => {
    if (mockSession) {
      return { data: { session: mockSession }, error: null };
    }
    return originalGetSession();
  };

  supabase.auth.onAuthStateChange = (callback) => {
    listeners.add(callback);
    // If there is already a mock session, trigger callback immediately
    if (mockSession) {
      callback('SIGNED_IN', mockSession);
    }

    const result = originalOnAuthStateChange(callback as any);
    return {
      data: {
        subscription: {
          id: result.data.subscription.id,
          callback: result.data.subscription.callback,
          unsubscribe: () => {
            listeners.delete(callback);
            result.data.subscription.unsubscribe();
          },
        },
      },
    } as any;
  };

  supabase.auth.signOut = async () => {
    if (mockSession) {
      (supabase.auth as any).setMockSession(null);
      return { error: null };
    }
    return originalSignOut();
  };

  // Helper method to trigger a mock login session from LoginScreen
  (supabase.auth as any).setMockSession = (session: any) => {
    mockSession = session;
    if (session) {
      storageAdapter.setItem('govio_mock_session', JSON.stringify(session));
    } else {
      storageAdapter.removeItem('govio_mock_session');
    }
    listeners.forEach((callback) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });
  };
}
