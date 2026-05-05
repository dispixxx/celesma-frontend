import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';

interface SidebarProps {
  isMember?: boolean;
}

export default function Sidebar({ isMember = true }: SidebarProps) {
  const { projectId } = useParams();
  const [open, setOpen] = useState(false);

  if (!projectId) return null;

  const links = [
    { to: `/projects/${projectId}`,         icon: 'home',        label: 'Обзор' },
    { to: `/projects/${projectId}/tasks`,    icon: 'task',        label: 'Задачи' },
    { to: `/projects/${projectId}/kanban`,   icon: 'view_kanban', label: 'Канбан' },
    { to: `/projects/${projectId}/roadmap`,  icon: 'map',         label: 'Роадмап' },
    { to: `/projects/${projectId}/chat`,     icon: 'chat',        label: 'Чат' },
    { to: `/projects/${projectId}/settings`, icon: 'settings',    label: 'Настройки' },
  ];

  return (
    <>
      {isMember && (
        <button
          id="sidebarToggle"
          className="sidebar-toggle"
          onClick={() => setOpen(!open)}
        >
          <span className="material-icons">menu</span>
        </button>
      )}

      <aside className={`project-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to={`/projects/${projectId}`} className="sidebar-title-link">
            <span className="material-icons">folder</span>
            <h3>Проект</h3>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {/* Обзор виден всем */}
          <NavLink
            to={`/projects/${projectId}`}
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span className="material-icons">home</span>
            Обзор
          </NavLink>

          {/* Остальные ссылки — только участникам */}
          {isMember && links.slice(1).map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="material-icons">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}

          {/* Для не-участника — подсказка */}
          {!isMember && (
            <div style={{
              padding: '1rem 0.75rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              borderTop: '1px solid var(--border)',
              marginTop: '0.5rem',
            }}>
              <span className="material-icons" style={{ fontSize: '1.1rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>
                lock
              </span>
              Вступите в проект чтобы получить доступ
            </div>
          )}
        </nav>
      </aside>

      {open && isMember && (
        <div className="project-overlay" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
