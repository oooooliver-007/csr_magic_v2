export type TemplateType = 'BASIC' | 'DONATION' | 'VOLUNTEER' | 'CHECKIN' | 'CUSTOM';
export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';

export interface Activity {
  id: number;
  eventId: number;
  eventName: string;
  name: string;
  description: string | null;
  templateType: TemplateType;
  startTime: string | null;
  endTime: string | null;
  maxParticipants: number | null;
  coverImage: string | null;
  status: ActivityStatus;
  formSchema: string | null;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateActivityRequest {
  eventId: number;
  name: string;
  templateType: TemplateType;
  description?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  coverImage?: string;
  status?: ActivityStatus;
}

export interface UpdateActivityRequest {
  eventId?: number;
  name?: string;
  templateType?: TemplateType;
  description?: string;
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  coverImage?: string;
  status?: ActivityStatus;
}

export interface ActivityListParams {
  page?: number;
  size?: number;
  eventId?: number;
  status?: string;
  keyword?: string;
}
