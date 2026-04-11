# Backend Risk Review

## Top Risks

- duplicate answer submission can create inconsistent evaluation history
- dry-run OpenAI mode can look successful even when the key is missing
- route-level validation is still minimal for malformed payloads

## Immediate QA Checks

- POST /practice/answers with empty content
- POST /practice/answers twice for the same session
- verify the evaluation payload shape when OPENAI_API_KEY is absent

## Follow-up

- backend should add stronger input validation
- orchestrator should decide whether dry-run mode is acceptable in MVP
