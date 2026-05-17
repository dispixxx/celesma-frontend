import { useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import type { ProjectRole } from '../types';

export function useProjectRole(projectId: string | undefined): ProjectRole | undefined {
  const [role, setRole] = useState<ProjectRole | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getById(Number(projectId))
      .then((project) => setRole(project.currentUserRole))
      .catch(() => {});
  }, [projectId]);

  return role;
}
