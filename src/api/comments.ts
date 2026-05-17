import api from './client';
import type { CommentResponse } from '../types';

export const commentsApi = {
  getByTask: (taskId: number) =>
    api.get<CommentResponse[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  create: (taskId: number, text: string) =>
    api.post<CommentResponse>(`/tasks/${taskId}/comments`, { text }).then((r) => r.data),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}`),
};