import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { tasksApi } from '../api/tasks';
import type { TaskResponse } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { useProjectRole } from '../hooks/useProjectRole';

interface Branch {
  id: number;
  name: string;
  sortOrder: number;
}

interface TaskEntry {
  id: number;
  task: TaskResponse;
  orderInBranch: number;
}

export default function RoadmapPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const userRole = useProjectRole(projectId);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [entries, setEntries] = useState<Record<number, TaskEntry[]>>({});
  const [allTasks, setAllTasks] = useState<TaskResponse[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [modalBranchId, setModalBranchId] = useState<number | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, hideAlert } = useAlert();

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [branchesRes, tasksRes] = await Promise.all([
        api.get<Branch[]>(`/projects/${projectId}/roadmap/branches`),
        tasksApi.getByProject(Number(projectId)),
      ]);
      setBranches(branchesRes.data);
      setAllTasks(tasksRes);

      const entriesMap: Record<number, TaskEntry[]> = {};
      await Promise.all(branchesRes.data.map(async (b) => {
        const res = await api.get<TaskEntry[]>(`/projects/${projectId}/roadmap/branches/${b.id}/tasks`);
        entriesMap[b.id] = res.data;
      }));
      setEntries(entriesMap);
    } catch {
      showAlert('Ошибка загрузки роадмапа', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [projectId]);

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    try {
      await api.post(`/projects/${projectId}/roadmap/branches`, { name: newBranchName.trim() });
      setNewBranchName('');
      showAlert('Ветка создана', 'success');
      loadData();
    } catch {
      showAlert('Ошибка создания ветки', 'error');
    }
  };

  const deleteBranch = async (branchId: number) => {
    if (!confirm('Удалить ветку?')) return;
    try {
      await api.delete(`/projects/${projectId}/roadmap/branches/${branchId}`);
      showAlert('Ветка удалена', 'info');
      loadData();
    } catch {
      showAlert('Ошибка удаления', 'error');
    }
  };

  const addTask = async (branchId: number, taskId: number) => {
    try {
      await api.post(`/projects/${projectId}/roadmap/branches/${branchId}/tasks`, { taskId });
      setModalBranchId(null);
      showAlert('Задача добавлена', 'success');
      loadData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || 'Ошибка добавления', 'error');
    }
  };

  const removeTask = async (branchId: number, taskId: number) => {
    try {
      await api.delete(`/projects/${projectId}/roadmap/branches/${branchId}/tasks/${taskId}`);
      loadData();
    } catch {
      showAlert('Ошибка удаления задачи', 'error');
    }
  };

  const filteredTasks = allTasks.filter((t) =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  if (loading) return <ProjectLayout userRole={userRole}><div className="empty-state"><p>Загрузка...</p></div></ProjectLayout>;

  return (
    <ProjectLayout userRole={userRole}>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="roadmap-layout">
        {/* Левая панель — ветки */}
        <div className="branch-list">
          <h2>Ветки</h2>

          <div className="create-branch">
            <form onSubmit={createBranch}>
              <input
                type="text"
                placeholder="Название ветки"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
              <button type="submit">+</button>
            </form>
          </div>

          <ul id="branchSortable">
            {branches.map((b) => (
              <li key={b.id} className="branch-item">
                <span>{b.name}</span>
                <button className="btn-delete" onClick={() => deleteBranch(b.id)}>
                  <span className="material-icons" style={{ fontSize: '1rem' }}>delete</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Основная зона */}
        <div className="main-content">
          {branches.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">map</span>
              <p>Создайте первую ветку роадмапа</p>
            </div>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="branch-panel">
                <div className="branch-header">
                  <span className="branch-name">{branch.name}</span>
                </div>

                <ul className="task-list">
                  {(entries[branch.id] || []).length === 0 ? (
                    <div className="empty-state">
                      <p>Нет задач в этой ветке</p>
                    </div>
                  ) : (
                    (entries[branch.id] || []).map((entry, idx) => (
                      <li key={entry.id} className="task-item" data-status={entry.task.status}>
                        <div className="number">{idx + 1}</div>
                        <div className="roadmap-task-card">
                          <strong>{entry.task.title}</strong>
                          <small style={{ color: 'var(--text-secondary)' }}>
                            {entry.task.status} · {entry.task.priority}
                          </small>
                        </div>
                        <button
                          className="remove-from-branch-btn"
                          onClick={() => removeTask(branch.id, entry.task.id)}
                          title="Убрать из ветки"
                        >
                          ×
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <div className="add-task-control">
                  <button className="btn-outline" onClick={() => { setModalBranchId(branch.id); setTaskSearch(''); }}>
                    <span className="material-icons" style={{ fontSize: '1rem' }}>add</span>
                    Добавить задачу
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно выбора задачи */}
      {modalBranchId !== null && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) setModalBranchId(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Добавить задачу в ветку</h3>
              <button className="close-btn" onClick={() => setModalBranchId(null)}>×</button>
            </div>
            <div className="modal-body">
              <input
                id="taskSearch"
                type="text"
                placeholder="Поиск задачи..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
              <ul className="task-selection-list">
                {filteredTasks.map((task) => (
                  <li key={task.id} data-status={task.status}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.status}</small>
                    </div>
                    <button className="select-btn" onClick={() => addTask(modalBranchId!, task.id)}>
                      Добавить
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalBranchId(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}
