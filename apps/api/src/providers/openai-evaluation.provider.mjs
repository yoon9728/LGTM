import { EvaluationProvider } from "./evaluation-provider.interface.mjs";

function normalizeArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

export class OpenAIEvaluationProvider extends EvaluationProvider {
  async evaluateAnswer(answer) {
    const apiKey = process.env.OPENAI_API_KEY || "";
    const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

    if (!apiKey) {
      return {
        answerId: answer?.id || null,
        evaluable: false,
        reason: "provider_not_configured",
        score: null,
        strengths: [],
        weaknesses: ["OPENAI_API_KEY is not configured yet."],
        nextSteps: ["Set OPENAI_API_KEY to enable live evaluation."],
        rationale: "OPENAI_API_KEY is not configured yet, so the provider could not run.",
        provider: "openai-not-configured"
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are evaluating a Code Review answer. Return strict JSON with keys: evaluable, reason, score, strengths, weaknesses, nextSteps, rationale."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Evaluate this Code Review answer",
              answer
            })
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`openai_http_${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      answerId: answer?.id || null,
      evaluable: parsed.evaluable !== false,
      reason: parsed.reason || null,
      score: typeof parsed.score === "number" ? parsed.score : null,
      strengths: normalizeArray(parsed.strengths),
      weaknesses: normalizeArray(parsed.weaknesses),
      nextSteps: normalizeArray(parsed.nextSteps),
      rationale: String(parsed.rationale || "Live OpenAI evaluation completed."),
      provider: "openai-live"
    };
  }
}
