import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Exercise } from './calculations';

const STORAGE_KEY = 'govio_custom_exercises';

export const getLocalCustomExercises = async (): Promise<Exercise[]> => {
  try {
    if (Platform.OS === 'web') {
      const data = window.localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } else {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  } catch (e) {
    console.error('Error loading custom exercises:', e);
    return [];
  }
};

export const saveLocalCustomExercises = async (exercises: Exercise[]): Promise<void> => {
  try {
    const dataStr = JSON.stringify(exercises);
    if (Platform.OS === 'web') {
      window.localStorage.setItem(STORAGE_KEY, dataStr);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, dataStr);
    }
  } catch (e) {
    console.error('Error saving custom exercises:', e);
  }
};

export const addLocalCustomExercise = async (newEx: Omit<Exercise, 'id' | 'is_custom'>): Promise<Exercise> => {
  const exercises = await getLocalCustomExercises();
  const customEx: Exercise = {
    ...newEx,
    id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    is_custom: true
  };
  exercises.push(customEx);
  await saveLocalCustomExercises(exercises);
  return customEx;
};

export const editLocalCustomExercise = async (id: string, updatedFields: Partial<Exercise>): Promise<Exercise | null> => {
  const exercises = await getLocalCustomExercises();
  const idx = exercises.findIndex(ex => ex.id === id);
  if (idx === -1) return null;
  const updatedEx = { ...exercises[idx], ...updatedFields };
  exercises[idx] = updatedEx;
  await saveLocalCustomExercises(exercises);
  return updatedEx;
};

export const deleteLocalCustomExercise = async (id: string): Promise<boolean> => {
  const exercises = await getLocalCustomExercises();
  const filtered = exercises.filter(ex => ex.id !== id);
  if (filtered.length === exercises.length) return false;
  await saveLocalCustomExercises(filtered);
  return true;
};
