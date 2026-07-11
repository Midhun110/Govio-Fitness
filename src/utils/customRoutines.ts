import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'govio_routines';

export interface Routine {
  id: string;
  name: string;
  exercise_ids: string[];
  created_at: string;
}

export const getLocalRoutines = async (): Promise<Routine[]> => {
  try {
    if (Platform.OS === 'web') {
      const data = window.localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } else {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  } catch (e) {
    console.error('Error loading custom routines:', e);
    return [];
  }
};

export const saveLocalRoutines = async (routines: Routine[]): Promise<void> => {
  try {
    const dataStr = JSON.stringify(routines);
    if (Platform.OS === 'web') {
      window.localStorage.setItem(STORAGE_KEY, dataStr);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, dataStr);
    }
  } catch (e) {
    console.error('Error saving custom routines:', e);
  }
};

export const addLocalRoutine = async (name: string, exerciseIds: string[]): Promise<Routine> => {
  const routines = await getLocalRoutines();
  const newRoutine: Routine = {
    id: `rt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    exercise_ids: exerciseIds,
    created_at: new Date().toISOString()
  };
  routines.unshift(newRoutine);
  await saveLocalRoutines(routines);
  return newRoutine;
};

export const deleteLocalRoutine = async (id: string): Promise<boolean> => {
  const routines = await getLocalRoutines();
  const filtered = routines.filter(r => r.id !== id);
  if (filtered.length === routines.length) return false;
  await saveLocalRoutines(filtered);
  return true;
};

export const renameLocalRoutine = async (id: string, newName: string): Promise<Routine | null> => {
  const routines = await getLocalRoutines();
  const idx = routines.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const updatedRoutine = { ...routines[idx], name: newName };
  routines[idx] = updatedRoutine;
  await saveLocalRoutines(routines);
  return updatedRoutine;
};
