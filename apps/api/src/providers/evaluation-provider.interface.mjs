export class EvaluationProvider {
  async evaluateAnswer(_answer) {
    throw new Error("evaluateAnswer must be implemented by a concrete provider.");
  }
}
