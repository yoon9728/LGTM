# Interview App System Design

## System Direction

The system should be designed around a reusable practical assessment core.
Individual practice mode and future company interview mode should share the same underlying evaluation pipeline wherever possible.

## Core Product Architecture

- `apps/web`: user-facing practice experience
- `apps/api`: backend API for sessions, questions, answers, and evaluations
- evaluation pipeline separated from request/response handling
- future company interview workflows should extend the same core domain model

## Core Domain Entities

- `PracticeSession`
- `PracticeQuestion`
- `PracticeAnswer`
- `PracticeEvaluation`

These are enough for the first end-to-end MVP slice.

## First MVP Flow

1. Create a practice session
2. Fetch one practice question
3. Submit one answer
4. Trigger evaluation generation
5. Return evaluation result

## Architectural Principles

- keep API handlers thin
- put business rules in domain services
- isolate evaluation logic behind provider interfaces
- keep persistence behind repository-style modules
- make async evaluation possible even if the first version is simple

## Backend Shape

Suggested early endpoints:

- `GET /health`
- `GET /practice/sessions`
- `POST /practice/sessions`
- `POST /practice/answers`

The answer submission flow can call evaluation logic immediately in the earliest MVP, but the boundary should still be designed so it can become asynchronous later.

## Frontend Shape

The frontend should focus on one flow:

- session start
- question display
- answer submission
- evaluation result display

No complex dashboard or multi-role UX should be built before this flow works.

## Evaluation Design Direction

The evaluation engine should compare answers against structured rubric logic, not a single frozen answer string.

The architecture should support:

- rubric criteria
- explanation text
- strengths / weaknesses
- future provider replacement

## Expansion Path

Once the practice slice works, the same architecture should support:

- company-owned assessments
- configurable rubric weighting
- interviewer review workflow
- domain expansion into Excel, Splunk, and Power BI scenarios

## Risks

- overbuilding enterprise features before the first practical flow works
- tying evaluation too tightly to one provider
- coupling routes directly to evaluation logic
- building scoring around one perfect answer instead of answer patterns
