import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import type { ProjectResponseDto } from '../types';
import { useAuthStore } from '../store/authStore';
import { getCurrentUserRole, getMemberCount } from '../utils/projectUtils';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { username } = useAuthStore();
  const [projects, setProjects] = useState<ProjectResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Мои проекты</h1>
        <button onClick={() => navigate('/projects/new')}>+ Новый проект</button>
      </div>

      {projects.length === 0 ? (
        <p className="empty">У вас пока нет проектов</p>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const role = getCurrentUserRole(p, username);
            const count = getMemberCount(p);
            return (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <h2>{p.name}</h2>
                <p>{p.description}</p>
                <div className="project-meta">
                  <span className={`role role-${role}`}>{role}</span>
                  <span>{count} участников</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
