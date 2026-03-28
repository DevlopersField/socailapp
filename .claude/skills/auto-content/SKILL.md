---
description: AI content generator for social media. Use when the user wants to generate post titles, captions, hashtags, or full content packages optimized for specific platforms. Works with the AutoSocial content creation pipeline.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, AskUserQuestion
---

# Auto-Content — AI Content Generator

You generate high-performing social media content for AutoSocial.

## Workflow

### Step 1: Content Brief
Gather from user:
- Content type (Case Study / Knowledge / Design / Trend / Promotion)
- Key details (2 adaptive questions based on type)
- Target platforms
- Brand voice (if defined in brand guidelines)

### Step 2: Generate Content Package

For each post, produce:

#### Titles (3 variations)
- **Hook:** Pattern interrupt, question, or bold claim
- **Value:** Clear benefit or result
- **Curiosity:** Open loop that demands a click

#### Captions (per platform)
Adapt tone, length, and format for each:

| Platform | Length | Tone | Format |
|----------|--------|------|--------|
| Instagram | 150-300 chars | Conversational, engaging | Short paragraphs, emoji-light, CTA |
| LinkedIn | 1300-2000 chars | Professional, insightful | Story arc, line breaks, data points |
| Twitter/X | <280 chars | Sharp, punchy | One-liner or thread hook |
| Pinterest | 100-500 chars | SEO-rich, actionable | Keywords first, benefit-driven |
| Dribbble | 150-400 chars | Design-focused, peer-to-peer | Process, tools, inspiration |
| GMB | 100-300 chars | Local, direct, service-focused | CTA, location, contact |

#### Hashtags
- **Trending (3-5):** Currently high-volume
- **Niche (3-5):** Industry-specific
- **Branded (1-2):** Agency or client tags

Platform-specific counts:
- Instagram: 15-20
- LinkedIn: 3-5
- Twitter: 2-3
- Pinterest: 5-10

### Step 3: Content Calendar Integration
After generating, offer to:
- Schedule via auto-scheduler
- Export as package via auto-uploader
- Save as draft for later editing

## Content Templates

### Case Study Template
```
[Hook: Result or transformation]
[Context: Client industry + challenge]
[Solution: What you did]
[Result: Specific metrics]
[CTA: Ask question or invite DM]
```

### Knowledge Template
```
[Hook: Surprising fact or question]
[Teach: Core insight in 3-5 points]
[Example: Real-world application]
[CTA: Save for later / Share with someone]
```

### Design Template
```
[Hook: Visual description or design principle]
[Process: How it was made]
[Details: Tools, techniques, decisions]
[CTA: Follow for more / What do you think?]
```

## Anti-Patterns
- Never use: "excited to announce", "game-changer", "thrilled", "leveraging"
- Never start LinkedIn posts with "I'm happy to share..."
- Avoid walls of hashtags in captions — separate them
- Don't use the same CTA twice in a week
