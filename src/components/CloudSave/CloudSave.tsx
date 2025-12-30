import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

// Export hook for manual save
export const useManualSave = () => {
  const { user, saveGameToCloud } = useAuth();
  const { getStateForCloudSave } = useGame();

  const manualSave = useCallback(async () => {
    if (!user) return { success: false, message: 'Вы не авторизованы' };
    
    try {
      const gameState = getStateForCloudSave();
      const success = await saveGameToCloud(gameState);
      if (success) {
        return { success: true, message: 'Прогресс сохранён!' };
      } else {
        return { success: false, message: 'Ошибка сохранения' };
      }
    } catch (e) {
      console.error('Manual save error:', e);
      return { success: false, message: 'Ошибка сохранения' };
    }
  }, [user, getStateForCloudSave, saveGameToCloud]);

  return { manualSave, canSave: !!user };
};

const CloudSave: React.FC = () => {
  const { user, saveGameToCloud, loadGameFromCloud } = useAuth();
  const { getStateForCloudSave, loadFromCloud, state } = useGame();
  const hasLoadedFromCloud = useRef(false);
  const isSaving = useRef(false);
  const lastSavedEssence = useRef<number>(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Save function with debounce protection (async for regular saves)
  const saveToCloud = useCallback(async (reason: string) => {
    if (!user || isSaving.current) return;
    
    isSaving.current = true;
    try {
      const gameState = getStateForCloudSave();
      const success = await saveGameToCloud(gameState);
      if (success) {
        lastSavedEssence.current = gameState.essence;
        console.log('☁️ Saved to cloud:', reason);
      }
    } finally {
      isSaving.current = false;
    }
  }, [user, getStateForCloudSave, saveGameToCloud]);

  // Debounced save - saves after 2 seconds of no changes
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToCloud('debounced-action');
    }, 2000);
  }, [saveToCloud]);

  // Save on state changes (debounced)
  useEffect(() => {
    if (!user || !hasLoadedFromCloud.current) return;
    
    // Only trigger if essence changed significantly (more than 10)
    const essenceDiff = Math.abs(state.essence - lastSavedEssence.current);
    if (essenceDiff > 10) {
      debouncedSave();
    }
  }, [user, state.essence, state.totalClicks, state.rebirthLevel, debouncedSave]);

  // Synchronous save for page unload/visibility change using fetch with keepalive
  const saveToCloudSync = useCallback((reason: string) => {
    if (!user) return;
    
    const gameState = getStateForCloudSave();
    
    // Use fetch with keepalive for reliable delivery on page close
    const url = `${supabaseUrl}/rest/v1/saves?user_id=eq.${user.id}`;
    
    try {
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          save_data: gameState,
          updated_at: new Date().toISOString()
        }),
        keepalive: true
      });
      console.log('☁️ Sync save initiated:', reason);
    } catch (e) {
      console.error('☁️ Sync save failed:', e);
    }
  }, [user, getStateForCloudSave]);

  // Auto-load from cloud on first login (only once per user)
  useEffect(() => {
    if (!user) {
      // Reset when user logs out
      userIdRef.current = null;
      hasLoadedFromCloud.current = false;
      return;
    }
    
    // Only load once per user session
    if (userIdRef.current === user.id) return;
    
    userIdRef.current = user.id;
    hasLoadedFromCloud.current = false;

    const loadFromCloudOnce = async () => {
      console.log('☁️ Attempting to load from cloud for user:', user.id);
      try {
        const cloudState = await loadGameFromCloud();
        if (cloudState) {
          console.log('☁️ Got cloud state');
          loadFromCloud(cloudState as Parameters<typeof loadFromCloud>[0]);
          lastSavedEssence.current = (cloudState as { essence?: number }).essence || 0;
          console.log('☁️ Loaded game from cloud');
        } else {
          console.log('☁️ No cloud save found');
        }
      } catch (e) {
        console.error('☁️ Error loading from cloud:', e);
      }
      hasLoadedFromCloud.current = true;
    };

    loadFromCloudOnce();
  }, [user?.id, loadGameFromCloud, loadFromCloud]);

  // Auto-save to cloud every 60 seconds (1 minute) if logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      saveToCloud('auto-save (60s)');
    }, 60000); // 60 seconds = 1 minute

    return () => clearInterval(interval);
  }, [user, saveToCloud]);

  // Save on visibility change (tab hide/close) and add warning before unload
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToCloudSync('tab hidden');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save synchronously
      saveToCloudSync('page unload');
      
      // Show warning dialog
      e.preventDefault();
      e.returnValue = 'Вы уверены? Не забудьте сохранить прогресс!';
      return 'Вы уверены? Не забудьте сохранить прогресс!';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, saveToCloudSync]);

  return null;
};

export default CloudSave;
