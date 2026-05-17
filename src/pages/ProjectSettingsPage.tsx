import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import type { ProjectResponse, UserSummary, ProjectRole } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [applicants, setApplicants] = useState<UserSummary[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [proj, apps] = await Promise.all([
        projectsApi.getById(Number(projectId)),
        projectsApi.getApplicants(Number(projectId)),
      ]);
      setProject(proj);
      setApplicants(apps);
      setForm({ name: proj.name, description: proj.description });
    } catch {
      showAlert('Ошибка загрузки', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [projectId]);

  // Проверка прав доступа
  useEffect(() => {
    if (!loading && project && project.currentUserRole !== 'ADMIN' && project.currentUserRole !== 'MODERATOR') {
      navigate(`/projects/${projectId}`, { state: { error: 'У вас нет прав для доступа к настройкам проекта' } });
    }
  }, [loading, project, projectId, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsApi.update(Number(projectId), form);
      showAlert('Проект обновлён', 'success');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка сохранения', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ Удалить проект и все его задачи?')) return;
    try {
      await projectsApi.delete(Number(projectId));
      navigate('/home');
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка удаления', 'error');
    }
  };

  const handleAccept = async (userId: number) => {
    try {
      await projectsApi.acceptApplicant(Number(projectId), userId);
      showAlert('Заявка принята', 'success');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка', 'error');
    }
  };

  const handleDecline = async (userId: number) => {
    try {
      await projectsApi.declineApplicant(Number(projectId), userId);
      showAlert('Заявка отклонена', 'info');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка', 'error');
    }
  };

  const handleRoleChange = async (memberId: number, newRole: ProjectRole) => {
    try {
      await projectsApi.updateMemberRole(Number(projectId), memberId, newRole);
      showAlert('Роль изменена', 'success');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка изменения роли', 'error');
    }
  };

  const handleRemoveMember = async (memberId: number, username: string) => {
    if (!confirm(`Удалить ${username} из проекта?`)) return;
    try {
      await projectsApi.removeMember(Number(projectId), memberId);
      showAlert('Участник удалён', 'info');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка удаления', 'error');
    }
  };

  if (loading) return <ProjectLayout><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;
  if (!project) return <ProjectLayout><div className="empty-state"><p>Проект не найден</p></div></ProjectLayout>;

  const isMember = project.currentUserRole !== 'VIEWER';
  const isAdmin = project.currentUserRole === 'ADMIN';
  const isModerator = project.currentUserRole === 'MODERATOR';

  return (
    <ProjectLayout isMember={isMember} userRole={project.currentUserRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="two-cols">
        <section className="col-main">
          <div className="col-main-settings-container">

            {/* Редактирование проекта */}
            {(isAdmin || isModerator) && (
              <div className="settings-card">
                <h2>Основная информация</h2>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label>Название</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Описание</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Сохранить
                  </button>
                </form>
              </div>
            )}

            {/* Заявки на вступление */}
            {(isAdmin || isModerator) && (
              <div className="settings-card">
                <h2>
                  Заявки на вступление
                  {applicants.length > 0 && (
                    <span style={{
                      marginLeft: '0.75rem',
                      background: 'var(--error)',
                      color: 'white',
                      borderRadius: '999px',
                      padding: '0.1rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}>
                      {applicants.length}
                    </span>
                  )}
                </h2>

                {applicants.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    <span className="material-icons" style={{ opacity: 0.5 }}>inbox</span>
                    <p>Нет новых заявок</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="request-row">
                        <Link 
                          to={`/profile/${applicant.username}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}
                        >
                          <UserAvatar username={applicant.username} avatarUrl={applicant.avatarUrl} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{applicant.username}</div>
                            {(applicant.firstName || applicant.lastName) && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {applicant.firstName} {applicant.lastName}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="request-row-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => handleAccept(applicant.id)}
                          >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>check</span>
                            Принять
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => handleDecline(applicant.id)}
                          >
                            <span className="material-icons" style={{ fontSize: '1rem' }}>close</span>
                            Отклонить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Удаление проекта */}
            {isAdmin && (
              <div className="settings-card">
                <h2>Опасная зона</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Удаление проекта необратимо. Все задачи и данные будут удалены.
                </p>
                <button className="btn-danger" onClick={handleDelete}>
                  <span className="material-icons">delete_forever</span>
                  Удалить проект
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="col-side">
          <div className="settings-card">
            <h2>Участники</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Всего: {project.memberCount}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {project.members.map((m) => (
                <div key={m.memberId} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)'
                }}>
                  <Link 
                    to={`/profile/${m.user.username}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
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
                  </Link>
                  
                  {(isAdmin || isModerator) && !m.isOwner ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.memberId, e.target.value as ProjectRole)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        {isAdmin && <option value="ADMIN">ADMIN</option>}
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.memberId, m.user.username)}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--error-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Удалить из проекта"
                      >
                        <span className="material-icons" style={{ fontSize: '1.1rem' }}>person_remove</span>
                      </button>
                    </div>
                  ) : (
                    <span className={`project-role role-${m.role}`}>{m.role}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ProjectLayout>
  );
}
