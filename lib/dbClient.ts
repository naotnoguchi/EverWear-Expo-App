import { Database } from '../types/database';
import { PostgrestClient } from '@supabase/postgrest-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize PostgrestClient directly
export const db = new PostgrestClient<Database>(
  `${supabaseUrl}/rest/v1`,
  {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`
    },
    schema: 'public',
  }
);
