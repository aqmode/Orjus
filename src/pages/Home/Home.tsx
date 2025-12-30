import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});
  const { user } = useAuth();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, observerOptions);

    Object.values(sectionsRef.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: '⚔️',
      title: 'Кликер',
      description: 'Кликай, чтобы добывать эссенцию пустоты. Чем больше - тем сильнее!'
    },
    {
      icon: '⬆️',
      title: 'Улучшения',
      description: 'Покупай улучшения DPC и DPS. Включай автопокупку!'
    },
    {
      icon: '🔄',
      title: 'Перерождение',
      description: 'Переродись, чтобы получить множители урона и новые возможности.'
    },
    {
      icon: '🏆',
      title: 'Достижения',
      description: 'Открывай достижения и получай бонусные очки.'
    },
    {
      icon: '☁️',
      title: 'Облачное сохранение',
      description: 'Твой прогресс сохраняется в облаке. Играй с любого устройства!'
    },
    {
      icon: '🔋',
      title: 'Энергия',
      description: 'Управляй энергией для более мощных кликов!'
    }
  ];

  const stats = [
    { value: '16', label: 'Улучшений' },
    { value: '∞', label: 'Перерождений' },
    { value: '24+', label: 'Достижений' },
    { value: '☁️', label: 'Облако' }
  ];

  return (
    <main className="home">
      {/* Hero Section with Video */}
      <section className="hero">
        <div className="hero__video-container">
          <video 
            className="hero__video"
            autoPlay 
            muted 
            loop 
            playsInline
            poster="/video-poster.jpg"
          >
            <source src="/minecraft.mp4" type="video/mp4" />
          </video>
          <div className="hero__overlay"></div>
        </div>

        <div className="hero__content">
          <h1 className="hero__title animate-fade-in-down">
            <span className="hero__title-void">Void</span>
            <span className="hero__title-clicker">Clicker</span>
          </h1>
          <p className="hero__subtitle animate-fade-in-up delay-200">
            Idle-кликер во вселенной Orjus Adventure
          </p>
          <p className="hero__description animate-fade-in-up delay-300">
            Собирай эссенцию пустоты, улучшай свои способности, 
            перерождайся и стань сильнейшим кликером!
          </p>
          
          <div className="hero__actions animate-fade-in-up delay-400">
            <div className="hero__buttons">
              <Link to={user ? "/game" : "/login"} className="btn btn-primary hero__play-btn animate-pulse">
                🎮 {user ? 'Играть' : 'Начать игру'}
              </Link>
              {!user && (
                <Link to="/login" className="btn btn-secondary hero__login-btn">
                  Войти
                </Link>
              )}
            </div>
            <p className="hero__server-note">
              Часть вселенной сервера <a href="minecraft://play.orjus.ru" className="server-link">Orjus Adventure</a>
            </p>
          </div>
        </div>

        <div className="hero__scroll-indicator animate-float">
          <span>Листай вниз</span>
          <div className="hero__scroll-arrow">↓</div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        id="stats"
        ref={(el) => { sectionsRef.current['stats'] = el; }}
        className={`stats-section ${isVisible['stats'] ? 'visible' : ''}`}
      >
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="stat-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features"
        ref={(el) => { sectionsRef.current['features'] = el; }}
        className={`features-section section ${isVisible['features'] ? 'visible' : ''}`}
      >
        <div className="container">
          <h2 className="section-title text-center">
            <span className="text-accent">Что</span> в игре?
          </h2>
          <p className="section-subtitle text-center">
            Void Clicker — глубокий idle-кликер с системой прогрессии
          </p>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        id="cta"
        ref={(el) => { sectionsRef.current['cta'] = el; }}
        className={`cta-section ${isVisible['cta'] ? 'visible' : ''}`}
      >
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Готов покорить Пустоту?</h2>
            <p className="cta-description">
              Зарегистрируйся и начни собирать эссенцию прямо сейчас!
            </p>
            <div className="cta-buttons">
              <Link to={user ? "/game" : "/login"} className="btn btn-primary">
                🎮 {user ? 'Продолжить игру' : 'Начать играть'}
              </Link>
              <Link to="/about" className="btn btn-secondary">
                Подробнее об игре
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
