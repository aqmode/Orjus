import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const gameMechanics = [
    {
      name: 'Кликер',
      icon: '⚔️',
      description: 'Основа игры — кликай по кнопке, чтобы получать эссенцию пустоты. Каждый клик приносит урон (DPC).',
      features: ['Урон за клик (DPC)', 'Система энергии', 'Регенерация энергии', 'Автоматизация']
    },
    {
      name: 'Пассивный доход',
      icon: '💰',
      description: 'DPS — урон в секунду. Покупай тотемы, чтобы получать эссенцию даже когда не кликаешь.',
      features: ['5 уровней тотемов', 'Автоматический доход', 'Стакается с кликами', 'Масштабируется']
    },
    {
      name: 'Энергия',
      icon: '🔋',
      description: 'Управляй энергией для усиленных кликов. Больше энергии — больше урона!',
      features: ['Расширение запаса', 'Быстрая регенерация', 'Бонусы к урону', 'Прокачка']
    },
    {
      name: 'Перерождение',
      icon: '🔄',
      description: 'Сбрось прогресс, чтобы получить очки перерождения и постоянные множители урона.',
      features: ['Множитель урона x0.5', 'Очки перерождения', 'Новые бонусы', 'Бесконечное развитие']
    }
  ];

  const upgradeTypes = [
    {
      title: 'DPC Улучшения',
      icon: '👊',
      items: ['Малый удар (+1)', 'Удар (+3)', 'Сильный удар (+10)', 'Огромный удар (+50)', 'Божественный удар (+250)'],
      color: '#9945FF'
    },
    {
      title: 'DPS Улучшения', 
      icon: '🗼',
      items: ['Малый тотем (+1/с)', 'Тотем (+3/с)', 'Сильный тотем (+10/с)', 'Огромный тотем (+50/с)', 'Божественный тотем (+250/с)'],
      color: '#55ffff'
    },
    {
      title: 'Энергия',
      icon: '🔋',
      items: ['Расширение (+5 макс)', 'Большой запас (+10 макс)', 'Огромный запас (+25 макс)', 'Быстрая регенерация', 'Мгновенная регенерация'],
      color: '#ffaa00'
    }
  ];

  return (
    <main className={`about-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="about-hero">
        <div className="container">
          <h1 className="about-title">
            <span className="text-purple">Об</span> игре
          </h1>
          <p className="about-subtitle">
            Всё, что нужно знать о Orjus
          </p>
        </div>
      </div>

      {/* About Section */}
      <section className="about-intro section">
        <div className="container">
          <div className="intro-content">
            <div className="intro-text">
              <h2 className="section-heading">
                Добро пожаловать в <span className="text-purple">Orjus</span>
              </h2>
              <p>
                Orjus — это idle-кликер во вселенной Minecraft сервера Orjus. 
                Собирай эссенцию пустоты, покупай улучшения и становись сильнее!
              </p>
              <p>
                Игра сочетает классическую механику кликера с глубокой системой прогрессии: 
                улучшения, перерождение и достижения. Твой прогресс сохраняется 
                в облаке, играй с любого устройства!
              </p>
            </div>
            <div className="intro-image">
              <div className="intro-logo void-logo">
                <span className="logo-text">O</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Mechanics */}
      <section className="game-modes section">
        <div className="container">
          <h2 className="section-heading text-center">
            <span className="text-accent">Игровые</span> механики
          </h2>
          <div className="modes-grid">
            {gameMechanics.map((mode, index) => (
              <div 
                key={index} 
                className="mode-card card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mode-icon">{mode.icon}</div>
                <h3 className="mode-name">{mode.name}</h3>
                <p className="mode-description">{mode.description}</p>
                <ul className="mode-features">
                  {mode.features.map((feature, fIndex) => (
                    <li key={fIndex}>
                      <span className="feature-bullet">✦</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrades */}
      <section className="timeline-section section">
        <div className="container">
          <h2 className="section-heading text-center">
            <span className="text-gold">Улучшения</span>
          </h2>
          <div className="upgrades-info-grid">
            {upgradeTypes.map((type, index) => (
              <div 
                key={index} 
                className="upgrade-info-card"
                style={{ borderColor: type.color }}
              >
                <div className="upgrade-info-header">
                  <span className="upgrade-info-icon">{type.icon}</span>
                  <h3 style={{ color: type.color }}>{type.title}</h3>
                </div>
                <ul className="upgrade-info-list">
                  {type.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="join-section section">
        <div className="container">
          <div className="join-content">
            <h2 className="join-title">Готов начать?</h2>
            <p className="join-description">
              Зарегистрируйся и начни собирать эссенцию пустоты!
            </p>
            <div className="join-buttons">
              <Link to="/game" className="btn btn-primary">
                🎮 Играть
              </Link>
              <Link to="/achievements" className="btn btn-secondary">
                🏆 Достижения
              </Link>
            </div>
            <p className="server-reference">
              Часть вселенной сервера <a href="minecraft://play.orjus.ru">Orjus</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
