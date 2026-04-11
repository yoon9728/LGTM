const practiceSessions = [];

export function insertPracticeSession(session) {
  practiceSessions.push(session);
  return session;
}

export function getPracticeSessions() {
  return [...practiceSessions];
}

export function findPracticeSessionById(sessionId) {
  return practiceSessions.find((session) => session.id === sessionId) || null;
}

export function updatePracticeSessionStatus(sessionId, status) {
  const session = practiceSessions.find((s) => s.id === sessionId);
  if (!session) return null;
  session.status = status;
  session.updatedAt = new Date().toISOString();
  return session;
}
