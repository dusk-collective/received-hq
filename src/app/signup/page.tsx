"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [propertyName, setPropertyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed — no user returned.");

      // 2. Sign in immediately to establish session cookies
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // 3. Create property + staff atomically via RPC
      const { error: bootstrapError } = await supabase.rpc("bootstrap_tenant", {
        p_property_name: propertyName,
        p_staff_name: name,
      });

      if (bootstrapError) throw bootstrapError;

      // Full reload so middleware picks up session cookies
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Received
          </Link>
          <p className="mt-2 text-sm text-text-muted">
            3-day free trial. No credit card required.
          </p>
        </div>

        <div className="rounded-2xl border border-foreground/5 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="property" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Property Name
              </label>
              <input
                id="property"
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="The Grand Hotel"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hotel.com"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-purple text-sm font-medium text-white transition-colors hover:bg-purple-hover disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Start Free Trial"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-purple transition-colors hover:text-purple-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
