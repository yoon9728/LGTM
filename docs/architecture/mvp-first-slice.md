# MVP First Slice Architecture

## Flow

1. POST /practice/sessions
2. return one Code Review question with diff
3. POST /practice/answers
4. evaluation service computes structured result
5. frontend renders the result

## Boundaries

- request handlers stay thin
- evaluation stays behind a service/provider boundary
- current UX may stay synchronous but the boundary should support async later
