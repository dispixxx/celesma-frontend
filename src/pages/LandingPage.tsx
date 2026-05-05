import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-logo">🌌 Celesma</div>
        <h1 className="welcome-title">Управляй проектами</h1>
        <p className="welcome-text">
          Канбан, роадмап, чат и задачи — всё в одном месте
        </p>
        <nav className="welcome-nav">
          <Link to="/login" className="welcome-button welcome-button-primary">
            Войти
          </Link>
          <Link to="/register" className="welcome-button welcome-button-outline">
            Зарегистрироваться
          </Link>
        </nav>
      </div>
    </div>
  );
}
