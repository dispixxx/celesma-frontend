import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { TaskResponse, TaskPriority, TaskStatus, MemberResponseDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';
import { useProjectRole } from '../hooks/useProjectRole';
import { useKanban } from '../hooks/useKanban';
import TaskDrawer from '../components/task/TaskDrawer';
import MemberModal from '../components/ui/MemberModal';
import FilterUserBtn from '../components/ui/FilterUserBtn';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { useEffect, useRef } from 'react';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
};

const PRIORITY_BAR_COLORS: Record<TaskPriority, string> = {
  LOW: 'var(--status-completed)',
  MEDIUM: 'var(--status-on-hold)',
  HIGH: 'var(--status-canceled)',
};

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'NEW', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'В работе' },
  { status: 'REVIEW', label: 'На проверке' },
  { status: 'COMPLETED', label: 'Выполнено' },
  { status: 'ON_HOLD', label: 'Пауза' },
  { status: 'CANCELED', label: 'Отмена' },
];

const WIP_LIMIT = 5; // предупреждение если IN_PROGRESS > N

function isOverdue(endDate: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();


}

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const userRole = useProjectRole(projectId);
  const { tasks, changeStatus } = useKanban(Number(projectId));
  const { alert, showAlert, hideAlert } = useAlert();

  // drag
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  // drawer
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // collapsed columns
  const [collapsed, setCollapsed] = useState<Set<TaskStatus>>(() => {
    const stored = localStorage.getItem(`kanban_collapsed_${projectId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // filters
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [members, setMembers] = useState<MemberResponseDto[]>([]);
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getMembers(Number(projectId)).then(setMembers).catch(() => { });
  }, [projectId]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  const handleDrop = async (status: TaskStatus) => {
    if (dragId === null) return;
    setDragOver(null);
    const task = tasks.find(t => t.id === dragId);
    if (!task || task.status === status) return;
    changeStatus(dragId, status);
  };

  const handleTaskUpdated = (updated: TaskResponse) => {
    changeStatus(updated.id, updated.status);
    setSelectedTask(updated);
  };

  const toggleCollapse = (status: TaskStatus) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      localStorage.setItem(`kanban_collapsed_${projectId}`, JSON.stringify([...next]));
      return next;
    });
  };


  const startEdit = (task: TaskResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const commitEdit = async (taskId: number) => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      try {
        await tasksApi.updateTitle(taskId, trimmed); // нужно добавить в tasksApi
      } catch {
        showAlert('Ошибка при сохранении', 'error');
      }
    }
    setEditingId(null);
  };

  const hasFilters = !!(search || assigneeFilter || priorityFilter || overdueOnly);

  const resetFilters = () => {
    setSearch('');
    setAssigneeFilter(null);
    setPriorityFilter(null);
    setOverdueOnly(false);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter(t => t.status === status)
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !assigneeFilter || t.assignee?.id === assigneeFilter)
      .filter(t => !priorityFilter || t.priority === priorityFilter)
      .filter(t => !overdueOnly || (t.endDate && isOverdue(t.endDate) && t.status !== 'COMPLETED'));
  };

  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;




  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="kanban-page-wrapper">

        {/* Верхняя панель */}
        <div className="kanban-settings">
          <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">
            <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
            Новая задача
          </Link>

          <button
            className={`btn-mine ${filtersOpen || hasFilters ? 'active' : ''}`}
            onClick={() => setFiltersOpen(p => !p)}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>tune</span>
            Фильтры
            {hasFilters && <span className="kanban-filter-dot" />}
          </button>

          {hasFilters && (
            <button className="btn-filter" onClick={resetFilters}>
              <span className="material-icons">close</span>
              Сбросить
            </button>
          )}

          {inProgressCount > WIP_LIMIT && (
            <div className="kanban-wip-warning">
              <span className="material-icons">warning</span>
              WIP-лимит превышен: {inProgressCount}/{WIP_LIMIT} задач в работе
            </div>
          )}
        </div>

        {/* Панель фильтров */}
        {filtersOpen && (
          <div className="kanban-filters-bar">
            {/* Поиск */}
            <div className="kanban-search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>

            {/* Исполнитель */}
            <FilterUserBtn
              value={assigneeFilter}
              onClick={() => { setAssigneeModalOpen(true); setMemberSearch(''); }}
              onClear={() => setAssigneeFilter(null)}
              icon="person"
              label="Исполнитель"
              members={members}
            />

            {/* Приоритет */}
            <div className="kanban-priority-filter">
              {(['HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map(p => (
                <button
                  key={p}
                  className={`kanban-priority-chip ${priorityFilter === p ? 'active' : ''}`}
                  style={{ '--chip-color': PRIORITY_BAR_COLORS[p] } as React.CSSProperties}
                  onClick={() => setPriorityFilter(prev => prev === p ? null : p)}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Просроченные */}
            <button
              className={`btn-mine ${overdueOnly ? 'active' : ''}`}
              onClick={() => setOverdueOnly(p => !p)}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>event_busy</span>
              Просроченные
            </button>
          </div>
        )}

        {/* Колонки */}
        <div className="kanban-scroll">
          {COLUMNS.map(({ status, label }) => {
            const columnTasks = getTasksByStatus(status);
            const isCollapsed = collapsed.has(status);
            const isWipOver = status === 'IN_PROGRESS' && inProgressCount > WIP_LIMIT;

            return (
              <div
                key={status}
                className={`kanban-column ${isCollapsed ? 'collapsed' : ''} ${isWipOver ? 'wip-over' : ''} ${dragOver === status ? 'drag-over-active' : ''}`}
              >
                {isCollapsed ? (
                  // Свёрнутый вид — отдельный простой layout
                  <div
                    className={`column-collapsed-body ${dragOver === status ? 'drag-over-collapsed' : ''}`}
                    onClick={() => toggleCollapse(status)}
                    onDragOver={e => { e.preventDefault(); setDragOver(status); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                    onDrop={() => handleDrop(status)}
                  >
                    <StatusDot status={status} />
                    <span className="column-collapsed-label">{label}</span>
                    <span className="status-count">{columnTasks.length}</span>
                  </div>
                ) : (
                  <>
                    {/* Заголовок */}
                    <div className="column-header">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StatusDot status={status} />
                        {label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="status-count">{columnTasks.length}</span>
                        <Link
                          to={`/projects/${projectId}/tasks/new?status=${status}`}
                          className="column-add-btn"
                          title="Добавить задачу"
                        >
                          <span className="material-icons">add</span>
                        </Link>
                        <button
                          className="column-add-btn"
                          onClick={() => toggleCollapse(status)}
                          title="Свернуть"
                        >
                          <span className="material-icons" style={{ fontSize: '16px' }}>chevron_left</span>
                        </button>
                      </div>
                    </div>

                    {/* Контент колонки */}
                    <div
                      className={`column-content ${dragOver === status ? 'drag-over' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(status); }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                      onDrop={() => handleDrop(status)}
                    >
                      {columnTasks.length === 0 && (
                        <div className="column-empty">
                          <span className="material-icons">inbox</span>
                          <span>Нет задач</span>
                        </div>
                      )}
                      {columnTasks.map(task => {
                        const overdue = task.endDate && isOverdue(task.endDate) && task.status !== 'COMPLETED';
                        const isEditing = editingId === task.id;
                        return (
                          <div
                            key={task.id}
                            className={`kanban-task-card ${dragId === task.id ? 'dragging' : ''} ${selectedTask?.id === task.id ? 'selected' : ''}`}
                            draggable={!isEditing}
                            onDragStart={() => setDragId(task.id)}
                            onDragEnd={() => setDragId(null)}
                            data-status={task.status}
                            style={{ '--priority-color': PRIORITY_BAR_COLORS[task.priority] } as React.CSSProperties}
                          >
                            <div className="task-priority-bar" />

                            {isEditing ? (
                              <input
                                ref={editInputRef}
                                className="kanban-inline-edit"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onBlur={() => commitEdit(task.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitEdit(task.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <h4 onDoubleClick={e => startEdit(task, e)} title="Двойной клик для редактирования">
                                {task.title}
                              </h4>
                            )}

                            {task.description && (
                              <div className="task-description-kanban">{task.description}</div>
                            )}

                            <div className="task-meta-kanban">
                              {task.endDate && (
                                <span className={`kanban-due-date ${overdue ? 'overdue' : ''}`}>
                                  {overdue && <span className="material-icons">warning</span>}
                                  <span className="material-icons">event</span>
                                  {task.endDate}
                                </span>
                              )}
                              {task.assignee && (
                                <span className="task-assignee" title={task.assignee.username}>
                                  <UserAvatar username={task.assignee.username} avatarUrl={task.assignee.avatarUrl} />
                                </span>
                              )}
                            </div>

                            <div className="task-card-footer">
                              <Link to={`/projects/${projectId}/tasks/${task.id}`} className="task-card-btn">
                                Открыть
                              </Link>
                              <button
                                className="task-card-icon-btn"
                                onClick={() => setSelectedTask(task)}
                                title="Быстрый просмотр"
                              >
                                <span className="material-icons">vertical_split</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {dragOver === status && dragId !== null && (
                        <div className="kanban-drop-placeholder" />
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        projectId={projectId!}
        onTaskUpdated={handleTaskUpdated}
      />

      <MemberModal
        open={assigneeModalOpen}
        onClose={() => setAssigneeModalOpen(false)}
        selected={assigneeFilter}
        onSelect={setAssigneeFilter}
        title="Фильтр по исполнителю"
        members={members}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
      />
    </ProjectLayout>
  );
}