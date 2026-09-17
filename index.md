---
layout: home
title: ETF Holdings API
description: Real-time ETF, leveraged/inverse, and covered-call holdings sourced directly from issuers.

hero:
  name: "ETF Holdings API"
  text: "Holdings data, sourced honestly."
  tagline: Real-time ETF, leveraged/inverse, and covered-call holdings pulled directly from each issuer's own published data — with freshness, provenance, and fallback state labeled on every response, not assumed.
  actions:
    - theme: brand
      text: Try it now
      link: /try-it
    - theme: alt
      text: Get started
      link: /getting-started
    - theme: alt
      text: Endpoint reference
      link: /endpoints/

features:
  - icon: 🔌
    title: Direct from issuers
    details: Every response is normalized straight from the issuer's own published file or feed at request time — not a stale SEC filing, not a scraped aggregator, and no manual re-entry.
  - icon: 🧭
    title: Freshness you can act on
    details: asOfDate, fetched_at, freshness_status, and source_mode together tell you exactly how current a response is and whether it came from a live fetch or a bounded last-known-good cache.
  - icon: ⚖️
    title: Honest about what it doesn't know
    details: Underlying type, strategy direction, and option details resolve to "unknown" rather than a guessed default whenever the source text doesn't actually say — see Known limitations for the specific, documented boundaries.
  - icon: 📈
    title: Every instrument type, normalized the same way
    details: Plain equity baskets, leveraged/inverse swap-based funds, futures-based volatility funds, and covered-call option writers all come back through the same holding schema.
  - icon: 🔁
    title: Reverse exposure search
    details: "Ask the other direction: which funds have exposure to NVDA right now, across direct holdings, leveraged targets, and written options — not just \"what does this one fund hold.\""
  - icon: 🛡️
    title: Calendar-aware resilience
    details: A bounded last-known-good cache survives a normal weekend without hard-failing, and only refuses to serve data once an issuer has genuinely missed an expected publication.
---
