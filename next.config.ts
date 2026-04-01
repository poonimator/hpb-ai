import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the guardrails markdown file is bundled for serverless functions
  outputFileTracingIncludes: {
    "/api/**": ["./src/lib/ai/prompts/**"],
  },
  // Prevent Next.js from bundling native/wasm packages used for PDF parsing
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
// Created by Swapnil Bapat © 2026
