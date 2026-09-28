---
title: Coverage
description: Which issuers and funds are supported, how they're sourced, and the manual-vs-dynamic distinction.
---

# Coverage

## Currently registered: 37 tickers across 14 issuers

| Ticker(s) | Issuer | Source format | Update cadence |
|---|---|---|---|
| SPY, XLK | State Street | Public `.xlsx` file | Daily |
| QQQ | Invesco | Public JSON endpoint | Daily |
| VOO | Vanguard | Public JSON endpoint | **Monthly** (~2 weeks after month end) |
| SOXL, TNA | Direxion | Public `.csv` file | Daily |
| RAM, RAMZ, NVDX, TSLT | REX Shares / T-REX | Server-rendered HTML (scraped) | Daily |
| TQQQ, UPRO | ProShares | Server-rendered HTML (scraped) | Daily |
| UVIX, SVIX | Volatility Shares | Server-rendered HTML (scraped) | Daily |
| IVV, AGG, TLT, IJH | iShares (BlackRock) | Public `.csv` file, ticker resolved dynamically | Daily |
| SCHB, SCHD, SCHZ | Schwab | Public `.csv` file (dated filename) | Daily |
| QYLD, BOTZ, XYLD | Global X | Public `.csv` file (dated filename) | Daily |
| DFAC, DFUS, DFCF | Dimensional (DFA) | Public `.csv` file, date found by probing | Daily |
| FDN, QQEW | First Trust | Server-rendered HTML (scraped) | Daily |
| JEPI, JEPQ, JPST | JPMorgan | Public JSON endpoint, ticker resolved dynamically | Daily |
| GDX, GDXJ, SMH, MOAT, ANGL | VanEck | Public `.xlsx` file (nonstandard, hand-parsed) | Daily |

::: warning Vanguard (VOO) discloses monthly, not daily
VOO is a share class of the underlying Vanguard mutual fund, so its
holdings disclosure follows mutual-fund timing rather than daily
creation/redemption-basket disclosure — expect `asOfDate` to lag every
other issuer here by weeks, not days. `freshness_status` accounts for
this with a 50-day staleness threshold specifically for VOO (see
[How freshness works](/freshness)) — it will not incorrectly show as
`"stale"` just because it's genuinely on a slower cadence.
:::

## Dynamic vs. manual ticker resolution

Not every ticker above needs its own hardcoded lookup:

- **Fully dynamic (iShares, JPMorgan)**: the adapter resolves any ticker
  in that issuer's public fund-list/autocomplete endpoint automatically —
  the tickers in the table above are just the ones tested, not a fixed
  allowlist. iShares alone covers roughly 500 US-listed funds this way.
- **Generic per-issuer, registry-only additions (most issuers above)**:
  the URL/lookup pattern is generic once one fund from that issuer works,
  so adding another of that issuer's tickers is a one-line registry
  change, no new code.
- **Fully manual (VanEck)**: VanEck's holdings URL is keyed by a
  human-readable slug that isn't derivable from the ticker by any pattern
  found, and no fund-list API exists for it — every VanEck ticker needs
  its slug hand-added to a lookup map.

## Fund-universe discovery (beyond the registered tickers)

Separately from the manually curated registry above, this API also
auto-discovers each supported issuer's **entire** ETF lineup where a
machine-readable listing exists, so a new launch or delisting surfaces on
its own:

| Issuer | ETFs (in-universe) | Non-ETF tracked, excluded from the count |
|---|---:|---:|
| State Street | 183 | 0 |
| Vanguard | 116 | 267 mutual funds |
| iShares | 481 | 44 mutual funds |
| First Trust | 332 | 0 |
| Global X | 117 | 0 |
| VanEck | 92 | 16 mutual funds |
| REX Shares | 64 | 0 |
| Schwab | 37 | 0 |
| Dimensional | 45 | 0 |
| Volatility Shares | 18 | 0 |
| **Total** | **1,485** | **327** |

That's **1,485 confirmed ETFs** as of 2026-09-28 — far beyond the 37
tickers actually registered for the live API today, and a live figure, not
a fixed one, so expect it to move with real listing changes over time.

::: info Why "confirmed ETFs," not just "discovered entries"
A discovery source can't always be trusted to only list ETFs. Every
discovered entry is classified by real evidence (never guessed) into `etf`,
`mutual_fund`, `other`, or `unknown`, and only a confirmed `etf` counts
toward the figure above — found necessary after a VanEck discovery alert
turned out to be for IIGCX, a mutual fund share class, not an ETF. Non-ETF
entries aren't discarded, just excluded from this count.
:::

Discovery is purely a monitoring/alerting signal right now (a new-fund or
delisting alert to the API operator); it doesn't expose an endpoint of
its own yet.

Three issuers currently remain registry-only with no automated discovery,
each for a confirmed, specific reason: ProShares' listing page returns a
16-byte stub to automated requests (bot-detection), Direxion's listing
page sits behind a Cloudflare JS challenge, and JPMorgan's only
ticker-lookup mechanism is a market-wide search unsuitable for
enumeration. New tickers from these three still require a manual registry
addition.

## Not supported

- **GraniteShares** — their fund pages only expose a crude 2-line
  swap/cash summary, not itemized holdings; the richer data lives behind
  a signed, internal API that doesn't respond to standard requests.
- **Fidelity, WisdomTree** (deferred) — Fidelity's data is clean but
  confirmed stale (a full month behind); WisdomTree sits entirely behind
  a WAF that would require a headless browser to get past. Neither is
  ruled out permanently.

## Requesting a new fund or issuer

If a ticker you need isn't listed above, it may already be reachable via
one of the dynamic issuers (iShares, JPMorgan) with just a registry
addition, or via a generic per-issuer adapter with the same. Contact the
API operator with the ticker and issuer.
