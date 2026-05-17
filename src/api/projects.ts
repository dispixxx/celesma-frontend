import api from './client';
import type { ProjectRequest, ProjectResponse } from '../types';

export const projectsApi = {
  getAll: () =>
    api.get<ProjectResponse[]>('/projects').then((r) => r.data),

  getById: (id: number) =>
    api.get<ProjectResponse>(`/projects/${id}`).then((r) => r.data),

  create: (data: ProjectRequest) =>
    api.post<ProjectResponse>('/projects', data).then((r) => r.data),

  update: (id: number, data: ProjectRequest) =>
    api.put<ProjectResponse>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/projects/${id}`),

  search: (query: string) =>
    api.get<ProjectResponse[]>(`/projects/search?q=${encodeURIComponent(query)}`).then((r) => r.data),

  exit: (id: number) =>
    api.post(`/projects/${id}/exit`),

  join: (id: number) =>
    api.post(`/projects/${id}/join`),

  cancelJoin: (id: number) =>
    api.delete(`/projects/${id}/join`),

  getApplicants: (id: number) =>
    api.get<any[]>(`/projects/${id}/applicants`).then((r) => r.data),

  acceptApplicant: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/applicants/${userId}/accept`),

  declineApplicant: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/applicants/${userId}`),

  updateMemberRole: (projectId: number, memberId: number, role: string) =>
    api.put(`/projects/${projectId}/members/${memberId}/role`, { role }),

  removeMember: (projectId: number, memberId: number) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),
};
