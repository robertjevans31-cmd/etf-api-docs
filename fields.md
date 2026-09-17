---
title: Response Field Reference
description: Every consistently-returned field in the ETF Holdings API, explained.
---

# Response field reference

## Fund-level fields (`/v1/holdings/:ticker` and bulk `results[]`)

| Field | Type | Meaning |
|---|---|---|
| `ticker` | string | The requested ticker, uppercased. |
| `fundName` | string | The fund's full legal/marketing name. |
| `asOfDate` | string (`YYYY-MM-DD`) | The date the issuer says this holdings data is *for*. |
| `source` | string | Which issuer/institution the data came directly from, e.g. `"State Street Global Advisors (SSGA)"`. |
| `sourceUrl` | string | The exact URL this data was fetched from. |
| `holdingsCount` | number | The number of entries in `holdings`. |
| `holdings` | array | See [Holding fields](#holding-fields) below. |
| `fetched_at` | string (ISO timestamp) | When this server actually retrieved the data (or, for a cache hit, when the underlying fetch it's serving happened). |
| `age_minutes` | number | How old that fetch is, in minutes, computed fresh per response. |
| `freshness_status` | `"fresh"` \| `"issuer_delayed"` \| `"stale"` \| `"source_unavailable"` | See [How freshness works](/freshness). |
| `source_mode` | `"primary"` \| `"last_known_good"` \| `"secondary"` (reserved, unused) | See [How freshness works](/freshness). |
| `normalization_confidence` | `"high"` \| `"medium"` \| `"low"` | How confident the parser is in this response's normalization — see below. |
| `warnings` | array of strings (optional, omitted when empty) | Human-readable notes on specific holdings that lowered confidence. |
| `strategy` | object \| `null` | See [Strategy fields](#strategy-fields) below. `null` for an ordinary, non-leveraged fund. |
| `targetExposure` | object \| `null` | See [Target exposure fields](#target-exposure-fields) below. `null` whenever `strategy` is `null`. |
| `observedExposure` | `null` (when `strategy` isn't `null`) | Always `null` today — see [Known limitations](/limitations). |
| `observedExposureStatus` | string (when `strategy` isn't `null`) | Always `"not_calculable_from_disclosed_holdings"` today. |
| `reason` | string (when `strategy` isn't `null`) | Why observed exposure isn't calculable for this specific fund — see [Known limitations](/limitations). |

### `normalization_confidence`

- **`high`** — a plain `EQUITY`/`CASH`/`BOND`-only fund (e.g. SPY).
- **`medium`** — the fund has `SWAP`/`FUTURE`/`OPTION`/`OTHER` holdings:
  synthetic/derivative positions the parser has to interpret rather than
  read as a plain stock line, which can legitimately fall outside
  equity's normal weight/share ranges.
- **`low`** — the parser had no explicit weight/share value to read for a
  derivative position at all. An `EQUITY` holding with an out-of-range
  weight is also flagged, since that usually means something was
  mis-parsed.

## Holding fields

| Field | Type | Meaning |
|---|---|---|
| `ticker` | string \| `null` | The position's own ticker, where the issuer discloses one. |
| `name` | string | The position's disclosed name. |
| `type` | `"EQUITY"` \| `"BOND"` \| `"CASH"` \| `"SWAP"` \| `"FUTURE"` \| `"OPTION"` \| `"OTHER"` | Only `EQUITY` is guaranteed a positive `weightPct` in `(0, 100]` and a positive `sharesHeld`. |
| `weightPct` | number \| `null` | The position's weight. Can be negative or over 100% (notional exposure) for non-`EQUITY` types. |
| `sharesHeld` | number \| `null` | Share/contract count. Always `null` for `BOND` (sized by par/face value, not a share count). |
| `optionDetail` | object (only when `type: "OPTION"`) | See [Option detail fields](#option-detail-fields) below. |

## Strategy fields

Present (non-`null`) only for a fund with a stated leveraged/inverse
objective.

| Field | Type | Meaning |
|---|---|---|
| `direction` | `"long"` \| `"inverse"` \| `null` | Unsigned — the sign lives here, never doubled into a negative `leverageMultiple`. |
| `leverageMultiple` | number \| `null` | A positive magnitude (e.g. `3` for a 3x fund, long or inverse). |
| `underlying` | object \| `null` | `{ name, type, ticker }` — see the [underlying type taxonomy](https://github.com/robertjevans31-cmd/ETF-API/blob/main/docs/underlying-type-taxonomy.md) for what evidence justifies each `type`. |
| `resetFrequency` | `"daily"` \| `"monthly"` \| `null` | How often the fund resets its target multiple. |
| `source` | `"issuer_objective"` \| `"fund_name"` | Whether this came from the issuer's own stated objective text, or (weaker) the fund's name alone. |
| `confidence` | `"high"` \| `"medium"` \| `"unknown"` | See [Known limitations](/limitations) for exactly what each level requires. |

## Target exposure fields

Mirrors `strategy`, plus one derived convenience field. Never reads
holdings data — see [Known limitations](/limitations) for why.

| Field | Type | Meaning |
|---|---|---|
| `underlying`, `direction`, `leverageMultiple`, `resetFrequency`, `source`, `confidence` | — | Copied straight from `strategy`. |
| `targetExposureMultiple` | number \| `null` | `direction`'s sign folded into `leverageMultiple`'s magnitude (e.g. `-2` for a 2x inverse fund) — a signed convenience field only. |

## Option detail fields

Present only on holdings with `type: "OPTION"`.

| Field | Type | Meaning |
|---|---|---|
| `underlying` | object \| `null` | `{ name, type, ticker }` for the option's actual underlying — read from the disclosed contract string, never inferred from which fund holds it. |
| `putCall` | `"call"` \| `"put"` \| `null` | |
| `side` | `"long"` \| `"short"` \| `null` | Derived from the position's quantity sign — a covered-call fund's written calls show as `"short"`. |
| `strike` | number \| `null` | |
| `expiration` | string (`YYYY-MM-DD`) \| `null` | `null` if the disclosed date is garbled or out of range, rather than guessed. |
| `rawContract` | string | The original disclosed position name this was parsed from. |
| `source` | `"position_name"` | |
| `confidence` | `"high"` \| `"medium"` \| `"unknown"` | `high` only when underlying, put/call, strike, *and* a valid expiration all parsed. |

## `/v1/holdings/:ticker/changes` fields

See the [full field reference on that endpoint's page](/endpoints/changes#field-reference).

## `/v1/exposure/:symbol` fields

See the [relationship-type field reference on that endpoint's page](/endpoints/exposure#relationship-types).

## Bulk-only fields (`GET /v1/holdings`)

| Field | Type | Meaning |
|---|---|---|
| `requested` | number | How many distinct tickers were requested. |
| `succeeded` | number | How many resolved successfully. |
| `failed` | number | How many failed. |
| `results` | array | Each entry has the exact same shape as the single-ticker endpoint. |
| `errors` | array | Each entry: `{ ticker, error, code, detail? }` — see the [Error reference](/errors). |
