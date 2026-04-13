export type ParticipationState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RE_SUBMITTED';

export interface Participation {
  id: number;
  userId: number;
  activityId: number;
  state: ParticipationState;
  formData: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface SignupRequest {
  activityId: number;
  formData?: string;
}

export interface MyParticipation {
  id: number;
  activityId: number;
  activityName: string;
  templateType: import('./activity').TemplateType;
  state: ParticipationState;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ActivityDetail {
  id: number;
  eventId: number;
  eventName: string;
  name: string;
  description: string | null;
  templateType: import('./activity').TemplateType;
  startTime: string | null;
  endTime: string | null;
  maxParticipants: number | null;
  coverImage: string | null;
  status: import('./activity').ActivityStatus;
  formSchema: string | null;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string | null;
  currentUserParticipation: Participation | null;
}
