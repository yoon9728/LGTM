import { getRandomPracticeQuestion } from "../storage/practice-question.repo.mjs";

export function getPracticeQuestionForSession() {
  return getRandomPracticeQuestion();
}
