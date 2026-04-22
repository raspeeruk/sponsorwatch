import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingIncludes: {
    "/company/[slug]": [
      "./.data/static/companies/lookup.json",
      "./.data/static/stats.json",
      "./.data/static/companies/index.json",
    ],
    "/town/[slug]": [
      "./.data/static/towns/lookup.json",
      "./.data/static/stats.json",
      "./.data/static/companies/index.json",
    ],
  },
};

export default config;
