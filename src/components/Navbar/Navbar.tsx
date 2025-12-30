import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/game', label: 'Игра' },
    { path: '/achievements', label: 'Достижения' },
    { path: '/materials', label: 'Материалы' },
    { path: '/leaderboard', label: '🏆 Топ' },
    { path: '/about', label: 'Об игре' },
    { path: '/rules', label: 'Правила' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-void">Void</span>
          <span className="navbar__logo-accent">Clicker</span>
        </Link>

        <button 
          className={`navbar__burger ${isMobileMenuOpen ? 'navbar__burger--active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Меню"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar__menu ${isMobileMenuOpen ? 'navbar__menu--open' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.path} className="navbar__item">
              <Link 
                to={link.path} 
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          
          {/* Auth button */}
          <li className="navbar__item">
            {user ? (
              <div className="navbar__user">
                <Link 
                  to="/profile" 
                  className="navbar__profile-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  👤 Профиль
                </Link>
                <button 
                  className="navbar__logout-btn"
                  onClick={() => signOut()}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="navbar__auth-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Войти
              </Link>
            )}
          </li>
          
          <li className="navbar__item navbar__item--cta">
            <Link 
              to="/game" 
              className="navbar__play-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🎮 Играть
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
