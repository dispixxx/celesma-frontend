import api from './client';
import type {
  AiDescriptionAction,
  AiDescriptionRequest,
  AiTitleRequest,
  TaskRequest,
  TaskResponse,
  TaskStatus,
} from '../types';

export const tasksApi = {
  getByProject: (projectId: number) =>
    api.get<TaskResponse[]>(`/projects/${projectId}/tasks`).then((r) => r.data),

  getById: (taskId: number) =>
    api.get<TaskResponse>(`/tasks/${taskId}`).then((r) => r.data),

  create: (projectId: number, data: TaskRequest) =>
    api.post<TaskResponse>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  update: (taskId: number, data: TaskRequest) =>
    api.put<TaskResponse>(`/tasks/${taskId}`, data).then((r) => r.data),

  updateTitle: (taskId: number, title: string): Promise<TaskResponse> =>
    api.patch<TaskResponse>(`/tasks/${taskId}/title`, { title }).then(r => r.data),

  changeStatus: (taskId: number, status: TaskStatus) =>
    api.patch<TaskResponse>(`/tasks/${taskId}/status`, { status }).then((r) => r.data),

  delete: (taskId: number) =>
    api.delete(`/tasks/${taskId}`),

  getHistory: (taskId: number) =>
    api.get<any[]>(`/tasks/${taskId}/history`).then((r) => r.data),

  generateTitle: (description: string) =>
    api.post<string>('/tasks/generate-title', { description } as AiTitleRequest)
      .then((r) => r.data),

  aiProcess: (description: string, action: AiDescriptionAction) =>
    api.post<string>('/tasks/ai-process', { description, action } as AiDescriptionRequest)
      .then((r) => r.data),
};
