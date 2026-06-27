import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import type { TaskResponse, TaskStatus } from '../../types';
import StatusDot from '../ui/StatusDot';
import UserAvatar from '../ui/UserAvatar';

const PRIORITY_LABELS = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' };
const PRIORITY_COLORS = {
  LOW: 'var(--status-completed)',
  MEDIUM: 'var(--status-on-hold)',
  HIGH: 'var(--status-canceled)',
};
const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];

function isOverdue(endDate: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

interface Props {
  task: TaskResponse | null;
  onClose: () => void;
  projectId: string;
  onTaskUpdated?: (updated: TaskResponse) => void;
}

export default function TaskDrawer({ task, onClose, projectId, onTaskUpdated }: Props) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (task) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  useEffect(() => {
    setStatusDropdownOpen(false);
  }, [task?.id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    setUpdatingStatus(true);
    setStatusDropdownOpen(false);
    try {
      const updated = await tasksApi.changeStatus(task.id, newStatus);
      onTaskUpdated?.(updated);
    } catch {
      // можно добавить showAlert
    } finally {
      setUpdatingStatus(false);
    }
  };

  const overdue = task?.endDate && isOverdue(task.endDate) && task.status !== 'COMPLETED';

  return (
    <>
      <div className={`drawer-overlay ${task ? 'open' : ''}`} onClick={onClose} />

      <div className={`task-drawer ${task ? 'open' : ''}`}>
        {task && (
          <>
            <div className="task-drawer-header">
              <div className="task-drawer-header-left">
                <StatusDot status={task.status} />
                <span className="task-drawer-status">{task.status}</span>
              </div>
              <div className="task-drawer-header-right">
                <Link to={`/projects/${projectId}/tasks/${task.id}`} className="drawer-open-btn">
                  <span className="material-icons">open_in_new</span>
                  Открыть
                </Link>
                <button className="drawer-close-btn" onClick={onClose}>
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            <div className="task-drawer-body">
              <div className="task-drawer-section">
                <div className="task-drawer-title-block">
                  <h2 className="task-drawer-title">{task.title}</h2>
                  {task.description && (
                    <p className="task-drawer-desc">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="task-drawer-section">

                {/* Статус с дропдауном */}
                <div className="task-drawer-meta-row" style={{ position: 'relative' }}>
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">radio_button_checked</span>
                    Статус
                  </span>
                  <button
                    className="drawer-status-btn"
                    onClick={() => setStatusDropdownOpen(p => !p)}
                    disabled={updatingStatus}
                  >
                    <StatusDot status={task.status} />
                    <span>{task.status}</span>
                    <span className="material-icons" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {statusDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {statusDropdownOpen && (
                    <div className="drawer-status-dropdown">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          className={`drawer-status-option ${task.status === s ? 'active' : ''}`}
                          onClick={() => handleStatusChange(s)}
                        >
                          <StatusDot status={s} />
                          <span>{s}</span>
                          {task.status === s && (
                            <span className="material-icons" style={{ fontSize: '14px', marginLeft: 'auto' }}>check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="task-drawer-meta-row">
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">flag</span>
                    Приоритет
                  </span>
                  <span className="task-drawer-priority" style={{ color: PRIORITY_COLORS[task.priority] }}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>

                <div className="task-drawer-meta-row">
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">person</span>
                    Исполнитель
                  </span>
                  {task.assignee ? (
                    <span className="task-drawer-user">
                      <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                      {task.assignee.username}
                    </span>
                  ) : (
                    <span className="task-drawer-empty">Не назначен</span>
                  )}
                </div>

                <div className="task-drawer-meta-row">
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">manage_accounts</span>
                    Создатель
                  </span>
                  <span className="task-drawer-user">
                    <UserAvatar username={task.creator.username} avatarUrl={task.creator.avatarUrl} />
                    {task.creator.username}
                  </span>
                </div>

                {task.reviewedBy && (
                  <div className="task-drawer-meta-row">
                    <span className="task-drawer-meta-label">
                      <span className="material-icons">verified</span>
                      Проверил
                    </span>
                    <span className="task-drawer-user">
                      <UserAvatar username={task.reviewedBy.username} avatarUrl={task.reviewedBy.avatarUrl} />
                      {task.reviewedBy.username}
                    </span>
                  </div>
                )}

                <div className="task-drawer-meta-row">
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">event</span>
                    Дедлайн
                  </span>
                  {task.endDate ? (
                    <span className={`task-drawer-date ${overdue ? 'overdue' : ''}`}>
                      {overdue && <span className="material-icons">warning</span>}
                      {task.endDate}
                    </span>
                  ) : (
                    <span className="task-drawer-empty">—</span>
                  )}
                </div>

                <div className="task-drawer-meta-row">
                  <span className="task-drawer-meta-label">
                    <span className="material-icons">calendar_today</span>
                    Создана
                  </span>
                  <span className="task-drawer-date">
                    {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div >
    </>
  );
}