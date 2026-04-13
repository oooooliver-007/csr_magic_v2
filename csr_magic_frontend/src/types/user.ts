export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  realName: string | null;
  gender: string | null;
  region: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string | null;
}

export interface RecentParticipation {
  id: number;
  activityName: string;
  state: string;
  createdAt: string;
}

export interface UserDetail extends UserInfo {
  participationCount: number;
  recentParticipations: RecentParticipation[];
}

export interface UpdateUserRequest {
  displayName?: string;
  realName?: string;
  gender?: string;
  region?: string;
  role?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UpdateMeRequest {
  displayName?: string;
  realName?: string;
  gender?: string;
  region?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserListParams {
  page?: number;
  size?: number;
  keyword?: string;
  region?: string;
}
