import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://qqwiowwcuhzatisvdifv.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxd2lvd3djdWh6YXRpc3ZkaWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjY1NjgsImV4cCI6MjA4MTk0MjU2OH0.ZFYyL8InOuY9jcXscYWNYxttYscDMsSbBcineMdwcmU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'void-clicker-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

export type Profile = {
  id: string;
  user_id: string;
  nickname: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type GameSave = {
  id: string;
  user_id: string;
  save_data: string;
  created_at: string;
  updated_at: string;
};
