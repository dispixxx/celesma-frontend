import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import type { TaskResponse, TaskStatus, MemberResponseDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { useProjectRole } from '../hooks/useProjectRole';
import { useAuthStore } from '../store/authStore';

import MemberModal from '../components/ui/MemberModal';
import FilterUserBtn from '../components/ui/FilterUserBtn';

const PRIORITY_LABELS = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' };
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];

type ViewMode = 'grid' | 'table';
type SortField = 'createdAt' | 'endDate' | 'priority' | 'title';
type SortDir = 'asc' | 'desc';

function isOverdue(endDate: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

export default function TaskListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const userRole = useProjectRole(projectId);
  const { username } = useAuthStore();

  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [filtered, setFiltered] = useState<TaskResponse[]>([]);
  const [members, setMembers] = useState<MemberResponseDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<number | null>(null);
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    const stored = localStorage.getItem(`favorites_${projectId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const { alert, showAlert, hideAlert } = useAlert();

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter([statusParam as TaskStatus]);
  }, [searchParams]);

  useEffect(() => {
    if (!projectId) return;
    tasksApi.getByProject(Number(projectId))
      .then((data) => { setTasks(data); setFiltered(data); })
      .catch(() => showAlert('Ошибка загрузки задач', 'error'))
      .finally(() => setLoading(false));
    projectsApi.getMembers(Number(projectId))
      .then(setMembers)
      .catch(() => { });
  }, [projectId]);

  useEffect(() => {
    let result = [...tasks];
    if (search) result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter.length > 0) result = result.filter(t => statusFilter.includes(t.status));
    if (assigneeFilter) result = result.filter(t => t.assignee?.id === assigneeFilter);
    if (creatorFilter) result = result.filter(t => t.creator.id === creatorFilter);

    result.sort((a, b) => {
      const favA = favorites.has(a.id) ? 0 : 1;
      const favB = favorites.has(b.id) ? 0 : 1;
      if (favA !== favB) return favA - favB;

      let cmp = 0;
      if (sortField === 'priority') {
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'endDate') {
        cmp = new Date(a.endDate || '9999').getTime() - new Date(b.endDate || '9999').getTime();
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    setFiltered(result);
  }, [search, statusFilter, tasks, favorites, assigneeFilter, creatorFilter, sortField, sortDir]);

  const toggleStatus = (s: TaskStatus) =>
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleFavorite = (taskId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      localStorage.setItem(`favorites_${projectId}`, JSON.stringify([...next]));
      return next;
    });
  };

  const hasFilters = !!(search || statusFilter.length > 0 || assigneeFilter || creatorFilter);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter([]);
    setAssigneeFilter(null);
    setCreatorFilter(null);
  };




  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      {/* Заголовок */}
      <div className="task-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Задачи</h2>
          <span className="task-count-badge">{filtered.length} / {tasks.length}</span>
        </div>
        <div className="task-list-header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Карточки"
            >
              <span className="material-icons">grid_view</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Таблица"
            >
              <span className="material-icons">table_rows</span>
            </button>
          </div>
          <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">
            <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
            Новая задача
          </Link>
        </div>
      </div>

      {/* Поиск */}
      <div className="task-search-bar">
        <span className="material-icons">search</span>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="task-search-clear" onClick={() => setSearch('')}>
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="filter-by-status">
        <span className="filter-label">Статус:</span>
        {STATUSES.map((s) => (
          <label key={s} className={`status-item ${statusFilter.includes(s) ? 'active' : ''}`}>
            <input type="checkbox" checked={statusFilter.includes(s)} onChange={() => toggleStatus(s)} hidden />
            <StatusDot status={s} />
            <span className="status-text">{s}</span>
            {statusCounts[s] > 0 && (
              <span className="status-count-badge">{statusCounts[s]}</span>
            )}
          </label>
        ))}

        <div className="filter-divider" />

        <FilterUserBtn
          value={assigneeFilter}
          onClick={() => { setAssigneeModalOpen(true); setMemberSearch(''); }}
          onClear={() => setAssigneeFilter(null)}
          icon="person"
          label="Исполнитель"
          members={members}  // ← добавить
        />

        <FilterUserBtn
          value={creatorFilter}
          onClick={() => { setCreatorModalOpen(true); setMemberSearch(''); }}
          onClear={() => setCreatorFilter(null)}
          icon="manage_accounts"
          label="Создатель"
          members={members}  // ← добавить
        />

        <div className="filter-divider" />

        {/* Сортировка */}
        <div className="sort-dropdown-wrapper">
          <select
            className="sort-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <option value="createdAt">По дате создания</option>
            <option value="endDate">По дедлайну</option>
            <option value="priority">По приоритету</option>
            <option value="title">По названию</option>
          </select>
          <button className="sort-dir-btn" onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}>
            <span className="material-icons" style={{ fontSize: '18px' }}>
              {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
          </button>
        </div>

        {hasFilters && (
          <button className="btn-filter" onClick={resetFilters}>
            <span className="material-icons">close</span>
            Сбросить
          </button>
        )}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="empty-state"><p>Загрузка...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.3 }}>task_alt</span>
          {hasFilters ? (
            <>
              <p>Нет задач по выбранным фильтрам</p>
              <button className="btn-primary" onClick={resetFilters}>Сбросить фильтры</button>
            </>
          ) : (
            <>
              <p>Задач пока нет</p>
              <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">
                Создать первую задачу
              </Link>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="task-grid" style={{ marginTop: '1rem' }}>
          {filtered.map((task) => (
            <div key={task.id} className="task-card" data-status={task.status}>
              <div className="task-card-top">
                <h3>{task.title}</h3>
                <button
                  className={`task-favorite-btn ${favorites.has(task.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(task.id, e)}
                  title={favorites.has(task.id) ? 'Убрать из избранного' : 'В избранное'}
                >
                  <span className="material-icons">
                    {favorites.has(task.id) ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>
              <p className="task-card-desc">{task.description}</p>
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
                {task.endDate && (
                  <span className={`due-date ${isOverdue(task.endDate) && task.status !== 'COMPLETED' ? 'date-overdue' : ''}`}>
                    {isOverdue(task.endDate) && task.status !== 'COMPLETED' && (
                      <span className="material-icons" style={{ fontSize: '14px' }}>warning</span>
                    )}
                    {task.endDate}
                  </span>
                )}
              </div>
              <div className="task-card-footer">
                <Link to={`/projects/${projectId}/tasks/${task.id}`} className="task-card-btn">
                  Перейти →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="task-table-wrapper" style={{ marginTop: '1rem' }}>
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}></th>
                <th className="sortable" onClick={() => { setSortField('title'); setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                  Название {sortField === 'title' && <span className="material-icons" style={{ fontSize: '14px' }}>{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </th>
                <th>Статус</th>
                <th className="sortable" onClick={() => { setSortField('priority'); setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                  Приоритет {sortField === 'priority' && <span className="material-icons" style={{ fontSize: '14px' }}>{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </th>
                <th>Исполнитель</th>
                <th className="sortable" onClick={() => { setSortField('endDate'); setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                  Срок {sortField === 'endDate' && <span className="material-icons" style={{ fontSize: '14px' }}>{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className="task-table-row" data-status={task.status}>
                  <td>
                    <button
                      className={`task-favorite-btn ${favorites.has(task.id) ? 'active' : ''}`}
                      onClick={(e) => toggleFavorite(task.id, e)}
                    >
                      <span className="material-icons">
                        {favorites.has(task.id) ? 'star' : 'star_border'}
                      </span>
                    </button>
                  </td>
                  <td className="task-table-title">{task.title}</td>
                  <td>
                    <span className="task-table-status">
                      <StatusDot status={task.status} />
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                  </td>
                  <td>
                    {task.assignee ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                        <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                        {task.assignee.username}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`due-date ${isOverdue(task.endDate) && task.status !== 'COMPLETED' ? 'date-overdue' : ''}`}>
                      {isOverdue(task.endDate) && task.status !== 'COMPLETED' && (
                        <span className="material-icons" style={{ fontSize: '14px' }}>warning</span>
                      )}
                      {task.endDate || '—'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/projects/${projectId}/tasks/${task.id}`} className="task-card-btn">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MemberModal
        open={assigneeModalOpen}
        onClose={() => setAssigneeModalOpen(false)}
        selected={assigneeFilter}
        onSelect={setAssigneeFilter}
        title="Фильтр по исполнителю"
        members={members}              // ← добавить
        memberSearch={memberSearch}    // ← добавить
        setMemberSearch={setMemberSearch}  // ← добавить
      />

      <MemberModal
        open={creatorModalOpen}
        onClose={() => setCreatorModalOpen(false)}
        selected={creatorFilter}
        onSelect={setCreatorFilter}
        title="Фильтр по создателю"
        members={members}              // ← добавить
        memberSearch={memberSearch}    // ← добавить
        setMemberSearch={setMemberSearch}  // ← добавить
      />
    </ProjectLayout>
  );
}