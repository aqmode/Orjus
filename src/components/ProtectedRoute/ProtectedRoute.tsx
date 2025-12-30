import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean; // If true, also check for completed profile
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireProfile = true }) => {
  const { user, isLoading, needsEmailVerification, needsProfileSetup } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
          }
          .loading-content {
            text-align: center;
            color: #888;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top-color: #9945FF;
            border-radius: 50%;
            margin: 0 auto 1rem;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification
  if (needsEmailVerification) {
    return <Navigate to="/login" replace />;
  }

  // Check profile completion (except on profile page)
  if (requireProfile && needsProfileSetup && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
