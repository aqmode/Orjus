import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface UserProfile {
  nickname: string;
  displayName: string;
  avatarUrl: string;
  isProfileComplete: boolean;
}

export interface User {
  id: string;
  nickname: string;
  displayName?: string;
  createdAt: Date;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  needsProfileSetup: boolean;
  signUp: (nickname: string, password: string, confirmPassword: string) => Promise<boolean>;
  signIn: (nickname: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  clearError: () => void;
  saveGameToCloud: (gameState: unknown) => Promise<boolean>;
  loadGameFromCloud: () => Promise<unknown | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hash password (simple client-side hash - в продакшене используйте bcrypt на сервере!)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const loadUserProfile = async (userId: string): Promise<UserProfile | undefined> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error loading profile:', error);
      return undefined;
    }
    
    if (!data) return undefined;
    
    return {
      nickname: data.nickname || '',
      displayName: data.display_name || '',
      avatarUrl: data.avatar_url || '',
      isProfileComplete: data.is_profile_complete || false
    };
  } catch (e) {
    console.error('Error loading profile:', e);
    return undefined;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed states
  const needsProfileSetup = user !== null && (!user.profile || !user.profile.isProfileComplete);

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;
    
    // Get initial session from localStorage
    const initSession = async () => {
      try {
        const sessionData = localStorage.getItem('voidClickerSession');
        
        if (sessionData && mounted) {
          const { userId, nickname, timestamp } = JSON.parse(sessionData);
          
          // Check if session is valid (not older than 30 days)
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - timestamp < thirtyDaysMs) {
            // Load user from database
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .eq('nickname', nickname)
              .maybeSingle();
            
            if (data && !error) {
              const profile = await loadUserProfile(userId);
              setUser({
                id: data.id,
                nickname: data.nickname,
                displayName: data.display_name || undefined,
                createdAt: new Date(data.created_at),
                profile
              });
            } else {
              // Invalid session, clear it
              localStorage.removeItem('voidClickerSession');
            }
          } else {
            // Expired session
            localStorage.removeItem('voidClickerSession');
          }
        }
        
        if (mounted) setIsLoading(false);
      } catch (e) {
        console.error('Error in initSession:', e);
        localStorage.removeItem('voidClickerSession');
        if (mounted) setIsLoading(false);
      }
    };
    
    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data && !error) {
        const profile = await loadUserProfile(user.id);
        setUser({
          id: data.id,
          nickname: data.nickname,
          displayName: data.display_name || undefined,
          createdAt: new Date(data.created_at),
          profile
        });
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  }, [user]);

  // Update profile
  const updateProfile = useCallback(async (profile: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const profileData = {
        user_id: user.id,
        nickname: profile.nickname,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        is_profile_complete: profile.isProfileComplete,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      // Refresh user data
      await refreshUser();
      return true;
    } catch (e) {
      console.error('Error updating profile:', e);
      setError('Ошибка обновления профиля');
      return false;
    }
  }, [user, refreshUser]);

  const signUp = useCallback(async (nickname: string, password: string, confirmPassword: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate nickname
      if (nickname.length < 3) {
        setError('Никнейм должен быть не менее 3 символов');
        setIsLoading(false);
        return false;
      }

      if (nickname.length > 20) {
        setError('Никнейм не может быть длиннее 20 символов');
        setIsLoading(false);
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
        setError('Никнейм может содержать только буквы, цифры и подчеркивания');
        setIsLoading(false);
        return false;
      }

      // Validate password
      if (password.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        setIsLoading(false);
        return false;
      }

      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        setIsLoading(false);
        return false;
      }

      // Check if nickname already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .maybeSingle();

      if (existingUser) {
        setError('Этот никнейм уже занят');
        setIsLoading(false);
        return false;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          nickname: nickname,
          password_hash: passwordHash,
          display_name: nickname,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Save session to localStorage
      localStorage.setItem('voidClickerSession', JSON.stringify({
        userId: newUser.id,
        nickname: newUser.nickname,
        timestamp: Date.now()
      }));

      // Set user
      setUser({
        id: newUser.id,
        nickname: newUser.nickname,
        displayName: newUser.display_name || undefined,
        createdAt: new Date(newUser.created_at),
        profile: undefined
      });

      setIsLoading(false);
      return true;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ошибка при регистрации';
      setError('Ошибка при регистрации: ' + errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  const signIn = useCallback(async (nickname: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Hash password
      const passwordHash = await hashPassword(password);

      // Check credentials
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname)
        .eq('password_hash', passwordHash)
        .maybeSingle();

      if (error || !data) {
        setError('Неверный никнейм или пароль');
        setIsLoading(false);
        return false;
      }

      // Save session to localStorage
      localStorage.setItem('voidClickerSession', JSON.stringify({
        userId: data.id,
        nickname: data.nickname,
        timestamp: Date.now()
      }));

      // Load profile
      const profile = await loadUserProfile(data.id);

      // Set user
      setUser({
        id: data.id,
        nickname: data.nickname,
        displayName: data.display_name || undefined,
        createdAt: new Date(data.created_at),
        profile
      });

      setIsLoading(false);
      return true;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ошибка при входе';
      setError('Ошибка при входе: ' + errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Clear localStorage session
      localStorage.removeItem('voidClickerSession');
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cloud save/load functions
  const saveGameToCloud = useCallback(async (gameState: unknown): Promise<boolean> => {
    if (!user) {
      console.warn('❌ Cannot save: User not logged in');
      return false;
    }
    
    console.log(`💾 Saving game for user: ${user.nickname} (ID: ${user.id})`);
    
    try {
      // Check if save exists
      const { data: existingSave } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const saveData = {
        user_id: user.id,
        save_data: gameState,
        updated_at: new Date().toISOString()
      };

      if (existingSave) {
        const { error } = await supabase
          .from('saves')
          .update(saveData)
          .eq('user_id', user.id);
        
        if (error) throw error;
        console.log(`✅ Game updated for user: ${user.nickname}`);
      } else {
        const { error } = await supabase
          .from('saves')
          .insert({
            ...saveData,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        console.log(`✅ Game saved (new) for user: ${user.nickname}`);
      }
      
      return true;
    } catch (e) {
      console.error(`❌ Error saving for user ${user.nickname}:`, e);
      return false;
    }
  }, [user]);

  const loadGameFromCloud = useCallback(async (): Promise<unknown | null> => {
    if (!user) {
      console.warn('❌ Cannot load: User not logged in');
      return null;
    }
    
    console.log(`📥 Loading game for user: ${user.nickname} (ID: ${user.id})`);
    
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('save_data')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        console.log(`ℹ️ No save found for user: ${user.nickname}`);
        return null;
      }
      
      console.log(`✅ Game loaded for user: ${user.nickname}`);
      // save_data is already JSONB, no need to parse
      return data.save_data;
    } catch (e) {
      console.error(`❌ Error loading for user ${user.nickname}:`, e);
      return null;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      needsProfileSetup,
      signUp,
      signIn,
      signOut,
      refreshUser,
      updateProfile,
      clearError,
      saveGameToCloud,
      loadGameFromCloud
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
