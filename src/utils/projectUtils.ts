import type { ProjectResponseDto, ProjectRole, ApplicantResponseDto } from '../types';

export function getCurrentUserRole(project: ProjectResponseDto, currentUsername: string | null): ProjectRole {
  if (!currentUsername) return 'VIEWER';
  
  const member = project.members.find(m => m.user.username === currentUsername);
  return member ? member.role : 'VIEWER';
}

export function isProjectMember(project: ProjectResponseDto, currentUsername: string | null): boolean {
  if (!currentUsername) return false;
  return project.members.some(m => m.user.username === currentUsername);
}

export function getMemberCount(project: ProjectResponseDto): number {
  return project.members.length;
}

export function isOwner(project: ProjectResponseDto, currentUsername: string | null): boolean {
  if (!currentUsername) return false;
  return project.owner.username === currentUsername;
}

export function isApplicant(applicants: ApplicantResponseDto[], currentUsername: string | null): boolean {
  if (!currentUsername) return false;
  return applicants.some(a => a.user.username === currentUsername);
}
