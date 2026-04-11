# First Slice Test Plan

## Happy path

- create one session
- receive one Code Review question with diff
- submit one answer
- receive structured evaluation

## Edge cases

- empty answer payload
- unrelated answer content
- evaluation timeout returns evaluable=false
- duplicate submission does not create inconsistent state
