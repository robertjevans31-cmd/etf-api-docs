---
title: How Freshness Works
description: asOfDate, fetched_at, freshness_status, and source_mode — how they fit together and why it matters.
---

# How freshness works

This is the single most important concept for building something
trustworthy on top of this API. Four fields work together to answer one
question honestly: **"how current and how reliable is this specific
response, right now?"**

## The four fields, together

| Field | Answers |
|---|---|
| `asOfDate` | What date does the issuer say this data is *for*? |
| `fetched_at` | When did this server actually retrieve it from the issuer? |
| `freshness_status` | Is that `asOfDate` within the normal cadence for this issuer? |
| `source_mode` | Did this response come from a live fetch, or a cached fallback? |

They're independent axes on purpose. An issuer can be perfectly reachable
(`source_mode: "primary"`) while its own disclosed data is old
(`freshness_status: "stale"`) — that's an issuer publishing behind
schedule, not a problem with reaching them. Conversely, a live fetch can
fail entirely while a recent, perfectly valid cached copy is served
instead (`source_mode: "last_known_good"`, `freshness_status:
"source_unavailable"`).

## `freshness_status` values

- **`fresh`** — `asOfDate` is within the normal cadence for this issuer.
- **`issuer_delayed`** — running behind normal cadence but not yet stale.
  The line sits at 75% of the issuer's staleness threshold, scaled per
  issuer rather than a fixed day count.
- **`stale`** — `asOfDate` has exceeded the issuer-specific staleness
  threshold: **4 days by default**, **50 days for Vanguard (VOO)** — see
  [Coverage](/coverage) for why Vanguard specifically needs a much looser
  threshold (it discloses monthly, not daily).
- **`source_unavailable`** — the live fetch just failed, and this response
  is the last successful fetch served from cache instead of failing the
  request outright.

## `source_mode` values

- **`"primary"`** — a live fetch just succeeded, or this is a cache hit
  still within its normal 5-minute TTL.
- **`"last_known_good"`** — the live fetch just failed, and this is an
  older cached response being served instead. This is the same underlying
  condition `freshness_status: "source_unavailable"` flags — `source_mode`
  is the field that actually names *how* the response was sourced.
- **`"secondary"`** — reserved for when a validated, genuinely independent
  secondary source exists for an issuer. **Not currently emitted by any
  issuer** — see [Known limitations](/limitations#no-issuer-has-a-validated-secondary-source) for why.

## The bounded last-known-good cache

A cache entry is never evicted purely for being past its normal 5-minute
TTL — that's precisely so it can still serve as a last-known-good fallback
if a later live fetch fails. But that fallback is **bounded**, not
unlimited: once the cached data itself would already be flagged
`freshness_status: "stale"` on a fully successful fetch, it's no longer
served at all. Instead, the request fails outright with `503` and
`code: "STALE_SOURCE"` — see the [Error reference](/errors).

Critically, that cutoff is **calendar-aware, not a flat wall-clock
timer**. It reuses the exact same per-issuer staleness-day threshold as
`freshness_status` itself — so a fund's perfectly valid Friday data stays
servable through the weekend and into Monday morning, only actually
hard-failing once the issuer would genuinely have been expected to publish
a new file and hasn't. An earlier version of this cutoff used a flat
48-hour wall-clock cap, which didn't know about weekends and could
hard-fail on an ordinary Monday morning purely because ~48-60 hours had
passed since Friday's fetch — fixed once this was noticed, precisely
because a flat timer isn't how "has this issuer actually missed a
publication" should be measured.

## `age_minutes`

How many minutes old the underlying fetch is, computed fresh on every
response rather than baked in at fetch time — this is "the effective age
of the data being served," regardless of whether `source_mode` is
`"primary"` or `"last_known_good"`.

## Putting it together: reading a response

```json
{
  "asOfDate": "2026-09-15",
  "fetched_at": "2026-09-16T14:03:11.482Z",
  "age_minutes": 2.3,
  "freshness_status": "fresh",
  "source_mode": "primary"
}
```

This reads as: *the issuer's own file is dated September 15th, we fetched
it 2.3 minutes ago via a live request that succeeded, and that date is
within this issuer's normal publishing cadence.* Nothing here is a guess —
every one of these four fields is either read directly from the response
or computed deterministically from real timestamps.

See the [Response field reference](/fields) for every field this API
returns, and [Known limitations](/limitations) for the honest boundaries
around what freshness and provenance can and can't tell you.
