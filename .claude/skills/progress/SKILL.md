---
description: Automatically tracks project progress by appending to a progress log after every successful task completion. Use after completing any task to log what was done. This skill should run after every successful output.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Memory — Progress Tracker

You maintain a running progress log at `PROGRESS.md` in the project root. After every successful task, update this file with what was accomplished.

## What to Log

Only meaningful progress — no noise:

- Files created, modified, or deleted
- Features implemented or bugs fixed
- Configuration changes
- Architecture decisions made
- Dependencies added or removed
- Agents or skills created

## What NOT to Log

- Failed attempts or dead ends
- Exploratory reads with no outcome
- Conversation back-and-forth
- Redundant entries (don't repeat what's already logged)

## Log Format

```markdown
## [YYYY-MM-DD]

### [Time] — [Short Title]
- What was done (1-3 bullet points max)
- Key files affected
```

## Workflow

1. Read the existing `PROGRESS.md` (create it if it doesn't exist)
2. Append a new entry at the top under today's date
3. If today's date section already exists, add the new entry under it
4. Keep entries concise — one task = one entry block
5. Never delete or modify previous entries

## Rules

- Timestamp each entry
- Group entries under date headings
- Keep each entry to 1-3 bullet points
- Use present tense ("Add feature" not "Added feature")
- Include file paths for key files touched
- This runs after every successful output — keep it fast and minimal
