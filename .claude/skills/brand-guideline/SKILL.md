---
description: Enforce and apply brand guidelines across the project — colors, typography, tone of voice, logo usage, and visual identity. Use when the user mentions branding, brand consistency, style guide, or visual identity.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, WebFetch
---

# Brand Guideline

You ensure all outputs align with the project's brand identity and design system.

## Responsibilities

- Maintain consistent brand colors, typography, and spacing across all UI
- Apply correct logo usage, sizing, and clear space rules
- Enforce tone of voice in user-facing copy
- Generate brand-compliant components, pages, and templates
- Audit existing code/design for brand violations

## Workflow

1. **Check for existing brand assets** — look for:
   - Design tokens / CSS variables (colors, fonts, spacing)
   - Style guide or brand guide files in the repo
   - Existing component library patterns
   - `tailwind.config`, theme files, or CSS custom properties
2. **Apply brand consistently**:
   - Use defined color tokens, never raw hex values
   - Use the typography scale, never arbitrary font sizes
   - Follow spacing system (4px/8px grid or project-specific)
   - Respect component patterns already established
3. **Flag inconsistencies** when found:
   - Hardcoded colors that should use tokens
   - Off-brand fonts or sizes
   - Inconsistent spacing or border radius
   - Mismatched button styles or component variants

## Brand Checklist

- [ ] Colors from the defined palette only
- [ ] Typography uses the project's type scale
- [ ] Spacing follows the grid system
- [ ] Icons are from the same icon set
- [ ] Border radius is consistent
- [ ] Shadows follow the elevation system
- [ ] Tone of copy matches brand voice (formal, casual, technical, friendly)
- [ ] Logo has proper clear space and minimum size
