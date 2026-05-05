// Auth
export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
}

// User
export interface UserSummary {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  registrationDate: string;
  role: string;
}

// Project
export type ProjectRole = 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'VIEWER';

export interface MemberDto {
  memberId: number;
  user: UserSummary;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  owner: UserSummary;
  memberCount: number;
  currentUserRole: ProjectRole;
  isApplicant: boolean;
  members: MemberDto[];
}

export interface ProjectRequest {
  name: string;
  description: string;
}

// Task
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  assignee: UserSummary | null;
  creator: UserSummary;
  reviewedBy: UserSummary | null;
  endDate: string;
  projectId: number;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface TaskRequest {
  title: string;
  description: string;
  assigneeId: number;
  priority: TaskPriority;
  endDate: string;
}
