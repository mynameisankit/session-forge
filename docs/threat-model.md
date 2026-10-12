# Threat model

**Status:** TODO. This is an analysis scaffold; no mitigations or security
guarantees are established here. Record evidence and unresolved risks explicitly.

## Scope and assets

TODO: Define what is being assessed, the deployment context, and scope exclusions.
Identify sensitive assets, their owners, and the impact of disclosure, modification,
loss, or unauthorized use.

## Actors and trust boundaries

TODO: Identify legitimate actors, potential attackers, their capabilities, and
access assumptions. Map entry points, data flows, and trust boundaries using the
[architecture overview](architecture/overview.md) once those are established.

## Threat analysis

TODO: Assess threats against the chosen architecture. The prompts below are
starting points for investigation, not assertions about implemented behavior:

- Credential theft, replay, or unintended disclosure through storage or logs.
- Unauthorized session access, modification, or revocation.
- Concurrent operations and partial failures that violate selected guarantees.
- Availability loss, resource exhaustion, or database outages.
- Differences between database guarantees that affect security behavior.

For each applicable threat, add a row with a concrete scenario. A proposed
mitigation must remain labeled proposed until decided, and must not be described
as implemented without evidence.

| Threat scenario | Asset and boundary | Impact | Mitigation and status | Residual risk or open question | ADR or verification evidence |
| --- | --- | --- | --- | --- | --- |
| TODO | TODO | TODO | TODO: Unresolved | TODO | TODO |

## Assumptions and dependencies

TODO: Record security assumptions, external dependencies, and responsibilities
of the library, applications, and deployment operators. Identify how assumptions
will be validated and what changes would invalidate them.

## Open questions and review triggers

TODO: Identify unanswered security questions and risks requiring an explicit
owner decision. Link relevant [ADRs](decisions/README.md).

TODO: Define when this model should be reviewed, including relevant changes to
trust boundaries, lifecycle behavior, adapters, and deployment assumptions.
