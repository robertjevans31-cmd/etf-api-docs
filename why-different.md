---
title: Why This Data Is Different
description: Direct issuer sourcing, honest freshness labeling, and conservative normalization — the real case for this API.
---

# Why this data is different

Most ETF data you'll find is one of three things: a stale SEC filing
(quarterly, sometimes months old by the time it's published), a
third-party aggregator that's already re-derived and re-labeled the data
(adding a layer you can't verify), or a paid terminal feed priced for
institutions. This API is none of those. Here's what's actually different
about it, and why each choice was made deliberately.

## 1. Direct issuer sourcing, not stale filings or aggregators

Every response is normalized straight from **the issuer's own published
file or feed**, fetched at request time (or served from a short-lived
cache) — a public `.xlsx`/`.csv` file, a public JSON endpoint, or, where
that's genuinely the only real option, the issuer's own server-rendered
holdings page. Fourteen issuers are integrated this way today (see
[Coverage](/coverage)), and every adapter's `sourceUrl` field points at
the exact resource the data came from — nothing here is re-derived from a
third party's own re-publication of it.

## 2. Every instrument type, normalized the same way

A plain equity basket (SPY), a swap-based 2x leveraged fund (RAM), a
futures-based volatility fund (UVIX), and a covered-call option-income
fund (QYLD) all come back through the **same** `holdings` schema — a
`type` field (`EQUITY`/`BOND`/`CASH`/`SWAP`/`FUTURE`/`OPTION`/`OTHER`)
distinguishes them, rather than each instrument type needing its own
endpoint or response shape. On top of that shared schema, this API adds
structured enrichment specific to what actually makes each fund type
different:

- Leveraged/inverse funds get a `strategy` and `targetExposure` derived
  from the issuer's own **stated investment objective text** — not
  inferred from current holdings, which (see below) can be actively
  misleading for a swap-based fund.
- Option-income funds get a structured `optionDetail` per position —
  underlying, put/call, strike, expiration, side — parsed from the
  position's own disclosed contract string, never assumed from which fund
  holds it.

## 3. Conservative `null`/`unknown` behavior over guessing

This is the discipline that took the most real work to get right, because
it's the opposite of what's easy: whenever the source data genuinely
doesn't say something, this API says so, rather than filling the gap with
a plausible-looking default.

The clearest example is a real bug this project found and fixed in
itself. An early version of the underlying-classification logic defaulted
an unrecognized, ticker-shaped underlying to `type: "stock"` — reasonable-
sounding, and **definitively wrong** for a real fund whose leveraged
target was actually another ETF, not an operating company. The fix wasn't
a better guess — it was removing the guess entirely: `type` is now only
ever set when the issuer's own text explicitly says what the ticker
represents, and falls back to `"unknown"` otherwise. The same standard
applies throughout — `strategy.confidence: "unknown"` when a fund's name
alone suggests a leveraged product but nothing supports a confident read
of the actual multiple/direction, `expiration: null` on an option position
when the disclosed date is garbled rather than a best-effort parse, and
`side: null` when neither the position's quantity sign nor its wording
gives any real signal. A `null` or `"unknown"` from this API is a
statement about the source data, not a bug.

## 4. The RAM/RAMZ exposure-methodology investigation

Rather than assume a leveraged fund's disclosed swap holdings could be
used to calculate its real current exposure, this project actually
**investigated** whether that's true — reading REX Shares' own prospectus
and SAI, and reconciling live disclosed holdings against each fund's
stated objective. The finding: the disclosed swap column is labeled "Net
Value," which the prospectus itself distinguishes from the "notional
amount" that a leverage target is actually defined against — and
reconciling live data confirms the numbers don't line up (RAM's swaps net
to +90.78% against a stated +200% target; RAMZ's net to +2.86% against a
**-200%** target — the wrong sign entirely). Building an "observed
exposure" calculator on top of that data anyway would have produced a
number that looks authoritative and is actually wrong. This API instead
documents the limitation explicitly (`observedExposureStatus:
"not_calculable_from_disclosed_holdings"`) — see the full writeup in
[Known limitations](/limitations#ram-ramz-observed-exposure-isn-t-calculable).
That's the standard applied everywhere in this API: a documented "we
checked and it doesn't work" beats a plausible number nobody verified.

## 5. Honest fallback and cache labeling

Every response tells you not just *what* the data is, but *how* it was
obtained, via `source_mode` (`"primary"` vs. `"last_known_good"`) sitting
alongside `freshness_status` and `age_minutes` — see
[How freshness works](/freshness). When an issuer's site goes down, this
API can serve a recent last-known-good cached copy rather than failing
outright, but that fallback is **bounded**: it reuses the same
calendar-aware, per-issuer staleness logic that governs ordinary
freshness, so it survives a normal weekend without incident but refuses
to keep serving data once an issuer has genuinely missed an expected
publication — failing loudly (`503`, `code: "STALE_SOURCE"`) instead of
quietly serving week-old data as if it were current. Before building that
fallback logic, this project also investigated whether any issuer had a
genuinely independent secondary source worth falling back to first — see
[Known limitations](/limitations#no-issuer-has-a-validated-secondary-source)
for what was actually found (short version: nothing qualified yet, and
that's stated plainly rather than implied otherwise).

## The pattern underneath all of this

Every claim on this page is backed by something checkable — a real
prospectus excerpt, a real reconciliation against live data, a real bug
that was found and fixed, a real investigation that came back negative and
was documented as such rather than quietly dropped. That's the actual
product: not just holdings data, but holdings data you can trust the
edges of, because the edges were checked.
