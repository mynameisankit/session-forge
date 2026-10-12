# Architecture Decision Records

ADRs preserve why a significant architectural choice was made, including the
alternatives, constraints, and trade-offs. They are a reasoning aid, not a mechanism
for choosing an approach automatically. The project owner makes and accepts
architectural decisions.

Use an ADR for choices that affect behavior, security, correctness, database
portability, or long-term maintenance. Keep each record focused on one decision;
routine implementation details do not need a record.

## Creating a record

1. Copy [template.md](template.md) to `XXXX-short-decision-title.md` in this directory.
   Use the next unused four-digit number, starting at `0001`; do not reuse numbers.
2. Set the matching title (`ADR-XXXX: Decision title`), date (`YYYY-MM-DD`), and
   status (`Proposed`). Replace prompts with your reasoning, or explicit TODOs.
3. Describe the problem and drivers before comparing alternatives. Record benefits
   and drawbacks fairly, including retaining the current approach when relevant.
4. Leave the Decision section unresolved until you select an approach. Discuss
   security, failures, assumptions, and remaining questions before acceptance.
5. When the project owner accepts the decision, set its status to `Accepted`,
   record the acceptance date in the history, update the index below, and link it
   from the relevant documentation.

## Status and maintenance

- **Proposed:** under consideration; no accepted decision yet.
- **Accepted:** selected by the project owner; implementation may still be pending.
- **Deprecated:** no longer applicable, without a replacement decision.
- **Superseded:** replaced by another ADR; link the replacement in the status field.

Keep accepted reasoning as a historical record. For a materially different choice,
write a new ADR, mark the old one Superseded, and link both records to each other.
Small clarifications can be edited in place; note meaningful changes in the history.
Update the index when a record is added or its status changes.

## Decision index

No ADRs have been recorded. The template is not a decision record.

| ADR | Title | Status | Date |
| --- | --- | --- | --- |

TODO: Add a linked row when the first proposed ADR is created.
