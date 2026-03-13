import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the guardrails markdown file is bundled for serverless functions
  outputFileTracingIncludes: {
    "/api/**": ["./src/lib/ai/prompts/**"],
  },
};

export default nextConfig;
// Created by Swapnil Bapat © 2026
