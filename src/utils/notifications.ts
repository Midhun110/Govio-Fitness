import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface NotificationSettings {
  masterEnabled: boolean;
  streakRemindersEnabled: boolean;
  reengagementRemindersEnabled: boolean;
}

const SETTINGS_KEY = 'govio_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  masterEnabled: false,
  streakRemindersEnabled: true,
  reengagementRemindersEnabled: true,
};

// Configure notifications handler for foreground display
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Read settings from storage
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(SETTINGS_KEY);
      return val ? JSON.parse(val) : DEFAULT_SETTINGS;
    } else {
      const val = await SecureStore.getItemAsync(SETTINGS_KEY);
      return val ? JSON.parse(val) : DEFAULT_SETTINGS;
    }
  } catch (e) {
    console.error('Error reading notification settings:', e);
    return DEFAULT_SETTINGS;
  }
};

// Save settings to storage
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    const val = JSON.stringify(settings);
    if (Platform.OS === 'web') {
      localStorage.setItem(SETTINGS_KEY, val);
    } else {
      await SecureStore.setItemAsync(SETTINGS_KEY, val);
    }
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
};

// Request notifications permission from the OS
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.error('Error requesting notification permissions:', e);
    return false;
  }
};

// Cancel all scheduled workout notifications
export const cancelAllReminders = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync('govio_streak_protection');
    await Notifications.cancelScheduledNotificationAsync('govio_re_engagement');
  } catch (e) {
    console.error('Error cancelling notifications:', e);
  }
};

// Internal date helpers to match Home screen calculations
const getMondayOfDate = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const calculateWeeklyStreak = (workoutDates: string[]): number => {
  if (workoutDates.length === 0) return 0;

  const uniqueMondays = Array.from(
    new Set(
      workoutDates.map((d) => {
        const monday = getMondayOfDate(new Date(d));
        return monday.getTime();
      })
    )
  ).sort((a, b) => b - a);

  const thisWeekMonday = getMondayOfDate(new Date()).getTime();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const lastWeekMonday = thisWeekMonday - oneWeekMs;

  const hasThisWeek = uniqueMondays.includes(thisWeekMonday);
  const hasLastWeek = uniqueMondays.includes(lastWeekMonday);

  if (!hasThisWeek && !hasLastWeek) {
    return 0;
  }

  let streak = 0;
  let expectedMonday = hasThisWeek ? thisWeekMonday : lastWeekMonday;

  while (uniqueMondays.includes(expectedMonday)) {
    streak++;
    expectedMonday -= oneWeekMs;
  }

  return streak;
};

const getSessionsCompletedThisWeek = (workoutDates: string[]): number => {
  const thisWeekMonday = getMondayOfDate(new Date()).getTime();
  const uniqueDates = Array.from(new Set(workoutDates.map(d => {
    const dateObj = new Date(d);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj.toDateString();
  })));
  return uniqueDates.filter((d) => {
    const workoutTime = new Date(d).getTime();
    return workoutTime >= thisWeekMonday;
  }).length;
};

// Reschedule workout reminders based on workout history and settings
export const scheduleWorkoutReminders = async (workoutDates: string[]): Promise<void> => {
  if (Platform.OS === 'web') return;

  const settings = await getNotificationSettings();

  // If master disabled, cancel everything and exit
  if (!settings.masterEnabled) {
    await cancelAllReminders();
    return;
  }

  // 1. STREAK-PROTECTION REMINDER
  if (settings.streakRemindersEnabled) {
    const streak = calculateWeeklyStreak(workoutDates);
    const sessionsThisWeek = getSessionsCompletedThisWeek(workoutDates);

    // If has active streak AND has not logged a session in the current calendar week
    if (streak > 0 && sessionsThisWeek === 0) {
      // Find the upcoming Sunday at 10:00 AM (within 24 hours of the week ending)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const daysUntilSunday = (7 - currentDay) % 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntilSunday);
      targetDate.setHours(10, 0, 0, 0);

      // If Sunday 10 AM is in the past for this week, schedule for next week
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 7);
      }

      try {
        const seconds = Math.max(1, Math.floor((targetDate.getTime() - Date.now()) / 1000));
        await Notifications.scheduleNotificationAsync({
          identifier: 'govio_streak_protection',
          content: {
            title: "Don't lose your streak! 🔥",
            body: "Log a session today to keep your streak going.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            repeats: false,
          },
        });
      } catch (e) {
        console.error('Error scheduling streak reminder:', e);
      }
    } else {
      // Either no active streak or they already completed a workout this week
      try {
        await Notifications.cancelScheduledNotificationAsync('govio_streak_protection');
      } catch (e) {
        console.error('Error cancelling streak reminder:', e);
      }
    }
  } else {
    try {
      await Notifications.cancelScheduledNotificationAsync('govio_streak_protection');
    } catch (e) {
      console.error('Error cancelling streak reminder:', e);
    }
  }

  // 2. RE-ENGAGEMENT REMINDER
  if (settings.reengagementRemindersEnabled) {
    // Find the date of the most recent workout
    const lastWorkoutTime = workoutDates.length > 0
      ? workoutDates.reduce((max, d) => Math.max(max, new Date(d).getTime()), 0)
      : Date.now();

    const lastWorkoutDate = new Date(lastWorkoutTime);
    const targetDate = new Date(lastWorkoutDate);
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(10, 0, 0, 0);

    const now = new Date();
    // If the calculated date is already in the past, schedule it for 3 days from now
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setTime(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      targetDate.setHours(10, 0, 0, 0);
    }

    try {
      const seconds = Math.max(1, Math.floor((targetDate.getTime() - Date.now()) / 1000));
      await Notifications.scheduleNotificationAsync({
        identifier: 'govio_re_engagement',
        content: {
          title: "Ready for your next session? 🏋️",
          body: "It's been a few days since your last workout. Let's get moving!",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        },
      });
    } catch (e) {
      console.error('Error scheduling re-engagement reminder:', e);
    }
  } else {
    try {
      await Notifications.cancelScheduledNotificationAsync('govio_re_engagement');
    } catch (e) {
      console.error('Error cancelling re-engagement reminder:', e);
    }
  }
};
