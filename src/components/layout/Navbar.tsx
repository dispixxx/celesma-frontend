import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UserAvatar from '../ui/UserAvatar';

export default function Navbar() {
  const { username, avatarUrl, logout, loadUserData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем данные пользователя при монтировании, если аватарка ещё не загружена
    if (username && !avatarUrl) {
      loadUserData();
    }
  }, [username, avatarUrl, loadUserData]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="top-nav">
      <Link to="/home" className="top-nav__logo">
        Celesma
      </Link>

      <div className="top-nav__menu">
        <Link to="/home" className="top-nav__link">Главная</Link>
        <Link to="/projects/search" className="top-nav__link">Поиск</Link>
      </div>

      <div className="profile-dropdown">
        <button className="profile-trigger">
          <UserAvatar username={username || ''} avatarUrl={avatarUrl} size="small" />
          <span className='profile-username'>{username}</span>
        </button>

        <div className="dropdown-menu">
          <Link to={`/profile/${username}`} className="dropdown-item">
            <span className="material-icons">person</span>
            Профиль
          </Link>
          <Link to="/settings" className="dropdown-item">
            <span className="material-icons">settings</span>
            Настройки
          </Link>
          <button className="dropdown-item logout" onClick={handleLogout}>
            <span className="material-icons">logout</span>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
}
