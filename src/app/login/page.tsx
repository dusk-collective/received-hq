import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Received
          </Link>
          <p className="mt-2 text-sm text-white/40">
            Sign in to your dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface p-8">
          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@hotel.com"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/70"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-purple transition-colors hover:text-purple-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-purple text-sm font-medium text-white transition-colors hover:bg-purple-hover"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-purple transition-colors hover:text-purple-hover"
          >
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
