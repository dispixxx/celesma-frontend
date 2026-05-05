import { NavLink, useParams } from 'react-router-dom';

interface BottomNavProps {
  isMember?: boolean;
}

export default function BottomNav({ isMember = true }: BottomNavProps) {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <nav className="bottom-nav" id="bottomNav">
        <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="material-icons">home</span>
          <span>Главная</span>
        </NavLink>
        <NavLink to="/projects/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="material-icons">search</span>
          <span>Поиск</span>
        </NavLink>
        <NavLink to="/projects/new" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="material-icons">add_circle</span>
          <span>Создать</span>
        </NavLink>
      </nav>
    );
  }

  // Не-участник видит только обзор
  if (!isMember) {
    return (
      <nav className="bottom-nav" id="bottomNav">
        <NavLink to={`/projects/${projectId}`} end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="material-icons">home</span>
          <span>Обзор</span>
        </NavLink>
        <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="material-icons">arrow_back</span>
          <span>Назад</span>
        </NavLink>
      </nav>
    );
  }

  const links = [
    { to: `/projects/${projectId}`,         icon: 'home',        label: 'Обзор',     end: true },
    { to: `/projects/${projectId}/tasks`,    icon: 'task',        label: 'Задачи',    end: false },
    { to: `/projects/${projectId}/kanban`,   icon: 'view_kanban', label: 'Канбан',    end: false },
    { to: `/projects/${projectId}/roadmap`,  icon: 'map',         label: 'Роадмап',   end: false },
    { to: `/projects/${projectId}/chat`,     icon: 'chat',        label: 'Чат',       end: false },
    { to: `/projects/${projectId}/settings`, icon: 'settings',    label: 'Настройки', end: false },
  ];

  return (
    <nav className="bottom-nav" id="bottomNav">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="material-icons">{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
