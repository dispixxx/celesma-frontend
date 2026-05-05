import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import type { TaskPriority, MemberDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';

export default function TaskNewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', assigneeId: 0,
    priority: 'MEDIUM' as TaskPriority, endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getById(Number(projectId))
      .then((p) => setMembers(p.members))
      .catch(() => {});
  }, [projectId]);

  const setQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm({ ...form, endDate: d.toISOString().split('T')[0] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.assigneeId) { setErrors({ assigneeId: 'Выберите исполнителя' }); return; }
    setLoading(true);
    try {
      const task = await tasksApi.create(Number(projectId), { ...form, assigneeId: Number(form.assigneeId) });
      navigate(`/projects/${projectId}/tasks/${task.id}`);
    } catch (err: any) {
      setErrors(err.response?.data || { general: 'Ошибка создания задачи' });
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.user.id === form.assigneeId);
  const filteredMembers = members.filter((m) =>
    m.user.username.toLowerCase().includes(search.toLowerCase()) ||
    `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProjectLayout>
      <div className="project-content" style={{ maxWidth: '800px' }}>
        <div className="task-form-card">
          <h1 className="form-title">Новая задача</h1>

          {errors.general && <div className="auth-error">{errors.general}</div>}

          <form className="task-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Название <span className="required">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Название задачи" maxLength={255} />
              {errors.title && <small className="error">{errors.title}</small>}
            </div>

            <div className="form-group">
              <label>Описание <span className="required">*</span></label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание задачи" maxLength={1200} />
              {errors.description && <small className="error">{errors.description}</small>}
            </div>

            {/* Исполнитель */}
            <div className="form-group">
              <label>Исполнитель <span className="required">*</span></label>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  width: '100%', padding: '0.625rem 0.75rem',
                  border: `1px solid ${errors.assigneeId ? 'var(--error)' : 'var(--border)'}`,
                  borderRadius: '8px', background: 'var(--bg)',
                  color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s',
                }}
              >
                {selectedMember ? (
                  <>
                    <div className="user-avatar-small">
                      {selectedMember.user.avatarUrl
                        ? <img src={selectedMember.user.avatarUrl} alt={selectedMember.user.username} />
                        : <span>{selectedMember.user.username.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <span style={{ fontWeight: 500 }}>{selectedMember.user.username}</span>
                    <span className={`project-role role-${selectedMember.role}`} style={{ marginLeft: 'auto' }}>
                      {selectedMember.role}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-icons" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>person_search</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Выбрать исполнителя...</span>
                    <span className="material-icons" style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontSize: '1.1rem' }}>expand_more</span>
                  </>
                )}
              </button>
              {errors.assigneeId && <small className="error">{errors.assigneeId}</small>}
            </div>

            <div className="form-group">
              <label>Приоритет</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
              </select>
            </div>

            <div className="form-group">
              <label>Срок выполнения <span className="required">*</span></label>
              <input type="date" id="endDate" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <div className="quick-date-buttons" style={{ marginTop: '0.5rem' }}>
                {[3, 7, 14, 30].map((d) => (
                  <button key={d} type="button" className="btn-date" onClick={() => setQuickDate(d)}>+{d} дн.</button>
                ))}
              </div>
              {errors.endDate && <small className="error">{errors.endDate}</small>}
            </div>

            <div className="form-actions">
              <Link to={`/projects/${projectId}/tasks`} className="btn-secondary">Отмена</Link>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Создаём...' : 'Создать задачу'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Модальное окно выбора исполнителя */}
      {modalOpen && (
        <div
          className="modal"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Выбрать исполнителя</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1rem' }}>
              {/* Поиск */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
                <span className="material-icons" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>search</span>
                <input
                  type="text"
                  placeholder="Поиск по нику или имени..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', width: '100%', fontSize: '0.95rem' }}
                  autoFocus
                />
              </div>

              {/* Список */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '320px', overflowY: 'auto' }}>
                {filteredMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Никого не найдено
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.user.id}
                      onClick={() => { setForm({ ...form, assigneeId: m.user.id }); setModalOpen(false); setSearch(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.625rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                        background: form.assigneeId === m.user.id ? 'var(--primary-light)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (form.assigneeId !== m.user.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
                      onMouseLeave={(e) => { if (form.assigneeId !== m.user.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      <div className="user-avatar-small" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                        {m.user.avatarUrl
                          ? <img src={m.user.avatarUrl} alt={m.user.username} />
                          : <span>{m.user.username.slice(0, 2).toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{m.user.username}</div>
                        {(m.user.firstName || m.user.lastName) && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {m.user.firstName} {m.user.lastName}
                          </div>
                        )}
                      </div>
                      <span className={`project-role role-${m.role}`}>{m.role}</span>
                      {form.assigneeId === m.user.id && (
                        <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>check_circle</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}
