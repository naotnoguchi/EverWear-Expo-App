import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to home tab immediately
    router.replace('/(tabs)/home');
  }, [router]);

  // Return null as we're navigating away immediately
  return null;
} 