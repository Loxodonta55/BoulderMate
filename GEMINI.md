# BoulderApp

> Boulder & Climbing App — Spec Driven Development

## Project Overview

BoulderApp is a boulder/climbing application built with Spec Driven Development (SDD).
Every feature starts as a specification that must be approved before implementation begins.

## Spec Driven Development Workflow (Autonomous Mode)

```
1. SPECIFY      → Write spec in docs/specs/
2. AUTO-APPROVE → Spec is treated as approved immediately
3. IMPLEMENT    → Code according to spec without interruption
4. VERIFY       → Prove code matches spec
```

### Autonomy & Execution Rules

1. **Zero Clarification Questions**: NEVER use the `ask_question` tool and DO NOT pause to ask clarifying or design questions. Make pragmatic, industry-standard assumptions autonomously and proceed.
2. **Bypass Socratic Gate**: Skip the mandatory questions from the brainstorming skill. Start planning and implementing immediately.
3. **Autonomous Spec Workflow**: Specs are written to `docs/specs/` as single source of truth, but are pre-approved (`Status: APPROVED`). Never halt execution to wait for user sign-off.
4. **End-to-End Execution**: Complete requests from start to finish in a single turn without intermediate pauses.
5. **Traceability & Verification**: Implementation is still tested and verified against spec criteria.

## Agent Configuration

### Primary Agents (Auto-routed via intelligent-routing)

| Agent | Domain | Use When |
|-------|--------|----------|
| `orchestrator` | Multi-Agent Coordination | Complex, multi-domain tasks |
| `project-planner` | Task Breakdown | New features, planning |
| `backend-specialist` | Server/API | API endpoints, business logic |
| `frontend-specialist` | UI/UX | Components, pages, styling |
| `database-architect` | Database | Schema, migrations, queries |
| `mobile-developer` | Mobile | React Native / Flutter |
| `test-engineer` | Testing | Unit, integration, E2E |
| `debugger` | Debugging | Bugs, errors, crashes |

### Supporting Agents

| Agent | Domain | Use When |
|-------|--------|----------|
| `security-auditor` | Security | Auth, vulnerabilities |
| `devops-engineer` | Deployment | CI/CD, production |
| `performance-optimizer` | Performance | Speed, Core Web Vitals |
| `explorer-agent` | Discovery | Codebase analysis |
| `documentation-writer` | Docs | Only when explicitly requested |
| `product-owner` | Product | Requirements, backlog |
| `product-manager` | Product | PRDs, user stories |

## Code Quality

- Run `lint` and `type-check` before committing
- All code changes require tests
- Follow clean-code principles
- Use the spec as acceptance criteria

## Tech Stack

> To be determined based on project specs.
