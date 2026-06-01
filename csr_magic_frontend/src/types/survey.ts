export interface SurveyQuestion {
  id: number;
  questionText: string;
  questionType: 'RATING' | 'CHOICE' | 'TEXT';
  options: string[] | null;
  required: boolean;
  sortOrder: number;
}

export interface Survey {
  id: number;
  activityId: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  questions: SurveyQuestion[];
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiGeneratedSurvey {
  title: string;
  description: string;
  questions: {
    questionText: string;
    questionType: 'RATING' | 'CHOICE' | 'TEXT';
    options: string[] | null;
    required: boolean;
  }[];
}

export interface GenerateSurveyRequest {
  activityId: number;
}

export interface CreateSurveyRequest {
  activityId: number;
  title: string;
  description?: string;
  questions: {
    questionText: string;
    questionType: 'RATING' | 'CHOICE' | 'TEXT';
    options?: string[];
    required?: boolean;
    sortOrder?: number;
  }[];
}

export interface SubmitSurveyRequest {
  surveyId: number;
  answers: {
    questionId: number;
    answerValue: string;
  }[];
}

export interface SurveyResult {
  id: number;
  surveyId: number;
  userId: number;
  username: string;
  displayName: string;
  sentimentScore: number;
  answers: {
    questionId: number;
    questionText: string;
    questionType: string;
    answerValue: string;
  }[];
  createdAt: string;
}

export interface SurveyStats {
  surveyId: number;
  title: string;
  responseCount: number;
  averageSentiment: number;
  totalQuestions: number;
}

export interface SurveyListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}
