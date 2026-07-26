export type Role = 'member' | 'instructor' | 'admin';
export type AccountStatus = 'pending' | 'active' | 'blocked';
export type MaterialType = 'link' | 'video' | 'pdf';

export interface UserDTO {
  id: string;
  email: string;
  nim: string;
  full_name: string;
  role: Role;
  status: AccountStatus;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  program_studi?: string | null;
  angkatan?: number | null;
  points: number;
  streak_days?: number;
  created_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  points: number;
  streak_days: number;
  avatar_url?: string | null;
}

export interface ClassSummary {
  id: string;
  name: string;
  description?: string | null;
  instructor?: { id: string; full_name: string };
  instructorId?: string;
  _count?: { enrollments?: number; materials?: number };
}

export interface MaterialDTO {
  id: string;
  title: string;
  url: string;
  type: MaterialType;
  classId: string;
  created_at?: string;
}

export interface ClassDetailDTO extends ClassSummary {
  materials: MaterialDTO[];
}

export interface ClassMemberDTO {
  id: string;
  full_name: string;
  nim: string;
  email: string;
  enrolled_at: string;
}

export interface QuestionOptionsDTO {
  id: string;
  question_text: string;
  options: string[];
}

export interface QuestionAdminDTO extends QuestionOptionsDTO {
  correct_answer: string;
}

export interface QuizAttemptDTO {
  id?: string;
  quizId: string;
  userId: string;
  score: number;
  created_at?: string;
}

export interface QuizListItemDTO {
  id: string;
  title: string;
  classId: string;
  _count: { questions: number };
  attempts: QuizAttemptDTO[];
}

export interface QuizDetailDTO {
  id: string;
  title: string;
  classId: string;
  questions: QuestionOptionsDTO[] | QuestionAdminDTO[];
}

export interface SubmitQuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface QuizQuestionInput {
  question_text: string;
  options: string[];
  correct_answer: string;
}

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { message: string } };
