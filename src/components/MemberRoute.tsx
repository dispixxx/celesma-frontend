import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { useAuthStore } from '../store/authStore';
import { isProjectMember } from '../utils/projectUtils';

interface MemberRouteProps {
  children: React.ReactNode;
}

export default function MemberRoute({ children }: MemberRouteProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const { username } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'member' | 'viewer'>('loading');

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getById(Number(projectId))
      .then((p) => setStatus(isProjectMember(p, username) ? 'member' : 'viewer'))
      .catch(() => setStatus('viewer'));
  }, [projectId, username]);

  if (status === 'loading') return null;

  if (status === 'viewer') {
    return <Navigate to={`/projects/${projectId}?access=denied`} replace />;
  }

  return <>{children}</>;
}
