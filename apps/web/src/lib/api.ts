const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300";

/** Custom error class that preserves HTTP status code */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body.slice(0, 200));
  }
  return res.json();
}

export interface Question {
  id: string;
  category: string;
  type: string;
  difficulty?: "easy" | "medium" | "hard";
  language?: string;
  title: string;
  prompt: string;
  diff: string;
  templates?: Record<string, string>;
}

export interface QuestionListItem {
  id: string;
  category: string;
  type: string;
  difficulty: "easy" | "medium" | "hard" | null;
  language: string | null;
  title: string;
  prompt: string;
  bestScore: number | null;
  completed: boolean;
}

export interface TypeStats {
  total: number;
  completed: number;
}

export interface CategoryStats {
  total: number;
  completed: number;
  types: Record<string, TypeStats>;
}

export interface CategoryMeta {
  id: string;
  label: string;
  description: string;
  types: { id: string; label: string; description: string; language?: string }[];
}

export interface LanguageMeta {
  id: string;
  label: string;
}

export interface Session {
  id: string;
  candidateId: string;
  language: string | null;
  status: string;
  question: Question;
}

export interface CriterionResult {
  criterion: string;
  coverage: "covered" | "partial" | "missing";
  evidence: string;
}

export interface Evaluation {
  id: string;
  answerId: string;
  score: number | null;
  evaluable: boolean;
  reason: string | null;
  rationale: string | null;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  criteriaResults: CriterionResult[];
  provider: string;
}

export interface HistoryEntry {
  sessionId: string;
  questionTitle: string;
  questionCategory: string;
  questionType: string;
  questionLanguage: string | null;
  status: string;
  score: number | null;
  createdAt: string;
}

export interface StatsOverview {
  totalSessions: number;
  completedSessions: number;
  avgScore: number | null;
  streak: number;
  totalQuestions: number;
  solvedQuestions: number;
}

export interface CategoryStat {
  category: string;
  sessionCount: number;
  avgScore: number | null;
  bestScore: number | null;
}

export interface ScoreTrendPoint {
  sessionId: string;
  category: string;
  score: number;
  date: string;
}

export interface RecentSession {
  sessionId: string;
  questionTitle: string;
  category: string;
  type: string;
  status: string;
  score: number | null;
  date: string;
}

export interface UserStats {
  overview: StatsOverview;
  categoryStats: CategoryStat[];
  scoreTrend: ScoreTrendPoint[];
  recentSessions: RecentSession[];
  weakestCategory: { category: string; avgScore: number | null } | null;
}

export interface CategoryDetailOverview {
  sessionCount: number;
  completedCount: number;
  avgScore: number | null;
  bestScore: number | null;
  totalQuestions: number;
  solvedQuestions: number;
}

export interface SubtopicStat {
  type: string;
  sessionCount: number;
  avgScore: number | null;
  bestScore: number | null;
  totalQuestions: number;
}

export interface CriteriaInsightItem {
  label: string;
  covered: number;
  total: number;
  rate: number;
}

export interface CategoryDetailSession {
  sessionId: string;
  questionTitle: string;
  type: string;
  status: string;
  score: number | null;
  date: string;
}

export interface CategoryDetail {
  overview: CategoryDetailOverview;
  scoreTrend: { sessionId: string; score: number; type: string; date: string }[];
  subtopicStats: SubtopicStat[];
  criteriaInsights: {
    mostCovered: CriteriaInsightItem[];
    mostMissed: CriteriaInsightItem[];
  };
  sessions: CategoryDetailSession[];
}

/** Fire-and-forget ping to wake the API from cold start */
export function warmUpApi() {
  fetch(`${API_BASE}/health`, { method: "GET" }).catch(() => {});
}

export const api = {
  getQuestions: (opts?: { category?: string; type?: string; language?: string }) => {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.type) params.set("type", opts.type);
    if (opts?.language) params.set("language", opts.language);
    const qs = params.toString();
    return request<{
      questions: QuestionListItem[];
      categoryStats: Record<string, CategoryStats>;
    }>(`/practice/questions${qs ? `?${qs}` : ""}`);
  },

  getMeta: () =>
    request<{ categories: CategoryMeta[]; languages: LanguageMeta[] }>(
      "/practice/questions/meta"
    ),

  createSession: (opts?: { questionId?: string; category?: string; type?: string; language?: string }) =>
    request<{ session: Session; isGuest: boolean }>("/practice/sessions", {
      method: "POST",
      body: JSON.stringify(opts ?? {}),
    }),

  getSession: (id: string) =>
    request<{ session: Session }>(`/practice/sessions/${id}`),

  updateSession: (id: string, body: { language?: string }) =>
    request<{ session: Session }>(`/practice/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  submitAnswer: (body: {
    sessionId: string;
    questionId: string;
    category: string;
    [key: string]: unknown;
  }) =>
    request<{ answer: { id: string }; evaluation: Evaluation }>(
      "/practice/answers",
      { method: "POST", body: JSON.stringify(body) }
    ),

  retryEvaluation: (sessionId: string) =>
    request<{ answer: { id: string }; evaluation: Evaluation }>(`/practice/sessions/${sessionId}/retry-evaluation`, { method: "POST" }),

  getHistory: () =>
    request<{ history: HistoryEntry[] }>("/practice/history"),

  getStats: () =>
    request<{ stats: UserStats }>("/users/me/stats"),

  getCategoryStats: (category: string) =>
    request<CategoryDetail>(`/users/me/stats/${category}`),
};
