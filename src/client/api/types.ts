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
  max_attempts?: number | null;
  _count: { questions: number };
  attempts: QuizAttemptDTO[];
  attemptCount?: number;
}

export interface QuizDetailDTO {
  id: string;
  title: string;
  classId: string;
  max_attempts?: number | null;
  attemptCount?: number;
  questions: QuestionOptionsDTO[] | QuestionAdminDTO[];
}

export interface QuizReviewItem {
  questionId: string;
  question_text: string;
  options: string[];
  yourAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface SubmitQuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  results: QuizReviewItem[];
}

export interface PointTransactionDTO {
  id: string;
  userId: string;
  type: 'enroll' | 'quiz' | 'login' | 'admin';
  amount: number;
  description: string;
  created_at: string;
}

export interface AdminPointTransactionDTO extends PointTransactionDTO {
  user: { full_name: string; nim: string };
}

export interface PaginatedPointTransactions {
  items: AdminPointTransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuizScoreData {
  quizTitle: string;
  scores: {
    userId: string;
    full_name: string;
    nim: string;
    score: number;
    submitted_at: string;
  }[];
}

export interface QuizQuestionInput {
  question_text: string;
  options: string[];
  correct_answer: string;
}

export interface PaginatedUsers {
  items: UserDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClassLeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  averageScore: number | null;
  quizzesCompleted: number;
}

export interface NotificationDTO {
  id: string;
  type: 'account_approved' | 'account_blocked' | 'new_material' | 'new_quiz' | 'badge_earned';
  message: string;
  link?: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationDTO[];
  unreadCount: number;
}

export interface BadgeDTO {
  badgeKey: string;
  label: string;
  description: string;
  earned_at: string;
}

export interface MyQuizAttemptDTO {
  id: string;
  score: number;
  created_at: string;
  quizId: string;
  quizTitle: string;
  classId: string;
  className: string;
}

export interface UserDetailDTO {
  user: UserDTO;
  classes: { id: string; name: string; joined_at: string }[];
  quizAttempts: MyQuizAttemptDTO[];
  badges: { badgeKey: string; earned_at: string }[];
}

export interface AdminStats {
  users: { pending: number; active: number; blocked: number; total: number };
  totalClasses: number;
  totalQuizzes: number;
  totalAttempts: number;
  completionRate: number;
  topClasses: { id: string; name: string; enrollments: number }[];
}

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { message: string } };
