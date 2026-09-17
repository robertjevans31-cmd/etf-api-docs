---
title: Rate Limits & Tiers
description: Request tiers, the rolling 24-hour window, and how to handle a 429.
---

# Rate limits & tiers

Every API key has a **tier**, defaulting to `free` if not set, which caps
requests over a **rolling 24-hour window** — "how many requests in the
last 24 hours from right now," not a fixed reset at midnight. A request
made 23 hours ago still counts against the limit now; it stops counting
the moment it turns 24 hours old, not before.

## Tiers

| Tier | Requests / rolling 24h |
|---|---|
| `free` | 90 |
| `individual` | 5,000 |
| `business` | 50,000 |
| `enterprise` | Uncapped |

`enterprise` keys skip rate-limit accounting entirely — there's no
rolling-window bookkeeping maintained for them at all.

## What a bulk request costs

A bulk `/v1/holdings?tickers=...` call counts as exactly **one** request
against your rate limit, however many tickers it contains — the
auth/rate-limit check runs once per HTTP request regardless of route. If
you're working through a large watchlist, batching into bulk calls (up to
25 tickers each) is dramatically more efficient than one request per
ticker.

## Handling a `429`

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

- **`retryAfter`** is when the *oldest* request currently counted against
  your key ages out of the window, freeing one slot — not a fixed reset
  instant the way a fixed-window limiter would report, since there isn't
  one.
- The response also carries a standard **`Retry-After`** header, in
  seconds, for well-behaved clients that just want a number to sleep on.

::: code-group

```js [JavaScript]
async function getHoldingsWithRetry(ticker, apiKey) {
  const res = await fetch(
    `https://etf-api-production-c321.up.railway.app/v1/holdings/${ticker}`,
    { headers: { "X-Api-Key": apiKey } }
  );
  if (res.status === 429) {
    const retryAfterSeconds = Number(res.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
    return getHoldingsWithRetry(ticker, apiKey);
  }
  return res.json();
}
```

```python [Python]
import time
import requests

def get_holdings_with_retry(ticker, api_key):
    res = requests.get(
        f"https://etf-api-production-c321.up.railway.app/v1/holdings/{ticker}",
        headers={"X-Api-Key": api_key},
    )
    if res.status_code == 429:
        retry_after_seconds = int(res.headers.get("Retry-After", "60"))
        time.sleep(retry_after_seconds)
        return get_holdings_with_retry(ticker, api_key)
    return res.json()
```

:::

## Requesting a higher tier

There's no self-serve tier upgrade yet — contact the API operator to move
to a higher tier.
