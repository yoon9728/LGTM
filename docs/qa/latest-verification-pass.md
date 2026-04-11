# Latest Verification Pass

- checked at: 2026-04-11T12:37:56.951Z

## Verification status

- browser flow: pass
- backend contract: pass
- api smoke: fail
- answer flow smoke: fail
- runnable first slice: fail

## Required browser flow

- start session in apps/web
- render one Code Review diff question
- submit one answer without manual backend intervention
- render one evaluation in the same UI flow

## Failure states to verify

- timeout returns a visible timeout state
- evaluable=false returns a visible reason state
- provider failure preserves the answer and exposes retry
- duplicate submissions do not create inconsistent evaluation state

## Evidence

- apps/web exposes local dev/start scripts through dev-server.mjs.
- apps/web includes question, answer, retry, and evaluation panels in one screen.
- apps/web script calls sessions and answers endpoints and renders evaluation.
- apps/web preserves drafts and exposes retry/failure states.
- apps/web does not re-save cleared drafts after a successful submit.
- backend validates the current UI payload shape.
- POST /practice/answers returns answer + evaluation in the same response path.
- evaluation job persists success/failure results and keeps timeout/provider failure structured.

## Failures found

- runtime smoke failed: fetch failed

## Follow-up rule

- if any step fails, send the fix back to frontend/backend immediately instead of asking for a human decision
