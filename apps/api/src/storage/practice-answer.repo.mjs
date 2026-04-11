const practiceAnswers = [];

export function insertPracticeAnswer(answer) {
  practiceAnswers.push(answer);
  return answer;
}

export function getPracticeAnswers() {
  return [...practiceAnswers];
}

export function findPracticeAnswerById(answerId) {
  return practiceAnswers.find((answer) => answer.id === answerId) || null;
}

export function findPracticeAnswerBySessionId(sessionId) {
  return practiceAnswers.find((answer) => answer.sessionId === sessionId) || null;
}
