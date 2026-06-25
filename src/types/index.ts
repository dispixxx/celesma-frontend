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
export interface UserResponseDto {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
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
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'VIEWER';

export interface MemberResponseDto {
  memberId: number;
  user: UserResponseDto;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectResponseDto {
  id: number;
  name: string;
  description: string;
  owner: UserResponseDto;
  members: MemberResponseDto[];
}

export interface ProjectPreviewResponse {
  id: number;
  name: string;
  description: string;
}

export interface ApplicantResponseDto {
  projectId: number;
  user: UserResponseDto;
  requestAt: string;
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
  assignee: UserResponseDto | null;
  creator: UserResponseDto;
  reviewedBy: UserResponseDto | null;
  endDate: string;
  projectId: number;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface TaskRequest {
  title: string;
  description: string;
  assigneeId: number | null;
  priority: TaskPriority;
  endDate: string;
}

// AI
export type AiDescriptionAction = 'TITLE' | 'IMPROVE' | 'FORMALIZE' | 'SUBTASKS';

export interface AiTitleRequest {
  description: string;
}

export interface AiDescriptionRequest {
  description: string;
  action: AiDescriptionAction;
}

// Comment
export interface CommentResponse {
  id: number;
  text: string;
  author: UserResponseDto;
  createdAt: string;
}

export interface CommentRequest {
  text: string;
}

// Task History
export interface TaskHistoryResponse {
  id: number;
  changedBy: UserResponseDto;
  description: string;
  changedAt: string;
}