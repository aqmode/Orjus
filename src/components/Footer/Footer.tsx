import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-text">Orjus</span>
              <span className="footer__logo-accent">Adventure</span>
            </Link>
            <p className="footer__description">
              Лучший Minecraft сервер для настоящих приключений. 
              Присоединяйся к нашему сообществу!
            </p>
          </div>

          <div className="footer__links">
            <div className="footer__column">
              <h4 className="footer__column-title">Навигация</h4>
              <ul className="footer__list">
                <li><Link to="/">Главная</Link></li>
                <li><Link to="/about">О сервере</Link></li>
                <li><Link to="/rules">Правила</Link></li>
              </ul>
            </div>

            <div className="footer__column">
              <h4 className="footer__column-title">Подключение</h4>
              <ul className="footer__list">
                <li className="footer__server-ip">
                  <span className="footer__ip-label">IP сервера:</span>
                  <code className="footer__ip-value">play.orjus.ru</code>
                </li>
                <li className="footer__version">Версия: 1.20.x</li>
              </ul>
            </div>

            <div className="footer__column">
              <h4 className="footer__column-title">Сообщество</h4>
              <ul className="footer__list">
                <li>
                  <a href="https://discord.gg/orjus" target="_blank" rel="noopener noreferrer">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="https://vk.com/orjus" target="_blank" rel="noopener noreferrer">
                    ВКонтакте
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} Orjus Adventure. Все права защищены.
          </p>
          <p className="footer__disclaimer">
            Minecraft является торговой маркой Mojang Studios.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
