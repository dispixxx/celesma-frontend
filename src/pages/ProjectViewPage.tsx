import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import type { ProjectResponseDto, TaskStatus, ApplicantResponseDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import { useAuthStore } from '../store/authStore';
import { getCurrentUserRole, isProjectMember, getMemberCount, isApplicant as checkIsApplicant } from '../utils/projectUtils';

const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Новые', IN_PROGRESS: 'В работе', REVIEW: 'Проверка',
  COMPLETED: 'Готово', ON_HOLD: 'Пауза', CANCELED: 'Отменено',
};

export default function ProjectViewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useAuthStore();
  const [project, setProject] = useState<ProjectResponseDto | null>(null);
  const [applicants, setApplicants] = useState<ApplicantResponseDto[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const loadProject = () => {
    if (!projectId) return;
    Promise.all([
      projectsApi.getById(Number(projectId)),
      tasksApi.getByProject(Number(projectId)).catch(() => []),
      projectsApi.getApplicants(Number(projectId)).catch(() => []),
    ]).then(([proj, tasks, apps]) => {
      setProject(proj);
      setApplicants(apps);
      const counts: Record<string, number> = {};
      tasks.forEach((t: any) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      setStatusCounts(counts);
    }).catch(() => showAlert('Ошибка загрузки проекта', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProject(); }, [projectId]);

  // Показ ошибки из state (например, при редиректе с настроек)
  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      showAlert(state.error, 'error');
      // Очищаем state чтобы не показывать повторно при обновлении
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      await projectsApi.join(Number(projectId));
      showAlert('Заявка отправлена! Ожидайте подтверждения.', 'success');
      loadProject();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка отправки заявки', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCancelJoin = async () => {
    setJoinLoading(true);
    try {
      await projectsApi.cancelJoin(Number(projectId));
      showAlert('Заявка отозвана', 'info');
      loadProject();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка', 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <ProjectLayout><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;
  if (!project) return <ProjectLayout><div className="empty-state"><p>Проект не найден</p></div></ProjectLayout>;

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const completed = statusCounts['COMPLETED'] || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isMember = isProjectMember(project, username);
  const currentUserRole = getCurrentUserRole(project, username);
  const memberCount = getMemberCount(project);
  const userIsApplicant = checkIsApplicant(applicants, username);

  return (
    <ProjectLayout isMember={isMember} userRole={currentUserRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="two-cols">
        <section className="col-main">
          <div className="project-info-card">
            <header className="project-header">
              <h1>{project.name}</h1>
              <p className="project-description">{project.description}</p>
            </header>

            {/* Блок для не-участника */}
            {!isMember && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                textAlign: 'center',
              }}>
                <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
                  lock
                </span>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Вы не участник этого проекта
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Подайте заявку на вступление — администратор рассмотрит её и примет решение.
                </p>

                {userIsApplicant ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.2rem', borderRadius: '8px',
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      fontWeight: 600, fontSize: '0.95rem',
                    }}>
                      <span className="material-icons" style={{ fontSize: '1.1rem' }}>hourglass_empty</span>
                      Заявка на рассмотрении
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={handleCancelJoin}
                      disabled={joinLoading}
                      style={{ fontSize: '0.875rem' }}
                    >
                      Отозвать заявку
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={handleJoin}
                    disabled={joinLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>person_add</span>
                    {joinLoading ? 'Отправляем...' : 'Подать заявку'}
                  </button>
                )}
              </div>
            )}

            {/* Прогресс — только для участников */}
            {isMember && (
              <section className="progress-section">
                <h2 className="section-title">Прогресс проекта</h2>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-text">
                  <span>{completed}</span> из <span>{total}</span> задач завершено
                </p>
                <div className="status-grid">
                  {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((st) => (
                    <div 
                      key={st} 
                      className={`status-card ${st}`}
                      onClick={() => navigate(`/projects/${projectId}/tasks?status=${st}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="status-count">{statusCounts[st] || 0}</span>
                      <span className="status-name">{STATUS_LABELS[st]}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        {isMember && (
          <aside className="col-side">
            <div className="project-info-card">
              <h2 className="section-title">Участники</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Всего: {memberCount}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.members.map((m) => (
                  <Link
                    key={m.memberId}
                    to={`/profile/${m.user.username}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserAvatar username={m.user.username} avatarUrl={m.user.avatarUrl} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.user.username}
                      </div>
                      {m.joinedAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          с {m.joinedAt}
                        </div>
                      )}
                    </div>
                    <span className={`project-role role-${m.role}`}>{m.role}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>


    </ProjectLayout>
  );
}
