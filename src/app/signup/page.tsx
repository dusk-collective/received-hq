import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Received
          </Link>
          <p className="mt-2 text-sm text-white/40">
            3-day free trial. No credit card required.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-surface p-8">
          <form className="space-y-5">
            <div>
              <label
                htmlFor="property"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Property Name
              </label>
              <input
                id="property"
                type="text"
                placeholder="The Grand Hotel"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Jane Smith"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>

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
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Password
              </label>
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
              Start Free Trial
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple transition-colors hover:text-purple-hover"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
