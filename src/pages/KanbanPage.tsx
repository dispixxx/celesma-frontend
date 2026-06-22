import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { useProjectRole } from '../hooks/useProjectRole';
import { useKanban } from '../hooks/useKanban';

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
  // const [tasks, setTasks] = useState<TaskResponse[]>([]);
  // const [loading, setLoading] = useState(true);
  const { tasks, changeStatus, connected } = useKanban(Number(projectId));
  const { alert, showAlert, hideAlert } = useAlert();
  

  // useEffect(() => {
  //   if (!projectId) return;
  //   tasksApi.getByProject(Number(projectId))
  //     .then(setTasks)
  //     .catch(() => showAlert('Ошибка загрузки задач', 'error'))
  //     .finally(() => setLoading(false));
  // }, [projectId]);

  // const changeStatus = async (taskId: number, status: TaskStatus) => {
  //   try {
  //     const updated = await tasksApi.changeStatus(taskId, status);
  //     setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
  //   } catch (err: any) {
  //     showAlert(err.response?.data?.message || 'Нет прав для изменения статуса', 'error');
  //   }
  // };

  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const handleDrop = async (status: TaskStatus) => {
    if (dragId === null) return;
    setDragOver(null);
    const task = tasks.find(t => t.id === dragId);
    if (!task || task.status === status) return;
    changeStatus(dragId, status);
  };

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  if (false) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;

  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="kanban-page-wrapper">
      <div className="kanban-settings">
        <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">
          + Новая задача
        </Link>
      </div>

      <div className="kanban-scroll">
        {COLUMNS.map(({ status, label }) => {
          const columnTasks = getTasksByStatus(status);
          return (
            <div key={status} className="kanban-column">
              <h3 className="column-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusDot status={status} />
                  {label}
                </span>
                <span className="status-count">{columnTasks.length}</span>
              </h3>

              <div
                className={`column-content${dragOver === status ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(status); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                onDrop={() => handleDrop(status)}
              >
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    className={`kanban-task-card${dragId === task.id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <h4>{task.title}</h4>
                    {task.description && (
                      <div className="task-description-kanban">{task.description}</div>
                    )}
                    <div className="task-meta-kanban">
                      <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                      {task.endDate && (
                        <span className="task-due-date">{task.endDate}</span>
                      )}
                      {task.assignee && (
                        <span className="task-assignee">
                          <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                        </span>
                      )}
                    </div>
                      <Link to={`/projects/${projectId}/tasks/${task.id}`} className="task-card-btn">
                        Открыть →
                      </Link>
                    </div>                  
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </ProjectLayout>
  );
}
