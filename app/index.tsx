import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isOnboardingComplete } = useOnboarding();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isOnboardingComplete) {
      // Onboarding will be handled by _layout.tsx
      return;
    }

    if (!user) {
      // User not authenticated, redirect to login
      router.replace('/auth/login');
    } else {
      // User authenticated, redirect to home
      router.replace('/(tabs)/home');
    }
  }, [router, user, loading, isOnboardingComplete]);

  // Return null as we're navigating away immediately
  return null;
}