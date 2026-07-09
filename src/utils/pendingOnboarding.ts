import { UserProfile } from './calculations';

let pendingOnboardingData: UserProfile | null = null;

export const setPendingOnboarding = (data: UserProfile | null) => {
  pendingOnboardingData = data;
};

export const getPendingOnboarding = () => {
  return pendingOnboardingData;
};
