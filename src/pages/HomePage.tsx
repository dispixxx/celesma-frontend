import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectsApi } from '../api/projects';
import type { ProjectPreviewResponse, ProjectResponseDto } from '../types';
import MainLayout from '../components/layout/MainLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { getCurrentUserRole } from '../utils/projectUtils';

export default function HomePage() {
  const username = useAuthStore((s) => s.username);
  const [projects, setProjects] = useState<ProjectResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();
  const [applications, setApplications] = useState<ProjectPreviewResponse[]>([]);


  const location = useLocation();

  useEffect(() => {
    Promise.all([
      projectsApi.getAll(),
      projectsApi.getMyApplications(),
    ])
      .then(([projs, apps]) => {
        setProjects(projs);
        setApplications(apps);
      })
      .catch(() => showAlert('Не удалось загрузить проекты', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      showAlert(location.state.message, 'success');
      window.history.replaceState({}, document.title);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="request-title">Мои проекты</h2>
            {!loading && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{projects.length} projects</span>}
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Загрузка...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              background: 'var(--bg-alt)',
              border: '1px dashed var(--border)',
              borderRadius: '0.75rem',
              textAlign: 'center',
              gap: '0.5rem',
            }}>
              <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--text-secondary)' }}>
                folder_open
              </span>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Нет проектов</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Создайте первый или найдите существующий
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Link to="/projects/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>add_circle</span>
                  Создать проект
                </Link>
                <Link to="/projects/search" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>search</span>
                  Найти проект
                </Link>
              </div>
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
        {applications.length > 0 && (
          <div className="projects-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="request-title">Мои заявки</h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {applications.length} заявок
              </span>
            </div>
            <div className="projects-grid">
              {applications.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                  <div className="project-header">
                    <h3>{p.name}</h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}>
                      <span className="material-icons" style={{ fontSize: '0.875rem' }}>hourglass_empty</span>
                      На рассмотрении
                    </span>
                  </div>
                  <p className="project-description">{p.description}</p>
                  <div className="project-meta">
                    <span className="open-link">
                      Открыть <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
