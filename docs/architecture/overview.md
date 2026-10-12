# Architecture overview

**Design status:** TODO. This page is a scaffold, not an accepted architecture or
a description of verified implementation.

## Scope and responsibilities

The project goal is database-agnostic session management spanning PostgreSQL,
MongoDB, SQLite, and potentially other databases.

TODO: Define the library's responsibilities and the responsibilities of consuming
applications. Record supported use cases and explicit scope boundaries.

## Components and trust boundaries

TODO: Identify components, callers, data flows, and trust boundaries after they
are decided. Link the [threat model](../threat-model.md). Add a diagram only when
the boundaries it depicts have been established.

## Persistence and portability

TODO: Define the storage abstraction and required behavior across databases.
Document required guarantees, optional capabilities, and how unsupported
capabilities are communicated. Link ADRs that establish these requirements.

TODO: Document each adapter's implementation status and evidence of conformance;
do not infer support from the project goal or an example.

## Behavior and guarantees

TODO: Document API responsibilities, consistency requirements, error behavior,
concurrency guarantees, and operational constraints once decided.

See [token lifecycle](token-lifecycle.md) for the lifecycle questions to resolve.

## Related decisions

TODO: Link relevant [ADRs](../decisions/README.md) when recorded. No architecture
decisions are established by this scaffold.
