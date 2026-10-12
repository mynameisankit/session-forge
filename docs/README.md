# SessionForge documentation

SessionForge aims to provide database-agnostic session management for PostgreSQL,
MongoDB, SQLite, and potentially other databases. This describes the project scope,
not a guarantee of implemented adapter support.

This documentation separates architecture descriptions from the reasoning behind
decisions. Unresolved design choices are marked `TODO`; they are not commitments.
Existing examples and proposals do not constitute accepted ADRs.

- [Architecture overview](architecture/overview.md): responsibilities, boundaries,
  and database portability questions.
- [Token lifecycle](architecture/token-lifecycle.md): lifecycle questions and
  behavior to document once decided.
- [Architecture Decision Records](decisions/README.md): workflow and decision index.
- [ADR template](decisions/template.md): prompts for reasoning through a decision.
- [Threat model](threat-model.md): assets, threats, and unresolved security questions.

When a decision is accepted, link its ADR from the relevant architecture or threat
model section. Keep those pages aligned with accepted decisions and distinguish
intended behavior from verified implementation.
