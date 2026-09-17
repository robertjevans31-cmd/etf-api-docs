---
title: Known Limitations
description: The honest, documented boundaries of the ETF Holdings API — stated plainly, not buried in prose.
---

# Known limitations

This page exists because every limitation below was a real, investigated
finding — not a guess, and not something quietly left undocumented. Where
a limitation has a full investigation behind it, this page links to it.

## RAM/RAMZ: observed exposure isn't calculable

For any leveraged/inverse fund, this API can tell you what the issuer's
**stated objective** is (`targetExposure` — e.g. "2x long DRAM, daily
reset"). It deliberately does **not** attempt to calculate a fund's
*actual current* exposure from its disclosed holdings:

```json
{ "observedExposure": null, "observedExposureStatus": "not_calculable_from_disclosed_holdings", "reason": "issuer_discloses_swap_net_value_but_not_swap_notional" }
```

This was investigated directly, not assumed. REX Shares' own prospectus
and SAI explicitly distinguish a swap's **"notional amount"** (real
exposure — what the daily 200%/-200% target is actually defined against)
from its **"net amount"** (current mark-to-market obligations/rights — a
different number the prospectus itself says isn't the same as notional).
The holdings table's own disclosed column is labeled **"Net Value"**,
matching that "net amount" language, not "notional amount." Reconciling
real, live current holdings against each fund's stated objective confirms
it in practice: RAM's swap rows net to **+90.78%** against a **+200%**
target, and RAMZ's net to **+2.86%** against a **-200%** target — the
wrong sign, not just short of magnitude. Calculating a number from that
data and presenting it as "current exposure" would be actively misleading,
not just imprecise, so this API doesn't.

`reason` is chosen based on the fund's *actual current* holding types, not
applied as one blanket claim across every leveraged fund:

- `issuer_discloses_swap_net_value_but_not_swap_notional` — used only when
  the fund's current holdings actually contain `SWAP`-classified
  positions (RAM, RAMZ today) — the exact instrument this investigation
  examined.
- `exposure_methodology_not_yet_validated_for_issuer` — used for every
  other leveraged/inverse fund (ProShares'/Direxion's funds, which hold
  direct `EQUITY` positions with no swaps at all; Volatility Shares'
  UVIX, which uses `FUTURE` positions instead). No equivalent
  investigation has been done for those disclosure conventions yet, so
  claiming the identical swap-specific finding for them would be an
  unverified guess, not a documented one.

## No option-delta (or any Greeks) calculation

Option positions are normalized structurally — underlying, put/call,
strike, expiration, side — but this API does **not** compute delta,
theta, implied volatility, or any other options-pricing Greek. Doing so
correctly requires a live options-pricing feed (spot price, implied vol
surface, risk-free rate) this API doesn't have and isn't in scope to
build. If you need Greeks, treat `optionDetail`'s structural fields as the
input to your own pricing model, not a replacement for one.

## No issuer has a validated secondary source

Every issuer's fallback chain is `primary fetch → bounded last-known-good
cache → hard failure`, with no secondary-source layer. This is a stated
finding, not an oversight: four issuers with real, observed fragility
(First Trust, ProShares, Volatility Shares, REX Shares) were specifically
investigated for a genuine alternate holdings source before anything was
built.

- **First Trust**'s "Export to Excel" is an ASP.NET postback to the
  identical page — zero independence from the primary source by
  construction.
- **Volatility Shares**' "DOWNLOAD HOLDINGS" link is the same host/CDN as
  the primary scrape, and is a legacy binary `.xls` format this project
  has no parser for.
- **REX Shares**' only "download" link is a 98-byte illustrative sample
  transaction, not real holdings data.
- **ProShares**' Daily Holdings CSV looked the most promising — a
  different subdomain, a real per-fund daily file — but **failed
  equivalence when checked against real live data**: it discloses swap
  notional by bank counterparty, not the equity look-through the primary
  source represents, despite the two sources' row counts coincidentally
  matching exactly for the funds checked. Adopting it on format
  similarity alone would have silently and dramatically changed what
  this API's consumers see for those tickers.

`source_mode: "secondary"` is defined in this API's schema for exactly
this scenario, and will be used the moment an issuer actually has one that
passes the same equivalence bar — see [How freshness works](/freshness).

## Reverse exposure search is ticker-only

`GET /v1/exposure/:symbol` can't currently find an underlying that has no
disclosed ticker symbol. `TQQQ`'s objective names its target as "the
Nasdaq-100 Index" and `UPRO`'s as "the S&P 500" — both real, correctly
classified `index`-type underlyings — but neither fund's objective text
discloses an actual ticker/symbol for it, so `GET /v1/exposure/NDX` won't
surface `TQQQ` today, even though it's a real, known relationship.
Lookup by an underlying's full name (rather than ticker) can close this
gap later.

## Underlying/strategy classification returns "unknown" rather than guessing

When an issuer's own text doesn't clearly say whether an underlying is a
stock, an ETF, an index, or something else, this API returns `type:
"unknown"` rather than defaulting to a guess. This was a real bug fix, not
a design that was right from the start: an early version defaulted an
unrecognized ticker-shaped underlying to `"stock"`, which was
**definitively wrong** for at least one real fund (a leveraged fund
targeting an underlying ETF, not a company). The fix replaced the
default-to-stock guess with `"unknown"`, verified only when the source
text explicitly names what the ticker represents. The same discipline
applies to `strategy.confidence`: `"unknown"` means "probably a
leveraged/inverse product, but nothing here supports a confident read of
direction/multiple" — a fund's name alone (no fetchable objective text)
is capped at `"medium"` confidence, never `"high"`, since a name is never
treated as an issuer's own explicit, unambiguous statement.

## VanEck requires manual maintenance for new tickers

Every other issuer's adapter resolves a new ticker generically once one
fund from that issuer works. VanEck is the one exception: its holdings
URL is keyed by a human-readable slug with no derivable pattern from the
ticker and no fund-list API to look it up from, so a new VanEck ticker
needs its slug hand-added to a lookup map, not just a registry entry.

## Health-monitoring and discovery schedules are documented assumptions, not measured data

Health checks and fund-discovery both default to a fixed daily check time
(9am and 10am America/New_York respectively). This project's own research
only ever captured each issuer's as-of *date*, never the time of day a
file actually becomes available — so these times are a reasonable,
documented starting assumption, not something confirmed by direct
measurement yet.

## Fund-universe discovery isn't exposed as an endpoint

This API tracks roughly 1,475 discoverable funds across ten issuers (see
[Coverage](/coverage)) for internal monitoring/alerting purposes, but
that data isn't queryable through any endpoint yet — only the 37
tickers in the manually curated registry are actually servable today.

## No self-serve API key signup or tier upgrade

Getting a key, and moving to a higher rate-limit tier, both currently
require contacting the API operator directly — see
[Getting started](/getting-started).
