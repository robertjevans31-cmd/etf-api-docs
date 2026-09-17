---
title: Error Reference
description: The full stable, machine-readable error code list for the ETF Holdings API.
---

# Error reference

Every error response, across every endpoint, carries a stable,
machine-readable `code` field alongside a human-readable `error` message —
so you can branch on `code` (e.g. "retry later" for an `UPSTREAM_*` code
vs. "fix your request" for `INVALID_REQUEST`) without parsing message
text, which is free to reword without that being a breaking change.

## Error shape

```json
{
  "error": "Unsupported ticker \"NOTREAL\"",
  "code": "UNSUPPORTED_TICKER",
  "supportedTickers": ["SPY", "QQQ", "..."]
}
```

For the bulk and reverse-exposure endpoints, a per-ticker failure appears
as an entry in an `errors[]` array instead of failing the whole request —
see [bulk](/endpoints/bulk#partial-failure) and
[exposure](/endpoints/exposure).

## Full code list

| Code | Meaning | Where it appears |
|---|---|---|
| `MISSING_API_KEY` | No `X-Api-Key` header was sent. | `401`, any endpoint |
| `INVALID_API_KEY` | The key doesn't match any known key. | `401`, any endpoint |
| `RATE_LIMIT_EXCEEDED` | Your tier's rate limit was hit. | `429`, any endpoint |
| `INVALID_REQUEST` | The request itself is malformed (e.g. bulk's `tickers` param missing/empty). | `400`, bulk `/v1/holdings` |
| `TOO_MANY_TICKERS` | A bulk request exceeded the max tickers per call (25). | `400`, bulk `/v1/holdings` |
| `UNSUPPORTED_TICKER` | The ticker isn't in this API's own registry at all. | `404` (single-ticker, changes), or an `errors[]` entry (bulk) |
| `UPSTREAM_NOT_FOUND` | The ticker IS registered, but the issuer's own site 404s for it (a delisted fund, a moved URL). | `502`, or an `errors[]` entry |
| `UPSTREAM_5XX` | The issuer's site returned a 5xx. | `502`, or an `errors[]` entry |
| `UPSTREAM_TIMEOUT` | A network-level failure (timeout, connection reset, DNS failure) that never reached an HTTP response at all. | `502`, or an `errors[]` entry |
| `UPSTREAM_ERROR` | Some other, unclassified upstream HTTP failure (a 4xx other than 404). | `502`, or an `errors[]` entry |
| `PARSER_ERROR` | The fetch succeeded, but what came back didn't have the expected shape (a missing table, an empty file, a ticker absent from an issuer's own listing). | `502`, or an `errors[]` entry |
| `STALE_SOURCE` | The live fetch failed and the last-known-good cache being considered as a fallback is old enough to have missed an expected publication — see [How freshness works](/freshness#the-bounded-last-known-good-cache). | `503`, or an `errors[]` entry |

## Auth errors

| Situation | Response |
|---|---|
| Header missing | `401` — `{ "error": "Missing X-API-Key header", "code": "MISSING_API_KEY" }` |
| Header present but not a known key | `401` — `{ "error": "Invalid API key", "code": "INVALID_API_KEY" }` |

## Rate limit error

```json
429
{
  "error": "Rate limit exceeded: the \"free\" tier allows 90 requests per rolling 24 hours",
  "code": "RATE_LIMIT_EXCEEDED",
  "tier": "free",
  "limit": 90,
  "retryAfter": "2026-09-15T03:12:00.000Z"
}
```

See [Rate limits & tiers](/rate-limits) for the full tier table and what
`retryAfter` actually means.

## `STALE_SOURCE` is not the same as ordinary staleness

`freshness_status: "stale"` on a `200` response is **advisory metadata** —
an issuer simply publishing behind its normal cadence isn't an error (a
fund whose issuer posts holdings monthly, like Vanguard, isn't "broken"
the other 29 days). `STALE_SOURCE` is a narrower, genuinely different
condition: a live fetch **failed**, and the cached fallback under
consideration is *also* old enough that serving it would be dishonest. See
[How freshness works](/freshness) for the full mechanics.

## How upstream failures are classified

Two adapters with observed live flakiness (REX Shares, ProShares) throw
typed errors carrying a real HTTP status, classified precisely. Every
other adapter is classified from the consistent `"HTTP <status>"` text
convention every issuer adapter's own error message uses. A message with
no HTTP status in it at all (a structural parsing problem, or an
issuer-specific "not found in our own listing" condition) is honestly
bucketed as `PARSER_ERROR` rather than guessed at a more specific code.
