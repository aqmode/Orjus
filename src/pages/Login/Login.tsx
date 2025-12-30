import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { 
    user, 
    signUp, 
    signIn, 
    isLoading, 
    error, 
    clearError, 
    needsProfileSetup
  } = useAuth();
  const navigate = useNavigate();

  // Redirect based on user state
  useEffect(() => {
    if (user) {
      if (needsProfileSetup) {
        navigate('/profile');
      } else {
        navigate('/game');
      }
    }
  }, [user, needsProfileSetup, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (isSignUp) {
      const success = await signUp(nickname, password, confirmPassword);
      if (success) {
        // Redirect will happen in useEffect
      }
    } else {
      const success = await signIn(nickname, password);
      if (success) {
        // Redirect will happen in useEffect
      }
    }
  };

  const resetForm = () => {
    setNickname('');
    setPassword('');
    setConfirmPassword('');
    setLocalError(null);
    clearError();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-logo">
            <span className="logo-orjus">Orjus</span>
          </h1>
          <p className="login-subtitle">
            {isSignUp ? 'Создайте аккаунт' : 'Войдите в игру'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="nickname">Никнейм</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите никнейм"
              required
              disabled={isLoading}
              autoComplete="username"
              minLength={3}
              maxLength={20}
            />
            <small className="field-hint">3-20 символов, только буквы, цифры и _</small>
          </div>
          
          <div className="login-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>
          
          {isSignUp && (
            <div className="login-field">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}
          
          {displayError && (
            <div className="login-error">
              {displayError}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : (isSignUp ? '🚀 Зарегистрироваться' : '🎮 Войти')}
          </button>
        </form>
        
        <div className="login-switch">
          {isSignUp ? (
            <p>
              Уже есть аккаунт?{' '}
              <button type="button" onClick={toggleMode}>Войти</button>
            </p>
          ) : (
            <p>
              Нет аккаунта?{' '}
              <button type="button" onClick={toggleMode}>Зарегистрироваться</button>
            </p>
          )}
        </div>

        <div className="login-features">
          <div className="feature">
            <span className="feature-icon">☁️</span>
            <span className="feature-text">Облачное сохранение</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🏆</span>
            <span className="feature-text">Достижения</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span className="feature-text">Статистика</span>
          </div>
        </div>

        <p className="server-note">
          Часть вселенной <span className="highlight">Orjus</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
