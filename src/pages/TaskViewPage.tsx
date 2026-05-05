import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { STATUS_LABELS } from '../components/ui/StatusDot';

const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];
const PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f97316', HIGH: '#ef4444' };

export default function TaskViewPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusPopup, setStatusPopup] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const { alert, showAlert, hideAlert } = useAlert();
  const popupRef = useRef<HTMLDivElement>(null);

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

  const changeStatus = async (status: TaskStatus) => {
    if (!task) return;
    try {
      const updated = await tasksApi.changeStatus(task.id, status);
      setTask(updated);
      setStatusPopup(false);
      showAlert(`Статус изменён на ${STATUS_LABELS[status]}`, 'success');
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Нет прав для изменения статуса', 'error');
    }
  };

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
    } catch {
      showAlert('Ошибка удаления', 'error');
    }
  };

  if (loading) return <ProjectLayout><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;
  if (!task) return <ProjectLayout><div className="empty-state"><p>Задача не найдена</p></div></ProjectLayout>;

  return (
    <ProjectLayout>
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
                    onClick={() => changeStatus(s)}
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
            <div className="avatar-with-label">
              <UserAvatar username={task.creator.username} avatarUrl={task.creator.avatarUrl} />
            </div>
            <div className="meta-info">
              <span className="label">Создатель</span>
              <span className="value">{task.creator.username}</span>
            </div>
          </div>

          {task.assignee && (
            <div className="meta-item">
              <div className="avatar-with-label">
                <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
              </div>
              <div className="meta-info">
                <span className="label">Исполнитель</span>
                <span className="value">{task.assignee.username}</span>
              </div>
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
              <div className="avatar-with-label">
                <UserAvatar username={task.reviewedBy.username} avatarUrl={task.reviewedBy.avatarUrl} />
              </div>
              <div className="meta-info">
                <span className="label">Проверено</span>
                <span className="value">{task.reviewedBy.username}</span>
              </div>
            </div>
          )}
        </section>

        <div className="task-actions">
          <Link to={`/projects/${projectId}/tasks/${taskId}/edit`} className="btn-action">
            Редактировать
          </Link>
          <button className="btn-action btn-danger" onClick={deleteTask}>
            Удалить
          </button>
        </div>

        {/* Comments */}
        <div className="comments-section">
          <h3>Комментарии</h3>
          <form className="comment-form" onSubmit={(e) => { e.preventDefault(); showAlert('Комментарии будут добавлены позже', 'info'); }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите комментарий..."
              required
            />
            <button type="submit" className="btn-action">Отправить</button>
          </form>
          <div className="comments-list-container">
            <div className="comments-list">
              <div className="empty-comments"><p>Пока нет комментариев</p></div>
            </div>
          </div>
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
              {history.length === 0
                ? <div className="loading">История пуста</div>
                : history.map((item, i) => (
                  <div key={i} className="history-item">
                    <div className="history-header">
                      <span className="history-date">{item.changedAt}</span>
                      <span className="history-changed-by">{item.changedBy}</span>
                    </div>
                    <p className="history-description">{item.description}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}
