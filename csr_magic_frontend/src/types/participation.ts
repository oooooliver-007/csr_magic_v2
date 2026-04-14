export type ParticipationState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RE_SUBMITTED';

export interface Participation {
  id: number;
  userId: number;
  userName: string;
  userDisplayName: string;
  activityId: number;
  activityName: string;
  state: ParticipationState;
  formData: string | null;
  rejectReason: string | null;
  reviewedById: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface SignupRequest {
  activityId: number;
  formData?: string;
}

export type ReviewAction = 'APPROVE' | 'REJECT';

export interface ReviewRequest {
  action: ReviewAction;
  rejectReason?: string;
}

export interface ParticipationListParams {
  page?: number;
  size?: number;
  eventId?: number;
  activityId?: number;
  userId?: number;
  state?: ParticipationState;
  keyword?: string;
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
