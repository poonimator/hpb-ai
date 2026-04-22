"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
    >
      <div className="w-full max-w-[360px] px-6">
        <div className="text-center mb-8">
          <img
            src="/hpb-logo.png"
            alt="HPB Logo"
            className="h-12 object-contain mx-auto mb-6"
          />
          <h1 className="text-xl font-semibold tracking-tight text-[#111] mb-1.5">
            HPB AI Tool
          </h1>
          <p className="text-sm text-[#666]">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className={`w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none bg-white transition-colors focus:border-[#999] ${
              error ? "border-red-400" : "border-[#ddd]"
            }`}
          />

          {error && (
            <p className="text-[13px] text-red-400 mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-3 px-3.5 py-2.5 text-sm font-medium text-white bg-[#111] rounded-lg transition-colors disabled:bg-[#999] disabled:cursor-default cursor-pointer"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-xs text-[#aaa] mt-8">
          Aleph Pte Ltd.
        </p>
      </div>
    </div>
  );
}
