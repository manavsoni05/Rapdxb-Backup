import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdjvqprmtvccnrvzztck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanZxcHJtdHZjY25ydnp6dGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzcyNzMsImV4cCI6MjA3NjExMzI3M30.CCxQN9tlxW-1wyJ_MjVHkUvRZ1t64r8iNW4WsTrB2Ac';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
