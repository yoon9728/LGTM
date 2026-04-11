# Interview App PRD

## Product Summary

Interview App is an AI-era practical interview platform.
It is built around the idea that hiring should measure real working judgment, not only timed coding tests.
The platform should help both individuals and companies evaluate practical technical skill through review, reasoning, architecture thinking, and tool use.

## Core Thesis

- AI can already generate a large amount of code, so raw coding tests are a weaker hiring signal than before.
- More durable signals are review quality, tradeoff reasoning, architecture thinking, prioritization, and communication.
- The product should evaluate practical reasoning, not just whether someone typed the exact final answer.

## Primary Users

- Individual learners who want to practice practical interview-style technical judgment.
- Companies who want to run practical interview workflows with configurable evaluation criteria.
- Interviewers who want AI assistance while still seeing the candidate's actual answer and reasoning.

## Product Modes

### Individual Practice Mode

The user chooses or receives a practical scenario and submits a response.
AI reviews the answer, compares it against reference patterns, and gives actionable feedback.

Practice scenarios can include:

- code review
- architecture / system design
- debugging and root-cause analysis
- Excel task reasoning
- Splunk investigation reasoning
- Power BI scenario reasoning

### Company Interview Mode

The company chooses problems from the platform or supplies their own.
The company can weight evaluation criteria depending on what matters more for the role.
AI performs the first evaluation pass, while the interviewer can still inspect the raw response and rationale.

## MVP Scope

The MVP should start with the narrowest end-to-end slice that proves the concept.

### MVP Product Scope

- individual practice mode first
- asynchronous experience first
- one practical question flow first
- answer submission and evaluation first
- no live interview workflow in MVP
- no full enterprise admin system in MVP

### MVP Evaluation Categories

- Code Review
- Architecture / System Design
- one tool-based scenario later, after the first practical flow works

## MVP First Slice

The first slice should be:

1. Start a practice session
2. Show one interview question
3. Let the user submit one answer
4. Generate one evaluation
5. Show feedback and completion state

This is the first slice the engineering team should prioritize before broader scope.

## Evaluation Philosophy

The product should not rely on a single rigid perfect answer.
Instead, evaluation should be based on:

- required coverage points
- strong answer patterns
- weak answer patterns
- risk awareness
- communication clarity
- prioritization quality
- tradeoff reasoning

## Company Evaluation Controls

Companies should eventually be able to weight criteria such as:

- accuracy
- communication
- prioritization
- architecture judgment
- business awareness
- risk recognition

## Non-Goals For MVP

- real-time live interviewer copilot
- video interview tooling
- deep analytics dashboards
- broad enterprise customization
- multi-question adaptive interview loops

## Success Criteria For MVP

- a user can complete one practical practice flow end-to-end
- the platform produces a visible evaluation result
- the evaluation is explainable, not just a score
- the system structure can later expand to company interview mode
