import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('LocalStorage getItem error:', e);
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('SecureStore getItem error:', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('LocalStorage setItem error:', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('SecureStore setItem error:', e);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('LocalStorage deleteItem error:', e);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('SecureStore deleteItem error:', e);
    }
  }
};
