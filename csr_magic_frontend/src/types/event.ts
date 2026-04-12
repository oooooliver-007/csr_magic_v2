export type EventType = 'OFFLINE' | 'ONLINE' | 'HYBRID';

export interface Event {
  id: number;
  name: string;
  description: string | null;
  type: EventType | null;
  startDate: string | null;
  endDate: string | null;
  coverImage: string | null;
  visible: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  type?: EventType;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  visible?: boolean;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  type?: EventType;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  visible?: boolean;
}

export interface EventListParams {
  page?: number;
  size?: number;
  keyword?: string;
}
