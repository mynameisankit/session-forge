# Policies & Guarantees

**SessionForge owns the semantics. Database adapters own the mechanics. Both must preserve the contract.**

SessionForge is a database-agnostic session lifecycle engine. Its architecture separates the policies governing session behavior from the atomic persistence operations needed to uphold that behavior. A storage interface alone cannot make a lifecycle transition safe.

::: warning Design requirements, not verified guarantees
G1–G5 below describe the required correctness contract. They are not claims about the current v0.1.0 implementation. The SQLite adapter does not implement atomic rotation, the core has a fixed consumed-token revocation response rather than configurable reuse policy, and a shared concurrency conformance suite is not implemented. See [Current Implementation Gap](#current-implementation-gap).
:::

## Policies vs. Guarantees

A **policy** defines how SessionForge should respond to an event or state transition. A **guarantee**, or invariant, defines a property that must always hold, including under concurrent requests, transaction failures, and different database implementations.

For example, the core may decide to rotate an eligible refresh token R1 into R2. The adapter must ensure that consumption of R1 and creation of R2 form one safe transition. A preflight eligibility check followed by independent writes is insufficient.

| SessionForge Policy | Required Guarantee |
| --- | --- |
| Rotate valid refresh tokens | At most one rotation of a given token can succeed |
| Consume R1 when issuing R2 | Consumption and successor creation commit atomically |
| Revoke a token family upon detected reuse, according to configured policy | Revocation and concurrent rotation obey a well-defined ordering |
| Reject expired refresh tokens | Expired tokens cannot be successfully rotated |
| Revoke individual sessions | Rotations ordered after committed revocation must fail |

Choosing the response to suspected reuse is a core policy decision. Making the resulting persistence atomic and consistent is an adapter responsibility. Atomic rotation does not establish that a token was stolen or prevent theft on its own.

The table describes the intended separation, including policy configuration that does **not** exist today. Currently, validation of a consumed token immediately revokes its family. Policy selection, confirmed-reuse criteria, and conflict outcomes remain open design work.

## Five Core Guarantees

### G1 — At-Most-Once Consumption

**Definition:** A refresh token must not be successfully consumed more than once. At most one rotation of R1 can succeed, even when multiple requests execute concurrently.

**Why it matters:** Without exclusive consumption, two callers can both report success for the same credential and retain competing refresh capability.

**Failure scenario:** Server A and Server B both read R1 as unconsumed. Each writes a consumption timestamp and returns a successful rotation because neither mutation checks whether the other already consumed R1.

**Correct behavior:** One attempt wins. The losing attempt does not report successful consumption and receives the agreed domain outcome. The exact outcome is not yet defined in the current contract.

**Adapter responsibility:** Enforce eligibility and exclusive consumption within the synchronized persistence operation. A core check before the operation is insufficient. Use an appropriate locking, conditional-write, versioning, or equivalent mechanism.

### G2 — Atomic Rotation

**Definition:** Consuming R1 and creating its successor R2 commit together, or neither commits.

**Why it matters:** A consumed token without a successor strands the client; a successor without consumption leaves both credentials available for use.

**Failure scenario:** The adapter marks R1 consumed, then inserting R2 fails because the database becomes unavailable. The first write survives independently.

**Correct behavior:** Both state changes are committed as one operation. An aborted operation leaves R1 unconsumed and no committed R2 from that attempt.

**Adapter responsibility:** Own the transaction boundary or an equivalent atomic database operation spanning the domain transition. Do not expose a partially applied rotation as a successful result.

### G3 — Revocation Ordering

**Definition:** Once family revocation commits, no rotation ordered after that revocation may successfully commit for the same family.

**Why it matters:** A committed logout or family revocation must prevent later renewal; an earlier stale read must not authorize a later rotation.

**Failure scenario:** Server A checks that the family is active. Server B revokes the family and commits. Server A then consumes R1 and inserts R2 based solely on its earlier read, reporting rotation success after revocation.

**Correct behavior:** Rotation and revocation have a well-defined serialization order. If rotation is ordered first, it may commit, and subsequent family revocation covers its successor. If revocation is ordered first, rotation must fail. Request arrival or response timing alone does not establish that order.

**Adapter responsibility:** Coordinate the active-family check and token mutation with family revocation. Token-level synchronization that ignores the family state is insufficient. The database-specific mechanism can vary, but the observable ordering must preserve this invariant.

### G4 — Single-Successor Invariant

**Definition:** Every refresh token has at most one successfully committed successor. R1 must not branch into both R2 and R3.

**Why it matters:** A linear token history makes rotation and replay semantics meaningful. Branches can leave multiple independently usable credentials after one rotation step.

**Failure scenario:** Competing or retried operations each insert a replacement for R1. Distinct token hashes satisfy the table's token-hash uniqueness constraint, so both rows commit.

**Correct behavior:** At most one successor of R1 exists as a committed token. A losing attempt leaves no committed extra successor.

**Adapter responsibility:** Enforce predecessor-to-successor uniqueness within the atomic transition, through constraints or another valid concurrency mechanism. Unique successor token hashes alone do not enforce a unique successor **per predecessor**.

G1 concerns successful **consumption** of R1. G4 concerns **successor uniqueness** in persisted history. They are related but distinct: an implementation could record consumption once and still insert two successors through a retry or another write path. Both properties must hold.

### G5 — Failure Atomicity

**Definition:** If a rotation fails and its database transaction rolls back, R1 remains unconsumed and R2 does not exist as a committed token from that attempt.

**Why it matters:** Failed storage operations must not silently destroy a valid credential or leave a partial successor behind.

**Failure scenario:** A transaction consumes R1 and starts creating R2, then a constraint failure or injected storage fault forces rollback.

**Correct behavior:** After rollback, both the consumption and successor insertion are absent. R1 is eligible for another attempt unless an independent concurrent operation has changed or revoked its state.

**Adapter responsibility:** Roll back the entire transition on failure and expose failure through the agreed error contract. Verify persisted state after failure; an exception alone is not evidence of rollback.

G2 defines the all-or-nothing transition. G5 specifies the state visible after an aborted transition. Neither implies rollback after a **successful commit**: a lost HTTP response can leave R1 consumed and R2 committed even though the client received no replacement.

## Ownership Boundaries

The matrix describes architectural responsibilities. It does not imply that every listed facility exists in the current core or adapter.

| Responsibility | SessionForge Core | Database Adapters |
| --- | --- | --- |
| Lifecycle semantics | Define what creation, rotation, expiration, and revocation mean | Persist transitions without changing their meaning |
| Reuse and revocation policy | Determine the response and revocation scope | Execute the requested transition consistently |
| Valid state transitions | Specify eligibility and permitted transitions | Recheck storage-dependent eligibility at the atomic boundary |
| Policy configuration | Define and validate supported configurations | Honor the selected policy contract without inventing policy |
| Outcomes and errors | Define domain-level success, rejection, conflict, and failure semantics | Translate storage-specific results into those agreed outcomes |
| Atomic operations | Specify required invariants | Own transaction boundaries and atomic domain-level persistence |
| Concurrency and constraints | Specify externally observable safety guarantees | Implement database-specific synchronization and relevant constraints |
| Conformance | Specify the shared correctness contract and test expectations | Pass the same contract tests against the real database |

SessionForge does not prescribe row-level locks, conditional updates, optimistic concurrency, or any particular storage mechanism. A different mechanism is acceptable if it delivers the same externally observable safety guarantees across application instances sharing a database. An in-process lock in one server is not sufficient coordination for multiple servers.

The core can check policy before calling the store, but storage-dependent facts can change afterward. Adapters must enforce those facts at the operation's synchronization point, including token consumption, expiration eligibility, and family revocation. The precise time/clock rule for expiration at this boundary still needs specification; a preflight check must not be treated as a concurrency guarantee.

## Concurrency Walkthrough

Two application instances receive the same R1. The following is the **required behavior**, not the current SQLite implementation. Server A is shown as the winner only for illustration.

```text
Server A                    Shared adapter / database                 Server B
   |                                   |                                 |
   |-- attempt R1 → R2 ---------------->|<---------------- attempt R1 → R3 --|
   |                                   |                                 |
   |                       Coordinate eligibility, consumption,          |
   |                       and successor creation atomically             |
   |                                   |                                 |
   |<-- committed: R1 consumed, R2 -----|                                 |
   |                                   |-- losing attempt: no R3 -------->|
   |                                   |   agreed domain outcome         |
   |                                   |                                 |
   |                         Core applies reuse/conflict policy          |
```

The adapter commits at most one successor. The losing attempt receives a defined domain outcome rather than a second rotation success. SessionForge then applies its selected policy to that outcome. The exact conflict outcome and policy configuration are unresolved; this diagram does not add a new API or enum value.

An unsuccessful concurrent rotation does **not** automatically prove credential theft. Two legitimate browser tabs, overlapping refresh requests, or a retry after a lost response can present the same token. Whether the losing attempt should trigger family revocation is a separate policy decision. Today, a consumed-token validation revokes the family, while a race passing both preflight checks has no defined conflict outcome.

## Guarantees vs. Limitations

- **Database atomicity is not delivery atomicity.** The database can commit R1 → R2 while the HTTP response carrying R2 is lost.
- **Network failures can make the result ambiguous.** A caller that times out may not know whether the transaction committed. An error observed outside the transaction does not prove rollback; blind retries need an explicit design.
- **Legitimate retries and attacker replay can look identical.** Presenting consumed R1 alone does not establish who sent the request or why.
- **An idempotency window is not proof of legitimacy.** Time proximity alone does not securely bind a retry to the original request.
- **Returning R2 to anyone presenting consumed R1 can be unsafe.** An attacker holding R1 could obtain the current credential. Any recovery mechanism needs its own request-binding and authorization design.
- **Access-token revocation remains separate.** Stateless access tokens can remain usable until expiration after a refresh family is revoked unless the application adds validation or revocation mechanisms.

Atomic rotation prevents inconsistent storage transitions; it does not by itself establish protection against token theft or solve safe recovery after lost responses.

## Current Implementation Gap

The source currently checks eligibility in `SessionForge.validateRefreshToken()`, then calls `SessionStore.consumeAndReplace()`. The adapter call receives token hashes and timestamps, returns `Promise<void>`, and has no structured conflict result.

| Requirement or facility | Current evidence and gap |
| --- | --- |
| G1: at-most-once consumption | SQLite updates by token hash without a conditional unconsumed check. Concurrent preflight checks can both pass. |
| G2: atomic rotation | SQLite consumption and successor insertion are separate statements without a rotation transaction. |
| G3: revocation ordering | Family state is checked before mutation, without synchronization with revocation at the write boundary. |
| G4: single successor | Distinct token hashes are unique, but there is no predecessor-successor constraint or atomic transition enforcing one successor of R1. |
| G5: failure atomicity | A failed successor insertion can leave the prior consumption committed; rotation has no transaction spanning both writes. |
| Reject expired rotation | Core preflight rejects invalid or elapsed expiration. The adapter does not recheck expiration at the mutation boundary, so that check does not establish the required synchronized guarantee. |
| Reuse policy configuration | Consumed-token validation immediately revokes the family. There is no configurable reuse response or confirmed-reuse classification. |
| Domain conflict/error contract | `consumeAndReplace()` returns `Promise<void>`; storage errors propagate. Agreed race-conflict and retry outcomes are not specified. |
| Policy validation | The constructor assigns `store` and `expiryTTL` directly. Retention validation exists for cleanup, but general policy configuration validation does not. |
| Shared adapter conformance | Existing tests do not establish a shared concurrency/rollback contract suite. |

The [SessionStore API](../reference/session-store) documents the current interface; it must not be read as proof that implementing its method signatures satisfies these invariants. No runtime or storage behavior is changed by this documentation.

## Adapter Conformance Expectations

Every database adapter must pass the same shared contract suite before being considered compatible with this correctness contract. The scenarios below are **proposed test expectations**, not a claim that such a suite currently exists or that the SQLite adapter passes it.

Run them against real databases with independent connections and coordinated overlapping operations. Sequential happy-path tests and one-instance mocks cannot establish cross-instance concurrency behavior.

| Proposed scenario | Required assertions |
| --- | --- |
| Concurrent rotations of R1 | Release competing attempts together. At most one succeeds; the loser receives the agreed domain outcome and leaves no committed successor. |
| Rollback during successor creation | Inject failure after consumption but before commit. After rollback, R1 is unconsumed and no R2 from that attempt exists. |
| Concurrent rotation and family revocation | Exercise both controlled orderings. Rotation ordered after committed revocation fails; revocation ordered after rotation covers the successor. |
| Prevention of multiple successors | Inspect committed history after contention and retries. There is at most one successor per predecessor, not merely unique token hashes. |
| Expired-token rotation | Reject tokens expired at the agreed eligibility boundary. Assert no consumption or successor mutation, including when time elapses after preflight. |
| Multiple application instances | Repeat race scenarios through separate instances/connections sharing the database. Verify the same outcomes without relying on a process-local lock. |

Existing root tests cover token utilities, password utilities, cleanup cutoff delegation, and invalid retention. The SQLite example includes authentication, revocation, persistence, and cleanup integration tests, but its documentation explicitly excludes concurrency guarantees. Those checks are useful evidence for their own scope; they are not the proposed conformance suite.

## Open Design Questions

The following questions remain unresolved. This page does not select retry handling, revocation scope, conflict types, or a database mechanism.

1. What exactly constitutes confirmed refresh-token reuse, and how does it differ from overlap or an ambiguous retry?
2. Should legitimate retries receive special handling?
3. How should idempotent retry requests be securely bound to the original request?
4. What revocation scope should apply after suspected reuse: token, family, user, or another boundary?
5. How should adapters expose transaction conflicts and retriable errors as agreed domain outcomes?
6. Which guarantees should be mandatory for every supported database, and how should unsupported behavior be surfaced?

G1–G5 are the correctness requirements described here; formal adapter compatibility criteria and the resolution of these questions still need owner-led decisions. The repository's `docs/decisions/` workflow records such choices as ADRs. No accepted ADR or new runtime guarantee is created by this page.
