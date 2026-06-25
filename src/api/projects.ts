import api from './client';
import type { ApplicantResponseDto, ProjectPreviewResponse, ProjectRequest, ProjectResponseDto } from '../types';

export const projectsApi = {
  getAll: () =>
    api.get<ProjectResponseDto[]>('/projects').then((r) => r.data),

  getById: (id: number) =>
    api.get<ProjectResponseDto>(`/projects/${id}`).then((r) => r.data),

  create: (data: ProjectRequest) =>
    api.post<ProjectResponseDto>('/projects', data).then((r) => r.data),

  update: (id: number, data: ProjectRequest) =>
    api.put<ProjectResponseDto>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/projects/${id}`),

  search: (query: string) =>
    api.get<ProjectResponseDto[]>(`/projects/search?q=${encodeURIComponent(query)}`).then((r) => r.data),

  getMyApplications: () =>
  api.get<ProjectPreviewResponse[]>('/projects/my-applications').then((r) => r.data),

  transferOwnership: (projectId: number, memberId: number) =>
  api.post(`/projects/${projectId}/members/${memberId}/transfer-ownership`),

  // Applicants
  join: (id: number) =>
    api.post<ApplicantResponseDto>(`/projects/${id}/applicants/join`),

  cancelJoin: (id: number) =>
    api.delete(`/projects/${id}/applicants/separate`),

  getApplicants: (id: number) =>
    api.get<ApplicantResponseDto[]>(`/projects/${id}/applicants`).then((r) => r.data),

  acceptApplicant: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/applicants/${userId}/accept`),

  declineApplicant: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/applicants/${userId}/decline`),

  // Members
  getMembers: (id: number) =>
    api.get(`/projects/${id}/members`).then((r) => r.data),

  updateMemberRole: (projectId: number, memberId: number, role: string) =>
    api.put(`/projects/${projectId}/members/${memberId}`, { projectId, role }),

  removeMember: (projectId: number, memberId: number) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),

  exitProject: (projectId: number, memberId: number) =>
    api.post(`/projects/${projectId}/members/${memberId}/exit`),
};
