import { findPracticeSessionById, getPracticeSessions, insertPracticeSession } from "../storage/practice-session.repo.mjs";
import { getPracticeQuestionForSession } from "./practice-question.service.mjs";

export function createPracticeSession(input = {}) {
  const question = getPracticeQuestionForSession();
  const session = {
    id: `session_${Date.now()}`,
    candidateId: input.candidateId || "local-test-user",
    status: "question_ready",
    question,
    createdAt: new Date().toISOString()
  };

  return insertPracticeSession(session);
}

export function listPracticeSessions() {
  return getPracticeSessions();
}

export function getPracticeSession(sessionId) {
  return findPracticeSessionById(sessionId);
}
