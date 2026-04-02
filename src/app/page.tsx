import Link from "next/link";

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Received
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="#features"
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-hover"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16">
      {/* Gradient orb */}
      <div className="pointer-events-none absolute top-1/4 h-[500px] w-[500px] rounded-full bg-purple/20 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-purple" />
          Now accepting early access properties
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
          Every package.
          <br />
          <span className="text-purple">Tracked. Delivered.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/50 sm:text-xl">
          AI-powered package tracking for hotels and commercial properties. Snap
          a photo, AI logs it, your guest gets notified.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center rounded-lg bg-purple px-8 text-base font-medium text-white transition-colors hover:bg-purple-hover"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="inline-flex h-12 items-center rounded-lg border border-white/10 px-8 text-base font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            See how it works
          </Link>
        </div>
      </div>
      {/* Fade to background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "AI Label Scanning",
      description:
        "Snap a photo of the shipping label. AI extracts tracking number, carrier, and recipient instantly.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
      ),
    },
    {
      title: "Real-Time Dashboard",
      description:
        "Search, filter, and manage every package from your browser. Live updates across all devices.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
          />
        </svg>
      ),
    },
    {
      title: "Guest Notifications",
      description:
        "Automatic text and email alerts when a package arrives. Guests know before they ask.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for the front desk
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Everything your team needs to track packages from arrival to pickup,
            without the paper logs.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/5 bg-surface p-8 transition-all hover:border-purple/20 hover:bg-surface-hover"
            >
              <div className="mb-5 inline-flex rounded-xl bg-purple/10 p-3 text-purple">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Package arrives",
      description: "Clerk snaps a photo of the shipping label at the front desk.",
    },
    {
      number: "02",
      title: "AI reads the label",
      description:
        "Tracking number, carrier, and recipient are extracted and logged automatically.",
    },
    {
      number: "03",
      title: "Guest gets notified",
      description:
        "Text and email alerts go out instantly. Guest picks up, clerk marks delivered.",
    },
  ];

  return (
    <section id="how-it-works" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Three steps. Zero paper logs. Complete visibility.
          </p>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-purple/40 to-transparent md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple/20 bg-purple/10 text-xl font-bold text-purple">
                {step.number}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Standard",
      price: "$99",
      period: "/month",
      features: [
        "Up to 500 packages/month",
        "AI label scanning",
        "Guest notifications",
        "Web dashboard",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "$199",
      period: "/month",
      popular: true,
      features: [
        "Unlimited packages",
        "Priority support",
        "Analytics & reporting",
        "Multi-property support",
        "Custom notification templates",
      ],
    },
  ];

  return (
    <section id="pricing" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Start with a 3-day free trial. No credit card required.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-purple/40 bg-surface"
                  : "border-white/5 bg-surface"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                3-day free trial
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="ml-1 text-white/40">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <svg
                      className="mr-3 h-4 w-4 flex-shrink-0 text-purple"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-purple text-white hover:bg-purple-hover"
                    : "border border-white/10 text-white hover:border-white/20 hover:bg-white/5"
                }`}
              >
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-6">
          <span className="text-sm text-white/30">
            &copy; 2026 Dusk Collective LLC
          </span>
          <a
            href="https://duskcollective.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/30 transition-colors hover:text-white/50"
          >
            Built by Dusk Collective
          </a>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="text-sm text-white/30 transition-colors hover:text-white/50"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-sm text-white/30 transition-colors hover:text-white/50"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-sm text-white/30 transition-colors hover:text-white/50"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <Footer />
    </>
  );
}
