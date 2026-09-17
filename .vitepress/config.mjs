import { defineConfig } from "vitepress";

const SITE_URL = "https://robertjevans31-cmd.github.io/etf-api-docs/";
const SITE_TITLE = "ETF Holdings API";
const SITE_DESCRIPTION =
  "Real-time ETF, leveraged/inverse, and covered-call holdings sourced directly from issuers — with honest freshness, provenance, and fallback labeling on every response.";

export default defineConfig({
  base: "/etf-api-docs/",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/etf-api-docs/favicon.svg" }],
    ["meta", { name: "theme-color", content: "#0f172a" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: SITE_TITLE }],
    ["meta", { property: "og:title", content: SITE_TITLE }],
    ["meta", { property: "og:description", content: SITE_DESCRIPTION }],
    ["meta", { property: "og:url", content: SITE_URL }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: SITE_TITLE }],
    ["meta", { name: "twitter:description", content: SITE_DESCRIPTION }],
  ],

  sitemap: {
    hostname: SITE_URL,
  },

  themeConfig: {
    logo: "/favicon.svg",
    search: {
      provider: "local",
    },

    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Endpoints", link: "/endpoints/" },
      { text: "Why This API", link: "/why-different" },
      { text: "Status", link: "/status" },
      {
        text: "v0.1.0 (v1 API)",
        items: [
          { text: "API versioning policy", link: "/reference/versioning" },
          { text: "Known limitations", link: "/limitations" },
        ],
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is this API?", link: "/" },
          { text: "Getting started", link: "/getting-started" },
          { text: "Why this data is different", link: "/why-different" },
        ],
      },
      {
        text: "Endpoints",
        items: [
          { text: "Overview & conventions", link: "/endpoints/" },
          { text: "GET /v1/holdings/:ticker", link: "/endpoints/holdings" },
          { text: "GET /v1/holdings (bulk)", link: "/endpoints/bulk" },
          { text: "GET /v1/holdings/:ticker/changes", link: "/endpoints/changes" },
          { text: "GET /v1/exposure/:symbol", link: "/endpoints/exposure" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "How freshness works", link: "/freshness" },
          { text: "Response field reference", link: "/fields" },
          { text: "Error reference", link: "/errors" },
          { text: "Rate limits & tiers", link: "/rate-limits" },
          { text: "Coverage", link: "/coverage" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API versioning policy", link: "/reference/versioning" },
          { text: "Known limitations", link: "/limitations" },
          { text: "API status", link: "/status" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/robertjevans31-cmd/ETF-API" }],

    footer: {
      message: "Unofficial documentation for the ETF Holdings API. Not affiliated with any ETF issuer.",
      copyright: "Documentation built with VitePress",
    },

    editLink: {
      pattern: "https://github.com/robertjevans31-cmd/etf-api-docs/edit/main/:path",
      text: "Suggest an edit to this page",
    },

    outline: {
      level: [2, 3],
    },
  },
});
