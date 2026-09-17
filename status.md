---
title: API Status
description: Live status page — coming soon.
---

# API status

::: info Coming soon
A dedicated, public status page (live uptime, per-issuer source health,
and incident history) is being built next. This page is a placeholder for
that link — once it's live, it will replace this notice directly, so this
URL will keep working.
:::

## What the status page will show

This API already runs internal, continuous health monitoring against
every registered issuer — checking that each one's feed is reachable,
returning a non-empty holdings list, reporting a plausible row count
day-over-day, and disclosing a fresh, parseable `asOfDate` (see
[How freshness works](/freshness) for the freshness concepts this reuses).
The status page will surface that existing monitoring publicly:

- Overall API availability.
- Per-issuer source health (last successful check, current status).
- Whether any issuer is currently serving from `source_mode:
  "last_known_good"` rather than a live fetch.
- Recent incident history.

## In the meantime

- Every API response already tells you its own freshness and sourcing
  directly — see [How freshness works](/freshness) — so you don't need a
  separate status page to know whether a *specific response* is current.
- For a live signal on the API's general availability, `GET /` (no
  authentication required) responds with basic service info whenever the
  API itself is up.
