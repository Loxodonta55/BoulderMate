---
name: spec-driven-dev
description: Spec Driven Development workflow. Every change starts with a specification. Use when planning features, reviewing specs, implementing from specs, or verifying implementations against specs.
when_to_use: "Always active. Enforces the Spec → Review → Implement → Verify workflow for all feature work."
---

# Spec Driven Development (SDD)

> **Nothing gets built without a spec. Nothing ships without verification against the spec.**

## Core Philosophy

Spec Driven Development inverts the traditional workflow. Instead of "code first, document later,"
every feature begins as a human-readable specification that serves as the contract between
intent and implementation.

```
┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐
│ SPECIFY  │ ──→ │  REVIEW  │ ──→ │ IMPLEMENT   │ ──→ │  VERIFY  │
│          │     │          │     │             │     │          │
│ Write    │     │ User     │     │ Code to     │     │ Prove    │
│ the spec │     │ approves │     │ the spec    │     │ against  │
│          │     │          │     │             │     │ the spec │
└──────────┘     └──────────┘     └─────────────┘     └──────────┘
```

## Phase 1: SPECIFY

### Spec File Format

All specs live in `docs/specs/` with the naming convention:
```
docs/specs/SPEC-{NNN}-{slug}.md
```

Example: `docs/specs/SPEC-001-user-authentication.md`

### Spec Template

```markdown
# SPEC-{NNN}: {Title}

## Status: DRAFT | APPROVED | IMPLEMENTING | DONE

## Summary
One paragraph describing what this feature does and why.

## User Stories
- As a [role], I want [capability], so that [benefit]

## Acceptance Criteria
- [ ] AC-1: {Concrete, testable criterion}
- [ ] AC-2: {Concrete, testable criterion}
- [ ] AC-3: {Concrete, testable criterion}

## Technical Design

### Data Model
Describe entities, relationships, schemas.

### API / Interface
Describe endpoints, methods, request/response shapes.

### UI / UX
Describe screens, components, user flows.

## Dependencies
- Depends on: SPEC-{NNN} (if applicable)
- Blocks: SPEC-{NNN} (if applicable)

## Out of Scope
What this spec explicitly does NOT cover.

## Open Questions
- [ ] Question 1
- [ ] Question 2
```

## Phase 2: REVIEW

### Review Checklist

Before approving a spec, verify:

| Check | Question |
|-------|----------|
| **Completeness** | Are all acceptance criteria testable? |
| **Clarity** | Can a developer implement without guessing? |
| **Scope** | Is the scope well-bounded? No creep? |
| **Dependencies** | Are dependencies identified and available? |
| **Edge Cases** | Are error states and edge cases covered? |
| **Feasibility** | Is the technical design realistic? |

### Approval

- User explicitly approves: `Status: DRAFT` → `Status: APPROVED`
- If changes needed: Update spec, re-review
- **NEVER skip review. NEVER implement a DRAFT spec.**

## Phase 3: IMPLEMENT

### Implementation Rules

1. **Reference the spec**: Every PR/commit message references `SPEC-{NNN}`
2. **Match acceptance criteria**: Each AC maps to at least one test
3. **Stay in scope**: If you discover work outside the spec, create a new spec
4. **Update status**: `Status: APPROVED` → `Status: IMPLEMENTING`

### Implementation Checklist

```markdown
## Implementation Progress (SPEC-{NNN})
- [ ] Data model / schema created
- [ ] API endpoints implemented
- [ ] UI components built
- [ ] Tests written (1 per AC minimum)
- [ ] Edge cases handled
- [ ] Code reviewed
```

## Phase 4: VERIFY

### Verification Protocol

For each Acceptance Criterion:

1. **Write a test** that directly validates the AC
2. **Run the test** — it must pass
3. **Check off the AC** in the spec
4. **Record evidence** (test output, screenshot, etc.)

### Verification Complete

When ALL acceptance criteria are checked off:
- `Status: IMPLEMENTING` → `Status: DONE`
- Link test results in the spec
- Celebrate 🎉

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Start coding without a spec | Write spec first, get approval |
| Write vague ACs ("it should work") | Write testable ACs ("returns 200 with user object") |
| Implement features outside spec scope | Create a new spec for new scope |
| Skip verification | Run all AC tests, check them off |
| Modify spec during implementation | If spec needs changes, pause and re-review |

## Integration with Agents

| Phase | Primary Agent | Supporting Agents |
|-------|--------------|-------------------|
| **SPECIFY** | `product-owner` / `product-manager` | `explorer-agent`, `database-architect` |
| **REVIEW** | User (human review) | `security-auditor` (for security specs) |
| **IMPLEMENT** | `orchestrator` → domain agents | `project-planner`, domain specialists |
| **VERIFY** | `test-engineer` | `qa-automation-engineer`, `debugger` |

## Spec Index

Maintain a running index in `docs/specs/INDEX.md`:

```markdown
# Spec Index

| ID | Title | Status | Owner |
|----|-------|--------|-------|
| SPEC-001 | ... | DRAFT | ... |
| SPEC-002 | ... | APPROVED | ... |
```
