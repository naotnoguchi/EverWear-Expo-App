import { Database } from '../types/database';
import { PostgrestClient } from '@supabase/postgrest-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './authClient';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Function to get headers with auth token if available
const getAuthHeaders = async () => {
  const { data } = await auth.getSession();
  const accessToken = data.session?.access_token;

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken || supabaseAnonKey}`
  };
};

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

// Function to get a client with auth headers
export const getAuthenticatedClient = async () => {
  const headers = await getAuthHeaders();

  return new PostgrestClient<Database>(
    `${supabaseUrl}/rest/v1`,
    {
      headers,
      schema: 'public',
    }
  );
};
