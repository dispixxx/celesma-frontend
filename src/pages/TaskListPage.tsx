import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';

const PRIORITY_LABELS = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' };

export default function TaskListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [filtered, setFiltered] = useState<TaskResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (!projectId) return;
    tasksApi.getByProject(Number(projectId))
      .then((data) => { setTasks(data); setFiltered(data); })
      .catch(() => showAlert('Ошибка загрузки задач', 'error'))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    let result = tasks;
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter.length > 0) result = result.filter((t) => statusFilter.includes(t.status));
    setFiltered(result);
  }, [search, statusFilter, tasks]);

  const toggleStatus = (s: TaskStatus) =>
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];

  return (
    <ProjectLayout>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Задачи</h2>
        <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">+ Новая задача</Link>
      </div>

      <div className="search-bar" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-by-status">
        <span className="filter-label">Статус:</span>
        {STATUSES.map((s) => (
          <label key={s} className="status-item">
            <input
              type="checkbox"
              checked={statusFilter.includes(s)}
              onChange={() => toggleStatus(s)}
            />
            <StatusDot status={s} />
            <span className="status-text">{s}</span>
          </label>
        ))}
        {statusFilter.length > 0 && (
          <button className="btn-filter" onClick={() => setStatusFilter([])}>Сбросить</button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><p>Загрузка...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">task_alt</span>
          <p>Задач не найдено</p>
        </div>
      ) : (
        <div className="task-grid" style={{ marginTop: '1rem' }}>
          {filtered.map((task) => (
            <div key={task.id} className="task-card" data-status={task.status}>
              <h3>{task.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{task.description}</p>
              <div className="task-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <StatusDot status={task.status} />
                  {task.status}
                </span>
                <span className={`priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                {task.assignee && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                    {task.assignee.username}
                  </span>
                )}
                {task.endDate && <span className="due-date">{task.endDate}</span>}
              </div>
              <div className="task-card-footer">
                <Link to={`/projects/${projectId}/tasks/${task.id}`} className="task-card-btn">
                  Перейти →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProjectLayout>
  );
}
