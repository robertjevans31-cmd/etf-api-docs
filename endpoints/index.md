---
title: Endpoint Overview
description: Conventions shared by every /v1/ endpoint in the ETF Holdings API.
---

# Endpoints

All endpoints require an `X-Api-Key` header (see [Getting started](/getting-started)) and live under the versioned `/v1/` prefix. Unversioned paths without `/v1` still work as a deprecated alias — see the [API versioning policy](/reference/versioning).

| Endpoint | What it answers |
|---|---|
| [`GET /v1/holdings/:ticker`](/endpoints/holdings) | "What does this one fund currently hold?" |
| [`GET /v1/holdings?tickers=...`](/endpoints/bulk) | The same question for up to 25 tickers in one call. |
| [`GET /v1/holdings/:ticker/changes`](/endpoints/changes) | "What changed in this fund's holdings since the last time it was captured?" |
| [`GET /v1/exposure/:symbol`](/endpoints/exposure) | The reverse question: "which funds have exposure to this symbol, and how?" |

## Conventions used in every example on this site

Every code example on this site is shown for three genuinely different
kinds of funds, so the parts of the API that differentiate it from a plain
holdings mirror are visible immediately, not just the easy case:

- **A plain equity ETF** — `SPY` (SPDR S&P 500 ETF Trust). `strategy` and
  `targetExposure` are `null`; every holding is a simple `EQUITY` position.
- **A leveraged/inverse fund** — `RAM`/`RAMZ` (REX Shares' 2x long/inverse
  DRAM funds) or `TQQQ` (ProShares' 3x long Nasdaq-100 fund). `strategy`
  and `targetExposure` are populated, and holdings may include `SWAP`
  positions.
- **A covered-call / option-income fund** — `QYLD` (Global X Nasdaq 100
  Covered Call ETF). Holdings include `OPTION`-type positions carrying a
  structured `optionDetail`.

## Shared response fields

Every successful `/v1/holdings*` response — single-ticker, bulk, and
changes alike — carries the same freshness/provenance envelope
(`asOfDate`, `source`, `fetched_at`, `age_minutes`, `freshness_status`,
`source_mode`) on top of the endpoint-specific data. See
[How freshness works](/freshness) for what each one means and
[Response field reference](/fields) for the complete field list.

## Errors

Every error response, on every endpoint, carries a stable `code` field
alongside a human-readable `error` message. See the full
[Error reference](/errors).
