import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { projectsApi } from '../api/projects';

interface MemberRouteProps {
  children: React.ReactNode;
}

export default function MemberRoute({ children }: MemberRouteProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [status, setStatus] = useState<'loading' | 'member' | 'viewer'>('loading');

  useEffect(() => {
    if (!projectId) return;
    projectsApi.getById(Number(projectId))
      .then((p) => setStatus(p.currentUserRole === 'VIEWER' ? 'viewer' : 'member'))
      .catch(() => setStatus('viewer'));
  }, [projectId]);

  if (status === 'loading') return null;

  if (status === 'viewer') {
    return <Navigate to={`/projects/${projectId}?access=denied`} replace />;
  }

  return <>{children}</>;
}
