"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get("returnTo") || "/dashboard";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(returnTo);
        router.refresh();
      } else {
        toast.error("Incorrect password");
        setPassword("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center w-full max-w-sm">
        <img
          src="/hpb-logo.png"
          alt="HPB Logo"
          className="h-12 w-auto object-contain mb-6"
        />
        <div className="w-full rounded-[var(--radius-card-lg)] bg-card shadow-outline-ring p-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-display-4 text-foreground">Sign in</h1>
              <p className="text-body-sm text-muted-foreground">
                Enter the access password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={loading}
                autoFocus
                aria-label="Password"
              />
              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full"
              >
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </form>

            <p className="text-caption text-muted-foreground text-center">
              Internal HPB tool. Contact your admin if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
