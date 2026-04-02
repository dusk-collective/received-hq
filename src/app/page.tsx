import Link from "next/link";

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-xl font-bold tracking-tighter text-foreground">
            Received
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium tracking-tight text-foreground/60 transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium tracking-tight text-foreground/60 transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium tracking-tight text-foreground/60 transition-colors hover:text-foreground"
            >
              Login
            </Link>
          </div>
        </div>
        <Link
          href="/signup"
          className="rounded-lg bg-gradient-to-br from-purple to-purple-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-16">
      {/* Gradient orb background */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-light/6 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl md:text-7xl" style={{ letterSpacing: '-0.02em' }}>
          Every package.
          <br />
          Tracked. Delivered.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl">
          AI-powered package management for hotels. Snap a photo, AI logs it,
          your guest gets notified instantly. Zero friction, total transparency.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-13 items-center rounded-lg bg-gradient-to-br from-purple to-purple-light px-8 text-base font-bold text-white shadow-lg shadow-purple/20 transition-all hover:brightness-105 active:scale-95"
          >
            Start Free Trial
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-13 items-center rounded-lg border border-foreground/10 bg-white px-8 text-base font-semibold text-foreground transition-all hover:bg-surface-alt"
          >
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <section className="py-12 bg-surface-muted">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-text-muted/60">
          Trusted by operations teams at leading hotels
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex h-10 w-28 items-center justify-center rounded-md bg-foreground/5 text-xs font-bold uppercase tracking-widest text-foreground/25"
            >
              Logo {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section className="bg-surface-muted py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your command center for every delivery
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-muted">
            One dashboard to track, manage, and resolve every package in your property.
          </p>
        </div>

        {/* Browser frame mockup */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-purple/5">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-foreground/5 bg-surface-muted px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-foreground/10" />
            <div className="h-3 w-3 rounded-full bg-foreground/10" />
            <div className="h-3 w-3 rounded-full bg-foreground/10" />
            <div className="ml-4 h-6 flex-1 max-w-sm rounded-md bg-foreground/5 px-3 flex items-center">
              <span className="text-xs text-foreground/30">app.receivedhq.com/dashboard</span>
            </div>
          </div>

          {/* Dashboard content placeholder */}
          <div className="p-6 md:p-8">
            {/* Stat cards row */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Today's Packages", value: "47" },
                { label: "Awaiting Pickup", value: "12" },
                { label: "Avg. Hold Time", value: "2.4h" },
                { label: "Delivered Today", value: "35" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-surface-alt p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted/60">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Table placeholder */}
            <div className="rounded-lg bg-surface-alt">
              <div className="grid grid-cols-5 gap-4 p-4 text-xs font-bold uppercase tracking-widest text-text-muted/60">
                <span>Guest</span>
                <span>Room</span>
                <span>Carrier</span>
                <span>Arrived</span>
                <span>Status</span>
              </div>
              {[
                { guest: "J. Martinez", room: "1204", carrier: "FedEx", time: "9:14 AM", status: "Awaiting" },
                { guest: "R. Thompson", room: "803", carrier: "UPS", time: "8:47 AM", status: "Notified" },
                { guest: "S. Chen", room: "1501", carrier: "USPS", time: "8:22 AM", status: "Picked Up" },
                { guest: "A. Williams", room: "612", carrier: "Amazon", time: "7:55 AM", status: "Notified" },
              ].map((row) => (
                <div
                  key={row.guest}
                  className="grid grid-cols-5 gap-4 px-4 py-3 text-sm text-foreground/80"
                >
                  <span className="font-medium text-foreground">{row.guest}</span>
                  <span>{row.room}</span>
                  <span>{row.carrier}</span>
                  <span>{row.time}</span>
                  <span
                    className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.status === "Picked Up"
                        ? "bg-emerald-50 text-emerald-700"
                        : row.status === "Notified"
                          ? "bg-purple/10 text-purple"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: "📷",
      title: "AI Label Scanning",
      description:
        "Point your device at any shipping label. Our AI extracts recipient name, room number, and carrier data in milliseconds. No manual typing.",
    },
    {
      icon: "📊",
      title: "Real-Time Dashboard",
      description:
        "Monitor package volumes, storage duration, and delivery times across your property from a single administrative panel.",
    },
    {
      icon: "🔔",
      title: "Guest Notifications",
      description:
        "Automated SMS and email notifications are sent the moment a package is logged, reducing front-desk inquiries by up to 60%.",
    },
  ];

  return (
    <section id="features" className="py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for the front desk
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-muted">
            Everything your team needs to track packages from arrival to pickup, without the paper logs.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl bg-surface-alt p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple/5"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple/10 text-2xl transition-colors group-hover:bg-purple group-hover:grayscale group-hover:brightness-200">
                {feature.icon}
              </div>
              <h3 className="mb-4 text-xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-text-muted">
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
      number: "1",
      title: "Scan & Verify",
      description: "Snap a photo of the shipping label. AI extracts everything automatically.",
    },
    {
      number: "2",
      title: "Notify Guest",
      description: "An automated message is sent to the guest with pickup instructions.",
    },
    {
      number: "3",
      title: "Secure Handoff",
      description: "Guest picks up, clerk marks delivered. Digital chain of custody complete.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-surface-muted py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Seamless from arrival to handoff
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-muted">
            Three steps. Zero paper logs. Complete visibility.
          </p>
        </div>
        <div className="relative grid gap-12 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute top-6 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-purple/20 via-purple/40 to-purple/20 md:block" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="relative z-10 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple to-purple-light text-lg font-bold text-white shadow-md shadow-purple/20">
                {step.number}
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "12 min", label: "saved per package" },
    { value: "$4,800", label: "per year in labor savings" },
    { value: "Zero", label: "lost packages" },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 text-center md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="mb-2 text-4xl font-black tracking-tight text-purple md:text-5xl">
              {stat.value}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text-muted">
            Start with a 3-day free trial. No credit card required.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Standard */}
          <div className="flex flex-col rounded-2xl bg-white p-10 shadow-sm">
            <h3 className="text-xl font-bold text-foreground">Standard</h3>
            <p className="mt-1 text-sm text-text-muted">For hotels up to 200 rooms.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-5xl font-black tracking-tight text-foreground">$99</span>
              <span className="ml-1 text-text-muted">/mo</span>
            </div>
            <div className="mt-2 inline-flex w-fit rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-text-muted">
              3-day free trial
            </div>
            <ul className="mt-8 flex-1 space-y-4">
              {[
                "Up to 500 packages/month",
                "AI label scanning",
                "Guest notifications (SMS + email)",
                "Web dashboard",
                "Email support",
              ].map((feature) => (
                <li key={feature} className="flex items-center text-sm">
                  <svg className="mr-3 h-4 w-4 shrink-0 text-purple" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-text-muted">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-10 block w-full rounded-lg border border-foreground/10 py-3.5 text-center text-sm font-bold text-foreground transition-all hover:bg-surface-alt"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional */}
          <div className="relative flex flex-col rounded-2xl bg-white p-10 shadow-xl ring-2 ring-purple">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple to-purple-light px-4 py-1 text-xs font-bold text-white">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-foreground">Professional</h3>
            <p className="mt-1 text-sm text-text-muted">For large hotels and multi-property.</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-5xl font-black tracking-tight text-foreground">$199</span>
              <span className="ml-1 text-text-muted">/mo</span>
            </div>
            <div className="mt-2 inline-flex w-fit rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-text-muted">
              3-day free trial
            </div>
            <ul className="mt-8 flex-1 space-y-4">
              {[
                "Unlimited packages",
                "Priority support",
                "Analytics & reporting",
                "Multi-property support",
                "Custom notification templates",
              ].map((feature) => (
                <li key={feature} className="flex items-center text-sm">
                  <svg className="mr-3 h-4 w-4 shrink-0 text-purple" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-text-muted">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-10 block w-full rounded-lg bg-gradient-to-br from-purple to-purple-light py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-purple/20 transition-all hover:brightness-110 active:scale-95"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="relative overflow-hidden bg-foreground py-40 px-6">
      {/* Hotel photography background */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg"
          alt="Hotel exterior"
          className="h-full w-full object-cover opacity-20"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-7xl" style={{ letterSpacing: '-0.02em' }}>
          The concierge your packages deserve.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-xl text-white/60">
          Join hundreds of hotels transforming their lobby operations with Received.
        </p>
        <Link
          href="/signup"
          className="inline-flex h-14 items-center rounded-xl bg-gradient-to-br from-purple to-purple-light px-10 text-lg font-bold text-white shadow-xl transition-all hover:brightness-110 active:scale-95"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-muted px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div>
            <span className="text-lg font-bold tracking-tighter text-foreground">Received</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
              AI-powered package management for hotels. The digital concierge for logistics.
            </p>
            <p className="mt-4 text-sm text-text-muted">
              <a href="mailto:support@receivedhq.com" className="hover:text-purple transition-colors">
                support@receivedhq.com
              </a>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">
                Product
              </span>
              <Link href="#features" className="text-sm text-text-muted transition-colors hover:text-purple">Features</Link>
              <Link href="#pricing" className="text-sm text-text-muted transition-colors hover:text-purple">Pricing</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">
                Company
              </span>
              <Link href="#" className="text-sm text-text-muted transition-colors hover:text-purple">About</Link>
              <Link href="#" className="text-sm text-text-muted transition-colors hover:text-purple">Privacy</Link>
              <Link href="#" className="text-sm text-text-muted transition-colors hover:text-purple">Terms</Link>
              <Link href="#" className="text-sm text-text-muted transition-colors hover:text-purple">Contact</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">
                Built by
              </span>
              <a
                href="https://duskcollective.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted transition-colors hover:text-purple"
              >
                Dusk Collective
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-foreground/5 pt-8">
          <p className="text-xs text-text-muted/60">
            &copy; 2026 Dusk Collective LLC. All rights reserved.
          </p>
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
      <SocialProofBar />
      <ProductShowcase />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <PricingSection />
      <ClosingSection />
      <Footer />
    </>
  );
}
