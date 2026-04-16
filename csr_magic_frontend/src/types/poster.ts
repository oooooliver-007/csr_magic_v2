export type PosterStyle =
  | 'minimalist'
  | 'watercolor'
  | '3d'
  | 'cartoon'
  | 'chinese'
  | 'realistic';

export type PosterStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface GeneratePosterRequest {
  activityId: number;
  style: PosterStyle;
  userPrompt?: string;
}

export interface GenerateTaskResponse {
  taskId: string;
}

export interface PosterStatusResponse {
  taskId: string;
  status: PosterStatus;
  posterUrl: string | null;
  errorMessage: string | null;
}

export interface PosterRecord {
  id: number;
  activityId: number;
  activityName: string | null;
  taskId: string;
  style: string;
  userPrompt: string | null;
  status: PosterStatus;
  posterUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface StyleOption {
  value: PosterStyle;
  label: string;
  labelZh: string;
}
