export function validatePracticeAnswerInput(input = {}) {
  const errors = [];

  if (!input.sessionId) {
    errors.push("sessionId is required.");
  }

  if (!input.questionId) {
    errors.push("questionId is required.");
  }

  if (!String(input.diff || "").trim()) {
    errors.push("diff is required.");
  }

  const summary = String(input.summary || "").trim();
  const findings = Array.isArray(input.findings) ? input.findings.filter(Boolean) : [];

  if (!summary && findings.length === 0) {
    errors.push("Either summary or findings is required.");
  }

  return errors;
}
