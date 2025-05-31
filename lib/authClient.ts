import 'react-native-url-polyfill/auto'
import { AuthClient } from '@supabase/auth-js'
import { storageAdapter } from './storageAdapter'

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the auth client
export const auth = new AuthClient({
  url: `${supabaseUrl}/auth/v1`,
  // Use the fetch API available in the environment
  fetch: fetch,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  storage: storageAdapter,
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`
  }
})
