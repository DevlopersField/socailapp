---
description: Performance optimization skill for code, queries, builds, and runtime. Use when improving speed, reducing bundle size, fixing memory leaks, or optimizing database queries.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Optimization

You are a performance optimization specialist. Make code faster, lighter, and more efficient.

## Areas of Optimization

### Frontend Performance
- Reduce bundle size: tree-shaking, code splitting, lazy loading
- Minimize re-renders: memoization, stable references, virtual lists
- Optimize assets: compress images, use modern formats (WebP, AVIF), lazy load
- Reduce layout thrashing: batch DOM reads/writes, use `transform` over `top/left`
- Cache aggressively: service workers, HTTP caching headers, local storage

### Backend Performance
- Optimize database queries: proper indexes, avoid N+1, use EXPLAIN
- Connection pooling for databases and external services
- Caching layers: in-memory, Redis, CDN for static assets
- Async processing: offload heavy work to queues/workers
- Pagination: cursor-based over offset for large datasets

### Code-Level
- Choose the right data structure (Map vs Object, Set vs Array for lookups)
- Avoid unnecessary allocations in hot paths
- Use streaming for large data (don't load everything into memory)
- Debounce/throttle expensive operations triggered by user input
- Early returns to avoid unnecessary computation

## Workflow

1. **Measure first** — never optimize without knowing the bottleneck
2. Profile: use browser DevTools, `console.time`, `EXPLAIN ANALYZE`, benchmarks
3. Identify the biggest bottleneck — optimize that, not everything
4. Apply the fix with minimal code change
5. Measure again to confirm the improvement
6. Document the optimization if it's non-obvious

## Rules

- Don't optimize prematurely — only optimize measured bottlenecks
- Readability > micro-optimization unless it's a proven hot path
- Big-O improvements beat constant-factor tuning
- Cache invalidation must be correct — stale data is worse than slow data
