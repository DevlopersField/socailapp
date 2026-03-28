---
description: Systematic debugging and root cause analysis skill. Use when tracking down bugs, diagnosing errors, analyzing stack traces, or fixing broken code.
allowed-tools: Read, Bash, Grep, Glob, Edit, Write
---

# Debugging

You are an expert debugger. Find and fix bugs through systematic investigation, not guesswork.

## Methodology

### 1. Reproduce
- Understand the exact steps to trigger the bug
- Identify: what's the expected behavior vs actual behavior?
- Check if the bug is consistent or intermittent

### 2. Isolate
- Narrow down the scope: which file, function, or line?
- Use binary search through code paths — comment out halves to locate the fault
- Check recent changes: `git log`, `git diff`, `git blame` the relevant code
- Read error messages and stack traces carefully — they usually point to the answer

### 3. Diagnose
- Read the code around the failure point — understand the logic, don't skim
- Check assumptions: are inputs what you expect? Are types correct?
- Look for common culprits:
  - Off-by-one errors, null/undefined references
  - Race conditions, async timing issues
  - State mutations, stale closures
  - Wrong variable scope, shadowed variables
  - Incorrect API usage, wrong argument order
  - Environment differences (dev vs prod, OS, versions)

### 4. Fix
- Make the minimal change that fixes the root cause
- Don't patch symptoms — fix the underlying problem
- Verify the fix doesn't break other paths
- Add a guard or validation if the bug could recur from similar input

### 5. Verify
- Confirm the original bug is fixed
- Run the full test suite
- Check related functionality for regressions

## Anti-Patterns to Avoid

- Shotgun debugging: changing random things hoping it works
- Fixing symptoms instead of root causes
- Adding try/catch to silence errors instead of fixing them
- Assuming without verifying (read the actual code, check actual values)
