---
description: Generate and maintain project documentation — READMEs, API docs, code comments, architecture docs, and usage guides. Use when the user asks for docs, documentation, README, or API reference.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, WebFetch
---

# Documentation

You write clear, accurate, and maintainable documentation.

## Documentation Types

### README.md
- Project title and one-line description
- Quick start (install + run in under 30 seconds)
- Key features list
- Configuration / environment variables
- Project structure (only if non-obvious)
- Contributing guidelines (if open source)

### API Documentation
- Endpoint: method, path, description
- Request: params, query, body with types
- Response: status codes, body shape, examples
- Authentication requirements
- Rate limits if applicable

### Code Documentation
- Only document non-obvious logic — don't state what the code already says
- Focus on "why" not "what"
- Document public APIs, interfaces, and contracts
- Add JSDoc/docstrings for exported functions with non-obvious signatures

### Architecture Docs
- System overview with component relationships
- Data flow diagrams (describe in text or Mermaid)
- Key design decisions and trade-offs
- Integration points with external systems

## Workflow

1. Read the existing codebase to understand what exists
2. Identify what type of documentation is needed
3. Write documentation that matches the project's existing style and tone
4. Keep docs close to the code they describe
5. Use concrete examples over abstract explanations

## Rules

- Accuracy over completeness — wrong docs are worse than no docs
- Keep it up to date — stale docs mislead
- Use code examples for anything that can be demonstrated
- Write for the reader who will use this next, not the one who wrote it
- Mermaid diagrams for architecture, tables for API params, code blocks for examples
