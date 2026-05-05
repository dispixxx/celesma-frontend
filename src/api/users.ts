import api from './client';
import type { User } from '../types';

export const usersApi = {
  getByUsername: (username: string) =>
    api.get<User>(`/users/${username}`).then((r) => r.data),
};
