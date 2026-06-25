import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import type { AiDescriptionAction, TaskPriority, TaskResponse, MemberResponseDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { useProjectRole } from '../hooks/useProjectRole';

export default function TaskEditPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const userRole = useProjectRole(projectId);
  const [original, setOriginal] = useState<TaskResponse | null>(null);
  const [members, setMembers] = useState<MemberResponseDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', assigneeId: 0,
    priority: 'MEDIUM' as TaskPriority, endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGeneratingTitle, setAiGeneratingTitle] = useState(false);
  const [aiProcessingDesc, setAiProcessingDesc] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getMembers(Number(projectId))
      .then((members) => setMembers(members))
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!taskId) return;
    tasksApi.getById(Number(taskId))
      .then((task) => {
        setOriginal(task);
        // Преобразуем дату из формата dd.MM.yyyy в yyyy-MM-dd
        let formattedDate = '';
        if (task.endDate) {
          const parts = task.endDate.split('.');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            formattedDate = task.endDate;
          }
        }
        setForm({
          title: task.title,
          description: task.description || '',
          assigneeId: task.assignee?.id || 0,
          priority: task.priority,
          endDate: formattedDate,
        });
      })
      .catch(() => showAlert('Ошибка загрузки задачи', 'error'))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleGenerateTitle = async () => {
    if (!form.description.trim()) {
      setErrors((prev) => ({ ...prev, description: 'Сначала напишите описание задачи' }));
      return;
    }
    setAiGeneratingTitle(true);
    try {
      const generatedTitle = await tasksApi.generateTitle(form.description);
      setForm((prev) => ({ ...prev, title: generatedTitle }));
    } catch {
      showAlert('Не удалось сгенерировать название. Попробуйте позже.', 'error');
    } finally {
      setAiGeneratingTitle(false);
    }
  };

  const handleAiProcessDescription = async (action: AiDescriptionAction) => {
    if (!form.description.trim()) return;
    setAiProcessingDesc(true);
    try {
      const result = await tasksApi.aiProcess(form.description, action);
      setForm((prev) => ({ ...prev, description: result }));
    } catch {
      showAlert('Ошибка AI-обработки. Попробуйте позже.', 'error');
    } finally {
      setAiProcessingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await tasksApi.update(Number(taskId), { ...form, assigneeId: Number(form.assigneeId) });
      showAlert('Задача обновлена', 'success');
      setTimeout(() => navigate(`/projects/${projectId}/tasks/${taskId}`), 800);
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Нет прав для изменения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetField = (field: keyof typeof form) => {
    if (!original) return;
    let value: any;
    if (field === 'assigneeId') {
      value = original.assignee?.id || 0;
    } else if (field === 'endDate' && original.endDate) {
      // Преобразуем дату из формата dd.MM.yyyy в yyyy-MM-dd
      const parts = original.endDate.split('.');
      value = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : original.endDate;
    } else {
      value = (original as any)[field] || '';
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setQuickDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm({ ...form, endDate: d.toISOString().split('T')[0] });
  };

  const selectedMember = members.find((m) => m.user.id === form.assigneeId);


  if (loading) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;

  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="task-form-card">
          <h1 className="form-title">Редактировать задачу</h1>

          {errors.general && <div className="auth-error">{errors.general}</div>}

          <form className="task-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ marginBottom: 0 }}>Название <span className="required">*</span></label>
                <button
                  type="button"
                  className="btn-ai"
                  onClick={handleGenerateTitle}
                  disabled={aiGeneratingTitle || !form.description.trim()}
                  title="Сгенерировать название задачи через AI на основе описания"
                >
                  {aiGeneratingTitle ? (
                    <span className="spinner" />
                  ) : (
                    <span className="material-icons" style={{ fontSize: '0.95rem' }}>auto_awesome</span>
                  )}
                  <span>{aiGeneratingTitle ? '...' : 'AI название'}</span>
                </button>
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={255}
              />
              {original && form.title !== original.title && (
                <button type="button" className="btn-reset" onClick={() => resetField('title')} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>↩ Сбросить</button>
              )}
              {errors.title && <small className="error">{errors.title}</small>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ marginBottom: 0 }}>Описание</label>
                <div className="btn-ai-group">
                  <button
                    type="button"
                    className="btn-ai"
                    onClick={() => handleAiProcessDescription('IMPROVE')}
                    disabled={aiProcessingDesc || !form.description.trim()}
                    title="Улучшить описание: исправить ошибки, сделать конкретнее"
                  >
                    {aiProcessingDesc ? <span className="spinner" /> : <span className="material-icons" style={{ fontSize: '0.95rem' }}>spellcheck</span>}
                    <span>{aiProcessingDesc ? '' : 'Улучшить'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-ai"
                    onClick={() => handleAiProcessDescription('FORMALIZE')}
                    disabled={aiProcessingDesc || !form.description.trim()}
                    title="Формализовать в официально-деловом стиле"
                  >
                    <span className="material-icons" style={{ fontSize: '0.95rem' }}>description</span>
                    <span>Формализовать</span>
                  </button>
                  <button
                    type="button"
                    className="btn-ai"
                    onClick={() => handleAiProcessDescription('SUBTASKS')}
                    disabled={aiProcessingDesc || !form.description.trim()}
                    title="Разбить описание на подзадачи"
                  >
                    <span className="material-icons" style={{ fontSize: '0.95rem' }}>format_list_numbered</span>
                    <span>На подзадачи</span>
                  </button>
                </div>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={1200}
              />
              {errors.description && <small className="error">{errors.description}</small>}
              {original && form.description !== (original.description || '') && (
                <button type="button" className="btn-reset" onClick={() => resetField('description')} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>↩ Сбросить</button>
              )}
            </div>

            <div className="form-group">
              <label>Исполнитель</label>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  width: '100%', padding: '0.625rem 0.75rem',
                  border: '1px solid var(--border)',
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
              {original && form.assigneeId !== (original.assignee?.id || 0) && (
                <button type="button" className="btn-reset" onClick={() => resetField('assigneeId')} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>↩ Сбросить</button>
              )}
            </div>

            <div className="form-group">
              <label>Приоритет</label>
              <select 
                id="priority" 
                value={form.priority} 
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                style={{
                  borderLeft: `4px solid ${
                    form.priority === 'LOW' ? '#22c55e' : 
                    form.priority === 'MEDIUM' ? '#f97316' : 
                    form.priority === 'HIGH' ? '#ef4444' : 'var(--border)'
                  }`,
                  paddingLeft: '1rem'
                }}
              >
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
              </select>
              {errors.priority && <small className="error">{errors.priority}</small>}
              {original && form.priority !== original.priority && (
                <button type="button" className="btn-reset" onClick={() => resetField('priority')} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>↩ Сбросить</button>
              )}
            </div>

            <div className="form-group">
              <label>Срок выполнения</label>
              <input
                type="date"
                id="endDate"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <div className="quick-date-buttons" style={{ marginTop: '0.5rem' }}>
                {[3, 7, 14, 30].map((d) => (
                  <button key={d} type="button" className="btn-date" onClick={() => setQuickDate(d)}>+{d} дн.</button>
                ))}
              </div>
              {errors.endDate && <small className="error">{errors.endDate}</small>}
              {original && original.endDate && (() => {
                const parts = original.endDate.split('.');
                const originalFormatted = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : original.endDate;
                return form.endDate !== originalFormatted && (
                  <button type="button" className="btn-reset" onClick={() => resetField('endDate')} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>↩ Сбросить</button>
                );
              })()}
            </div>

            <div className="form-actions">
              <Link to={`/projects/${projectId}/tasks/${taskId}`} className="btn-secondary">Отмена</Link>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
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
                {members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Никого не найдено
                  </div>
                ) : (
                  members.map((m) => (
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
