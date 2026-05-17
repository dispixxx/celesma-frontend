import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { useProjectRole } from '../hooks/useProjectRole';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'NEW',         label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'В работе' },
  { status: 'REVIEW',      label: 'На проверке' },
  { status: 'COMPLETED',   label: 'Выполнено' },
  { status: 'ON_HOLD',     label: 'Пауза' },
  { status: 'CANCELED',    label: 'Отмена' },
];

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const userRole = useProjectRole(projectId);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (!projectId) return;
    tasksApi.getByProject(Number(projectId))
      .then(setTasks)
      .catch(() => showAlert('Ошибка загрузки задач', 'error'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const changeStatus = async (taskId: number, status: TaskStatus) => {
    try {
      const updated = await tasksApi.changeStatus(taskId, status);
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Нет прав для изменения статуса', 'error');
    }
  };

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  if (loading) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;

  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="kanban-container">
        <div className="kanban-settings">
          <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary" style={{ fontSize: '0.9rem' }}>
            + Новая задача
          </Link>
        </div>

        <div className="kanban-board-wrapper">
          <div className="kanban-board">
            {COLUMNS.map(({ status, label }) => {
              const columnTasks = getTasksByStatus(status);
              return (
                <div key={status} className="kanban-column" data-status={status}>
                  <h3 className="column-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusDot status={status} />
                      {label}
                    </span>
                    <span className="status-count">{columnTasks.length}</span>
                  </h3>

                  <div className="column-content" data-status={status}>
                    {columnTasks.map((task) => (
                      <div key={task.id} className="kanban-task-card">
                        <h4>{task.title}</h4>
                        <div className="task-description-kanban">{task.description}</div>
                        <div className="task-meta-kanban">
                          <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                          <span className="task-due-date">{task.endDate}</span>
                          {task.assignee && (
                            <span className="task-assignee">
                              <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                              <span>{task.assignee.username}</span>
                            </span>
                          )}
                        </div>
                        <div className="task-card-footer">
                          <Link
                            to={`/projects/${projectId}/tasks/${task.id}`}
                            className="task-card-btn"
                          >
                            Перейти →
                          </Link>
                          <select
                            style={{ fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}
                            value={task.status}
                            onChange={(e) => changeStatus(task.id, e.target.value as TaskStatus)}
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.status} value={c.status}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
}
