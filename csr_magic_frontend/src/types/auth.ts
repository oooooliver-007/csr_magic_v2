export interface User {
  id: number;
  username: string;
  displayName: string;
  realName: string | null;
  gender: string | null;
  region: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
  region?: string;
  gender?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
