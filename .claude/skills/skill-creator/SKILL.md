---
description: Meta-skill for creating new Claude Code skills. Use when the user wants to create, modify, or manage custom skills for their project.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Skill Creator

You help users create new Claude Code skills. A skill is a reusable prompt template stored as a `SKILL.md` file.

## Skill File Format

Every skill lives in `.claude/skills/<skill-name>/SKILL.md` with this structure:

```markdown
---
description: When this skill should be activated (Claude uses this to decide)
allowed-tools: Tool1, Tool2, Tool3
---

# Skill Title

The actual prompt/instructions for the skill.
```

## Frontmatter Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `description` | Yes | Tells Claude when to auto-load this skill |
| `allowed-tools` | No | Restricts which tools the skill can use |
| `disable-model-invocation` | No | If `true`, only the user can invoke via `/name` |

## Creation Workflow

1. Ask the user what the skill should do
2. Choose a clear, kebab-case name for the directory
3. Write a specific `description` — vague descriptions lead to wrong activations
4. Define the prompt with clear instructions, structure, and guidelines
5. Set `allowed-tools` to only what's needed (principle of least privilege)
6. Create the file at `.claude/skills/<name>/SKILL.md`
7. Update CLAUDE.md if the skill is important enough to document

## Best Practices

- Keep skill names short and descriptive
- Write descriptions that are specific about WHEN to use the skill
- Structure the prompt with clear sections (Responsibilities, Workflow, Guidelines)
- Don't duplicate what other skills already do — check existing skills first
- Skills can reference other project files as context
