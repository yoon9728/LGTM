import { getPracticeSession } from "./practice-session.service.mjs";
import { getPracticeAnswers, insertPracticeAnswer, findPracticeAnswerBySessionId } from "../storage/practice-answer.repo.mjs";
import { updatePracticeSessionStatus } from "../storage/practice-session.repo.mjs";

export function createPracticeAnswer(input = {}) {
  const session = getPracticeSession(input.sessionId);

  // Guard: reject duplicate submissions for the same session
  const existing = input.sessionId ? findPracticeAnswerBySessionId(input.sessionId) : null;
  if (existing) {
    const err = new Error("An answer for this session has already been submitted.");
    err.code = "duplicate_answer";
    throw err;
  }

  const answer = {
    id: `answer_${Date.now()}`,
    sessionId: input.sessionId || null,
    questionId: input.questionId || session?.question?.id || null,
    review: {
      summary: input.summary || "",
      findings: Array.isArray(input.findings) ? input.findings : [],
      diff: input.diff || session?.question?.diff || ""
    },
    status: "submitted",
    createdAt: new Date().toISOString()
  };

  const saved = insertPracticeAnswer(answer);

  // Advance session state so downstream knows the session has an answer
  if (input.sessionId) {
    updatePracticeSessionStatus(input.sessionId, "answer_submitted");
  }

  return saved;
}

export function listPracticeAnswers() {
  return getPracticeAnswers();
}
