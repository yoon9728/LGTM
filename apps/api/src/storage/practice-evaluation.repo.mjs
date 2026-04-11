const practiceEvaluations = [];

export function insertPracticeEvaluation(evaluation) {
  practiceEvaluations.push(evaluation);
  return evaluation;
}

export function getPracticeEvaluations() {
  return [...practiceEvaluations];
}

export function findPracticeEvaluationByAnswerId(answerId) {
  return practiceEvaluations.find((e) => e.answerId === answerId) || null;
}
