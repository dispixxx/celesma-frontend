import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectsApi } from '../api/projects';
import type { ProjectResponseDto } from '../types';
import MainLayout from '../components/layout/MainLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { getCurrentUserRole } from '../utils/projectUtils';

export default function HomePage() {
  const username = useAuthStore((s) => s.username);
  const [projects, setProjects] = useState<ProjectResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    projectsApi.getAll()
      .then(setProjects)
      .catch(() => showAlert('Не удалось загрузить проекты', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="home-container">
        <h1 className="home-title">
          Привет, <span className="username">{username}</span>!
        </h1>

        <div className="home-actions">
          <Link to="/projects/new" className="link-create-new-project">
            <span className="material-icons">add_circle</span>
            Создать проект
          </Link>
          <Link to="/projects/search" className="link-search">
            <span className="material-icons">search</span>
            Найти проект
          </Link>
        </div>

        <div className="projects-section">
          <h2 className="request-title">Мои проекты</h2>

          {loading ? (
            <div className="empty-state">
              <p>Загрузка...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">folder_open</span>
              <h2>Нет проектов</h2>
              <p>Создайте первый проект или найдите существующий</p>
              <Link to="/projects/new" className="btn-primary">Создать проект</Link>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((p) => {
                const role = getCurrentUserRole(p, username);
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                    <div className="project-header">
                      <h3>{p.name}</h3>
                      <span className={`project-role role-${role}`}>
                        {role}
                      </span>
                    </div>
                    <p className="project-description">{p.description}</p>
                    <div className="project-meta">
                      <span className="open-link">
                        Открыть <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
