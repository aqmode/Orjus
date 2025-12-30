import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import './Profile.css';

interface ProfileData {
  nickname: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  isProfileComplete: boolean;
}

const defaultAvatars = [
  '🎮', '⚔️', '🛡️', '💎', '🌟', '🔥', '❄️', '⚡',
  '🐉', '🦊', '🐺', '🦁', '🐻', '🐼', '🦄', '👾'
];

const Profile: React.FC = () => {
  const { user, signOut, needsProfileSetup, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData>({
    nickname: '',
    displayName: '',
    avatarUrl: '🎮',
    bio: '',
    createdAt: new Date().toISOString(),
    isProfileComplete: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setProfile({
            nickname: data.nickname || '',
            displayName: data.display_name || '',
            avatarUrl: data.avatar_url || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
            bio: data.bio || '',
            createdAt: data.created_at || new Date().toISOString(),
            isProfileComplete: data.is_profile_complete || false
          });
          setIsFirstSetup(!data.is_profile_complete);
        } else {
          // First time - definitely needs setup
          setIsFirstSetup(true);
          setProfile(prev => ({
            ...prev,
            nickname: user.nickname || user.displayName || 'Player',
            avatarUrl: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  // Check if profile is complete on mount
  useEffect(() => {
    if (needsProfileSetup) {
      setIsFirstSetup(true);
    }
  }, [needsProfileSetup]);

  const handleSave = async () => {
    if (!user) return;
    
    if (!profile.nickname.trim()) {
      setMessage({ type: 'error', text: 'Никнейм обязателен!' });
      return;
    }

    if (profile.nickname.trim().length < 3) {
      setMessage({ type: 'error', text: 'Никнейм должен быть минимум 3 символа' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

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
        bio: profile.bio,
        is_profile_complete: true,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      // Update AuthContext
      await updateProfile({
        nickname: profile.nickname,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        isProfileComplete: true
      });

      setMessage({ type: 'success', text: 'Профиль сохранён!' });
      
      // If first setup, redirect to game
      if (isFirstSetup) {
        setTimeout(() => navigate('/game'), 1000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Ошибка сохранения' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {isFirstSetup ? (
          <>
            <h1 className="profile-title setup-title">🎮 Настройка профиля</h1>
            <p className="profile-subtitle">Заполните профиль, чтобы начать играть</p>
          </>
        ) : (
          <h1 className="profile-title">Профиль</h1>
        )}
        
        <div className="profile-card">
          {/* Avatar Selection */}
          <div className="profile-section">
            <label className="profile-label">Аватар</label>
            <div className="avatar-display">
              <span className="current-avatar">{profile.avatarUrl}</span>
            </div>
            <div className="avatar-grid">
              {defaultAvatars.map((emoji) => (
                <button
                  key={emoji}
                  className={`avatar-option ${profile.avatarUrl === emoji ? 'selected' : ''}`}
                  onClick={() => setProfile({ ...profile, avatarUrl: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div className="profile-section">
            <label className="profile-label" htmlFor="nickname">
              Никнейм <span className="required">*</span>
            </label>
            <input
              id="nickname"
              type="text"
              className="profile-input"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              placeholder="Ваш игровой ник"
              maxLength={20}
            />
          </div>

          {/* Display Name */}
          <div className="profile-section">
            <label className="profile-label" htmlFor="displayName">Отображаемое имя</label>
            <input
              id="displayName"
              type="text"
              className="profile-input"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="Имя для отображения"
              maxLength={30}
            />
          </div>

          {/* Bio */}
          <div className="profile-section">
            <label className="profile-label" htmlFor="bio">О себе</label>
            <textarea
              id="bio"
              className="profile-textarea"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Расскажите о себе..."
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{profile.bio.length}/200</span>
          </div>

          {/* Nickname (readonly) */}
          <div className="profile-section">
            <label className="profile-label">Никнейм</label>
            <input
              type="text"
              className="profile-input readonly"
              value={user.nickname}
              readOnly
            />
            <small className="field-hint">Никнейм нельзя изменить после регистрации</small>
          </div>

          {/* Message */}
          {message && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="profile-actions">
            <button 
              className="profile-btn save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
            <button 
              className="profile-btn logout-btn"
              onClick={handleLogout}
            >
              🚪 Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
