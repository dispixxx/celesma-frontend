import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus, TaskHistoryResponse } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { STATUS_LABELS } from '../components/ui/StatusDot';
import { useProjectRole } from '../hooks/useProjectRole';
import { useTaskComments } from '../hooks/useTaskComments';
import { useKanban } from '../hooks/useKanban';
import TaskAttachments from '../components/task/TaskAttachments';
import { useAuthStore } from '../store/authStore';

const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f97316', HIGH: '#ef4444' };

export default function TaskViewPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const userRole = useProjectRole(projectId);
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusPopup, setStatusPopup] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<TaskHistoryResponse[]>([]);
  const { username } = useAuthStore();


  const { comments, sendComment, connected } = useTaskComments(Number(taskId));
  const [commentText, setCommentText] = useState('');

  const { alert, showAlert, hideAlert } = useAlert();
  const popupRef = useRef<HTMLDivElement>(null);

  const [commentsCollapsed, setCommentsCollapsed] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    tasksApi.getById(Number(taskId))
      .then(setTask)
      .catch(() => showAlert('Ошибка загрузки задачи', 'error'))
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setStatusPopup(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (!taskId) return;
    tasksApi.getById(Number(taskId))
      .then(setTask)
      .catch(() => showAlert('Ошибка загрузки задачи', 'error'))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    sendComment(commentText);
    setCommentText('');
  };


  const { changeStatus } = useKanban(
    Number(projectId),
    (updated) => {
      if (updated.id === Number(taskId)) setTask(updated);
    }
  );


  const loadHistory = async () => {
    if (!taskId) return;
    try {
      const data = await tasksApi.getHistory(Number(taskId));
      setHistory(data);
    } catch {
      showAlert('Ошибка загрузки истории', 'error');
    }
  };

  const toggleHistory = () => {
    if (!historyOpen) loadHistory();
    setHistoryOpen(!historyOpen);
  };

  const deleteTask = async () => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await tasksApi.delete(Number(taskId));
      navigate(`/projects/${projectId}/tasks`);
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Нет прав для удаления', 'error');
    }
  };

  if (loading) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;
  if (!task) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Задача не найдена</p></div></ProjectLayout>;

  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="task-detail-card">
        <header className="task-header">
          <button className="history-btn" onClick={toggleHistory}>
            <span className="material-icons">history</span>
            История
          </button>

          <div className="status-badge" ref={popupRef} onClick={() => setStatusPopup(!statusPopup)} style={{ cursor: 'pointer' }}>
            <StatusDot status={task.status} />
            <span className="badge">{STATUS_LABELS[task.status]}</span>
            <span className="material-icons arrow">expand_more</span>

            {statusPopup && (
              <div className="status-popup">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={task.status === s ? 'current' : ''}
                    onClick={() => changeStatus(task.id, s)}
                  >
                    <StatusDot status={s} />
                    <span>{STATUS_LABELS[s]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1>{task.title}</h1>
          </div>
          <p>{task.description}</p>
        </header>

        <section className="task-meta-grid">
          <div className="meta-item">
            <Link
              to={`/profile/${task.creator.username}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}
            >
              <div className="avatar-with-label">
                <UserAvatar username={task.creator.username} avatarUrl={task.creator.avatarUrl} />
              </div>
              <div className="meta-info">
                <span className="label">Создатель</span>
                <span className="value">{task.creator.username}</span>
              </div>
            </Link>
          </div>

          {task.assignee && (
            <div className="meta-item">
              <Link
                to={`/profile/${task.assignee.username}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="avatar-with-label">
                  <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                </div>
                <div className="meta-info">
                  <span className="label">Исполнитель</span>
                  <span className="value">{task.assignee.username}</span>
                </div>
              </Link>
            </div>
          )}

          <div className="meta-item">
            <span className="material-icons" style={{ color: 'var(--primary)' }}>calendar_today</span>
            <div className="meta-info">
              <span className="label">Создана</span>
              <span className="value">{new Date(task.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>

          <div className="meta-item">
            <span className="material-icons" style={{ color: 'var(--primary)' }}>event</span>
            <div className="meta-info">
              <span className="label">Срок</span>
              <span className="value">{task.endDate}</span>
            </div>
          </div>

          <div className="meta-item priority">
            <span className="material-icons" style={{ color: 'var(--primary)' }}>flag</span>
            <div className="meta-info">
              <span className="label">Приоритет</span>
              <span className="value" style={{ color: PRIORITY_COLORS[task.priority] }}>
                {task.priority}
              </span>
            </div>
          </div>

          {task.reviewedBy && (
            <div className="meta-item">
              <Link
                to={`/profile/${task.reviewedBy.username}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="avatar-with-label">
                  <UserAvatar username={task.reviewedBy.username} avatarUrl={task.reviewedBy.avatarUrl} />
                </div>
                <div className="meta-info">
                  <span className="label">Проверено</span>
                  <span className="value">{task.reviewedBy.username}</span>
                </div>
              </Link>
            </div>
          )}
        </section>
        <div className="task-actions" style={{ marginBottom: '1.5rem' }}>
          <Link to={`/projects/${projectId}/tasks/${taskId}/edit`} className="btn-action">
            Редактировать
          </Link>
          <button className="btn-danger" onClick={deleteTask}>
            Удалить
          </button>
        </div>
        <TaskAttachments
          projectId={Number(projectId)}
          taskId={Number(taskId)}
          canUpload={true}
          currentUsername={username}
          isOwner={userRole === 'OWNER' || userRole === 'ADMIN'}
          showAlert={showAlert}
        />


        {/* Comments */}
        {/* Comments */}
        <div className="comments-section" style={{ marginTop: '1.5rem' }}>
          <div className="attachments-header" style={{ marginBottom: commentsCollapsed ? 0 : '1rem' }}>
            <button
              className="attachments-collapse-btn"
              onClick={() => setCommentsCollapsed(prev => !prev)}
            >
              <h3 style={{
                color: 'var(--text)',
                margin: 0,
                background: 'none',
                WebkitTextFillColor: 'var(--text)',
                WebkitBackgroundClip: 'unset',
              }}>
                Комментарии
              </h3>
              <span className="material-icons" style={{
                fontSize: '20px',
                color: 'var(--text-secondary)',
                transition: 'transform 0.2s',
                transform: commentsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              }}>
                expand_more
              </span>
            </button>
          </div>

          {!commentsCollapsed && (
            <>
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (commentText.trim() && connected) {
                        sendComment(commentText);
                        setCommentText('');
                      }
                    }
                  }}
                  placeholder="Напишите комментарий... (Enter — отправить, Shift+Enter — новая строка)"
                  rows={3}
                />
                <button
                  type="submit"
                  className="btn-action"
                  disabled={!commentText.trim() || !connected}
                >
                  {connected ? 'Отправить' : 'Подключение...'}
                </button>
              </form>

              <div className="comments-list-container">
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <div className="empty-comments"><p>Пока нет комментариев</p></div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-avatar">
                          {c.author.avatarUrl
                            ? <img src={c.author.avatarUrl} alt={c.author.username} />
                            : <span>{c.author.username.slice(0, 2).toUpperCase()}</span>
                          }
                        </div>
                        <div className="comment-body">
                          <div className="comment-header">
                            <Link to={`/profile/${c.author.username}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                              {c.author.username}
                            </Link>
                            <span className="comment-date">{c.createdAt}</span>
                          </div>
                          <p className="comment-text" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {c.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* History Modal */}
      {historyOpen && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) setHistoryOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>История изменений</h3>
              <button className="close-btn" onClick={() => setHistoryOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.3 }}>history</span>
                  <p>История изменений пуста</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserAvatar username={item.changedBy.username} avatarUrl={item.changedBy.avatarUrl} size="small" />
                        <span className="history-changed-by">{item.changedBy.username}</span>
                      </div>
                      <span className="history-date">{item.changedAt}</span>
                    </div>
                    <p className="history-description">{item.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}
