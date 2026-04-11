import { buildEvaluationFailure, createEvaluationState, markEvaluationCompleted } from "../domain/practice-evaluation.service.mjs";
import { insertPracticeEvaluation } from "../storage/practice-evaluation.repo.mjs";
import { OpenAIEvaluationProvider } from "../providers/openai-evaluation.provider.mjs";

const provider = new OpenAIEvaluationProvider();

function withTimeout(promise, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error("evaluation_timeout");
      error.code = "evaluation_timeout";
      reject(error);
    }, timeoutMs);

    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

export async function evaluatePracticeAnswerJob(answer) {
  const queued = createEvaluationState(answer);

  try {
    const result = await withTimeout(provider.evaluateAnswer(answer));
    return insertPracticeEvaluation(markEvaluationCompleted(queued, result));
  } catch (error) {
    const reason = error?.code === "evaluation_timeout" ? "evaluation_timeout" : "provider_failure";
    return insertPracticeEvaluation(markEvaluationCompleted(queued, buildEvaluationFailure(reason)));
  }
}
