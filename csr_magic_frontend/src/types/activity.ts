export type TemplateType = 'BASIC' | 'DONATION' | 'VOLUNTEER' | 'CHECKIN' | 'CUSTOM';
export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';
export type FormFieldType = 'text' | 'number' | 'image' | 'boolean';

export interface FormFieldSchema {
  name: string;
  type: FormFieldType;
  required: boolean;
  label: string;
  max?: number;
}

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
  currentOccupiedSlots: number;
  allowFamily: boolean;
  maxFamilyPerUser: number | null;
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
  formSchema?: string;
  allowFamily?: boolean;
  maxFamilyPerUser?: number | null;
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
  formSchema?: string;
  allowFamily?: boolean;
  maxFamilyPerUser?: number | null;
}

export interface ActivityListParams {
  page?: number;
  size?: number;
  eventId?: number;
  status?: string;
  templateType?: TemplateType;
  keyword?: string;
}
