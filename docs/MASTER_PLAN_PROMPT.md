> **Historical.** This is the original prompt that kicked off Steps 1–5. All five
> steps are now complete and approved — see `AUDIT_REPORT.md`,
> `TARGET_ARCHITECTURE.md`, `SCHEMA_DESIGN.md`, `DESIGN_SYSTEM.md`,
> `GAP_ANALYSIS.md`, `MASTER_PLAN.md`, `CONVENTIONS.md`, and
> `READINESS_CHECKLIST.md`. A few decisions stated below were later revised by
> the user during the process (repo name `network` → `rajya`; disappearing
> messages / view-once media / watermarking / blur-on-blur were cut — see
> `GAP_ANALYSIS.md` §14). Kept as-is for the record; the documents above are
> authoritative where they differ from this prompt.

# ROLE

You are an elite software architect and technical product strategist with deep, 
specific expertise in:

- Large-scale real-time chat/messaging systems (Telegram, Discord, WhatsApp, 
Slack, Signal architecture patterns)
- Ruby on Rails API architecture at scale
- Modern React/TypeScript frontend architecture
- PostgreSQL schema design for high-write, high-concurrency messaging workloads
- Premium product design systems and UI/UX for consumer chat applications
- Migration strategy and technical risk management

You do not guess or assume. You investigate the actual codebase thoroughly 
before forming opinions, and you clearly separate "what I observed in the 
code" from "what I recommend."

---



# CONTEXT

I have a working, feature-rich Progressive Web App (chat application) built as:

- **Backend(cognify/ repo)**: Ruby on Rails (API), PostgreSQL, hosted separately from frontend
- **Frontend(botverse/ repo)**: React + TypeScript
- **Media storage**: Cloudflare

The application currently supports (non-exhaustive — verify against actual code):

- Predefined bots + user-created bots with custom prompts (AI-powered)
- Multiple account support per user
- 1:1 and group chats
- Voice notes, media & file uploads
- Message actions: pin, reply, save, forward, edit, unsend, copy
- Chat folders
- Email & phone-based login, multiple login flows
- Privacy controls (findability, visibility of details)
- Visibility settings (read receipts, online status)
- Display customization (colors, sizes, fonts)
- Voice/video calls
- Real-time features (implied: ActionCable or similar)

**Current known problems:**

- Codebase evolved through many iterative feature additions without 
refactoring — architecture is not optimized for current feature set
- Many DB migrations accumulated organically — current schema may not be 
ideal for actual access patterns
- UI/UX was never designed intentionally — functional but not premium-feeling
- An `ARCHITECTURE.md` exists but is outdated (written mid-development, 
several features/changes since)
- No strong confidence in current test coverage

**Key constraint that gives you freedom:** This will be deployed as a **new 
application**. Backward compatibility with the current database, API 
contracts, or deployed clients is **NOT required**. You may propose breaking 
changes, full schema redesigns, new architectural patterns, or even 
alternative technology choices if strongly justified — as long as the 
migration path from "current codebase" to "target codebase" is realistic, 
staged, and low-risk to execute (even though the *deployment* is fresh, the 
*build* should reuse validated business logic, not blindly guess it).

---



# OBJECTIVE

Produce a comprehensive, actionable **MASTER_PLAN.md** that describes how to  rebuild this application into the best-in-class chat application possible —  matching the code quality, architecture cleanliness, performance, and UI/UX  polish of products like Telegram, Discord, WhatsApp, Instagram, or Linear (for  UI craft) — while preserving 100% of the existing product functionality  (unless I explicitly agree to drop something) and improving on it where  sensible.

This is a **planning task**. Do not write implementation code in this pass. 
Your output is a plan I will review, adjust, and then execute in phases 
across multiple future sessions.

---



# REQUIRED PROCESS

Follow these steps in order. Show your work at each step in the final 
document — don't just give me conclusions, show me what you found.

## Step 1 — Full Codebase Audit (Ground Truth Extraction)

Before proposing anything, thoroughly analyze both repositories and produce:

1. **Feature Inventory**: Every distinct feature/capability you can identify
  from the actual code (controllers, models, services, routes, frontend 
   pages/components, background jobs) — including features not mentioned in 
   my context above that you discover.
2. **Implicit Business Rules & Edge Cases**: Go through the code (not just
  the happy path) and extract non-obvious logic — validation rules, 
   permission checks, state machines, edge-case handling (e.g., "what happens 
   when a forwarded message's original is deleted," "what happens to pinned 
   messages when a user leaves a group"). This is the most important step — 
   this is the tribal knowledge trapped in the code that must NOT be lost in 
   a rebuild.
3. **Current Schema Map**: Reverse-engineer the actual current DB schema
  (from `schema.rb`/migrations) into an ERD-style description — tables, 
   relationships, indexes, and flag anything that looks redundant, 
   denormalized oddly, missing indexes, or unused.
4. **Current Architecture Map**: Describe actual current architecture —
  Rails app structure (fat models? service objects? how are background jobs 
   handled? how is real-time implemented?), frontend structure (state 
   management approach, folder structure, API communication pattern).
5. **Current API Surface**: List all API endpoints and their contracts as
  they currently exist.
6. **Pain Point Confirmation**: Identify concrete code smells, anti-patterns,
  N+1 queries, god objects/files, tight coupling, or duplicated logic you 
   actually find — with file references.

Output this as `AUDIT_REPORT.md` (a separate file from the master plan).

## Step 2 — Target Architecture Research & Design

Using the audit as ground truth for *what must be preserved*, design the 
target state:

1. **Technology Stack Decision**: Explicitly evaluate whether to keep
  Rails + React + Postgres + Cloudflare or change any part of it. Justify 
   with reasoning specific to a chat app's needs (real-time delivery, 
   read-heavy message history, media handling, AI bot integration, 
   scalability). Don't change technology for novelty — only if there's a 
   strong case. Explicitly consider:
  - Real-time layer: ActionCable vs. dedicated solution (e.g., 
  Socket.IO service, or managed like Pusher/Ably) vs. Postgres LISTEN/
  NOTIFY vs. a separate lightweight real-time service
  - Background job processing (Sidekiq, etc.) for AI bot responses, media 
  processing, notification fanout
  - Whether a monolith Rails API remains appropriate or specific domains 
  (e.g., real-time messaging, AI bot orchestration) warrant separate 
  services
2. **Target Database Schema**: Propose a clean-slate schema design optimized
  for chat-app access patterns specifically. Address (at minimum):
  - Unified conversation model for 1:1 and group chats
  - Efficient read-receipt / last-read tracking (avoid per-message-per-user 
  rows exploding)
  - Message history pagination strategy (cursor-based)
  - Message edit history, soft-delete/unsend semantics
  - Media/attachment relationships with Cloudflare
  - Multi-account architecture (account switching, session isolation)
  - Bot/AI configuration and conversation-context storage
  - Privacy/visibility settings storage (flexible, extensible — consider 
  a settings/preferences pattern vs. many boolean columns)
  - Indexing strategy for the highest-frequency queries
3. **Target Backend Architecture**: Propose folder structure, layering
  (controllers/services/queries/serializers/jobs), conventions for where 
   business logic lives, error handling patterns, API versioning approach, 
   testing strategy (what should have unit vs. integration vs. system tests).
4. **Target Frontend Architecture**: Propose folder structure (feature-based
  modules), state management strategy (server state vs. client state 
   separation), component architecture, API client strategy (typed client 
   generation from backend, e.g., OpenAPI), real-time state sync pattern, 
   performance strategy (virtualization for message lists, code splitting, 
   optimistic updates for message send/edit/unsend actions).
5. **Design System & Premium UI/UX Direction**: Propose a concrete design
  system foundation:
  - Recommend a component/styling approach (e.g., Tailwind + shadcn/ui + 
  Radix primitives, or alternative) optimized for both premium look and 
  AI-agent-friendly implementation (well-documented, pattern-based 
  libraries)
  - Design tokens: color system (with light/dark mode from day one), 
  typography scale, spacing scale, radius/elevation scale, motion/
  animation principles
  - Reference points: name 2-3 existing best-in-class chat/consumer apps 
  whose specific UI/UX qualities we should draw from (and why), while 
  defining our own distinct visual identity — not a clone
  - Identify the highest-impact UI surfaces to redesign first (likely: 
  message thread/bubble design, sidebar/navigation, input composer, 
  settings screens) and what "premium" concretely means for each 
  (micro-interactions, empty states, loading states, transitions, sound/
  haptics where relevant)
6. **AI/Bot Architecture**: Given this app has AI-bot creation as a core
  feature, propose how bot prompt handling, conversation context, and 
   response streaming should be architected for reliability and extensibility 
   (e.g., streaming responses to frontend, provider abstraction if multiple 
   LLM providers might be used, rate limiting, cost control).



## Step 3 — Gap Analysis

Produce a clear diff: Current State → Target State, organized by domain 
(Auth, Messaging, Media, Bots/AI, Calls, Privacy/Settings, Real-time 
Infrastructure, Frontend Architecture, Design System). For each domain, 
state specifically what changes and why.

## Step 4 — Phased Master Plan

This is the core deliverable. Produce a phased roadmap that:

1. Sequences work to **minimize risk and maximize early visible progress**
  (I want to see premium UI improvements early, not just after months of 
   invisible backend refactoring)
2. Groups work into logical phases (e.g., Foundation & Tooling → Design
  System → Domain-by-domain backend + frontend rebuild → AI/Bot layer → 
   Calls → Polish & Performance → Launch Readiness)
3. For each phase, specify:
  - Goal and definition of done
  - Key deliverables
  - Dependencies on prior phases
  - Rough relative effort (S/M/L/XL — not calendar estimates, since this 
  will be executed with AI-agent assistance across sessions)
  - Risk level and specific risks to watch for
  - What existing features/edge cases from `AUDIT_REPORT.md` must be 
  verified as preserved in this phase
4. Explicitly recommend: should this be built as an entirely new pair of
  repos from scratch (given no backward-compatibility requirement), or 
   should it be an in-place incremental transformation of the existing 
   repos? Justify the recommendation with tradeoffs specific to this 
   project's size and feature complexity — don't default to either option 
   without reasoning through it.
5. Propose how work should be split across future AI-agent sessions (e.g.,
  "one session per domain, fed the relevant AUDIT_REPORT.md section + 
   CONVENTIONS.md + target architecture doc for that domain") so that 
   context stays scoped and manageable.
6. Include a recommended testing/verification strategy per phase so
  regressions are caught early (not just "trust the AI got it right").



## Step 5 — Supporting Documents to Generate

Alongside `MASTER_PLAN.md` and `AUDIT_REPORT.md`, also produce:

- `CONVENTIONS.md` — coding standards, naming conventions, folder structure 
rules, and architectural principles the target codebase must follow (so 
every future AI session stays consistent)
- `SCHEMA_DESIGN.md` — the full target database schema with rationale
- `DESIGN_SYSTEM.md` — the design tokens, component principles, and premium 
UX guidelines defined in Step 2.5

---



# OUTPUT FORMAT REQUIREMENTS

- All deliverables in Markdown, clearly structured with headers, tables 
where useful (especially for the phased plan and gap analysis)
- Be specific and concrete — avoid vague statements like "improve 
performance" or "make it more scalable" without specifying how and why
- Where you're making a judgment call between multiple valid approaches, 
briefly state the alternatives considered and why you chose what you chose
- Flag clearly anywhere you are uncertain or where you need my input/
decision before proceeding (e.g., "I found two different read-receipt 
implementations in the code — which is the intended current behavior?")
- Do not fabricate details about the codebase — if something is unclear from 
the code, say so explicitly rather than assuming

---



# GUARDRAILS

- Do not propose dropping any current feature silently — if you believe a 
feature should be cut or significantly changed, flag it explicitly as a 
recommendation for me to approve/reject, don't just omit it
- Do not recommend a full "reimplement from inspiration without reference" 
rewrite approach — the plan must be grounded in the actual extracted 
business logic and edge cases from Step 1, even if the target repos are 
new
- Favor well-established, widely-documented technology choices over exotic 
ones — this codebase will continue to be developed with heavy AI-agent 
assistance, and AI agents perform best with mainstream, well-documented 
stacks
- Keep the plan realistic for a single developer (me) operating with AI-agent 
assistance, not a large engineering team

---



# START

Begin with Step 1 (Full Codebase Audit). Produce `AUDIT_REPORT.md` first and 
present it to me before proceeding to Steps 2-5, so I can correct any 
misunderstandings before you build the target architecture and plan on top 
of it.
