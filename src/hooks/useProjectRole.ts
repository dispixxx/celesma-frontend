import { useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import type { ProjectRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { getCurrentUserRole } from '../utils/projectUtils';

export function useProjectRole(projectId: string | undefined): ProjectRole | undefined {
  const [role, setRole] = useState<ProjectRole | undefined>(undefined);
  const { username } = useAuthStore();

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getById(Number(projectId))
      .then((project) => setRole(getCurrentUserRole(project, username)))
      .catch(() => {});
  }, [projectId, username]);

  return role;
}
