import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { signUp, signIn, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (isSignUp) {
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают');
        return;
      }
      const success = await signUp(email, password);
      if (success) {
        onClose();
        resetForm();
      }
    } else {
      const success = await signIn(email, password);
      if (success) {
        onClose();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalError(null);
    clearError();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>×</button>
        
        <h2 className="auth-modal__title">
          {isSignUp ? 'Регистрация' : 'Вход'}
        </h2>
        
        <form className="auth-modal__form" onSubmit={handleSubmit}>
          <div className="auth-modal__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="auth-modal__field">
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
            />
          </div>
          
          {isSignUp && (
            <div className="auth-modal__field">
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
              />
            </div>
          )}
          
          {displayError && (
            <div className="auth-modal__error">
              {displayError}
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-modal__submit"
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        
        <div className="auth-modal__switch">
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
      </div>
    </div>
  );
};

export default AuthModal;
