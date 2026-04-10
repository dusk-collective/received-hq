"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getEscalation, getAlertCounts } from "@/lib/escalation";
import type { Package, Property, CarrierType, RecipientType } from "@/lib/types";

type StatusFilter = "all" | "received" | "picked_up" | "missing" | "notified" | "returned";
type DateRange = "today" | "week" | "month" | "all" | "custom";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-blue-50 text-blue-700" },
  notified: { label: "Notified", className: "bg-purple/10 text-purple" },
  picked_up: { label: "Picked Up", className: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Returned", className: "bg-gray-100 text-gray-600" },
  missing: { label: "Missing", className: "bg-red-50 text-red-700" },
};

const CARRIERS: CarrierType[] = ["FedEx", "UPS", "USPS", "Amazon", "DHL", "Other"];
const RECIPIENT_TYPES: RecipientType[] = ["guest", "employee", "vendor", "group"];

export default function DashboardPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [property, setProperty] = useState<Property | null>(null);

  const [noProperty, setNoProperty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { if (!cancelled) setLoading(false); return; }

      const { data: staffData } = await supabase
        .from("staff")
        .select("property_id")
        .eq("user_id", user.id)
        .single();

      if (!staffData || cancelled) {
        if (!cancelled) { setNoProperty(true); setLoading(false); }
        return;
      }

      const { data: propData } = await supabase
        .from("properties")
        .select("*")
        .eq("id", staffData.property_id)
        .single();

      if (propData && !cancelled) setProperty(propData as Property);

      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("property_id", staffData.property_id)
        .order("received_at", { ascending: false });

      if (!error && data && !cancelled) {
        setPackages(data as Package[]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const packagesToday = packages.filter(p => p.received_at?.startsWith(today)).length;
  const awaitingPickup = packages.filter(p => p.status === "received" || p.status === "notified").length;
  const deliveredToday = packages.filter(p => p.status === "picked_up" && p.picked_up_at?.startsWith(today)).length;
  const totalThisMonth = packages.filter(p => p.received_at?.startsWith(thisMonth)).length;

  // Storage fee stat
  const storageFeePackages = packages.filter(p => p.storage_fee_charged && p.received_at?.startsWith(thisMonth)).length;
  const storageFeeTotal = property?.storage_fee_enabled
    ? storageFeePackages * (property?.storage_fee_amount || 5)
    : 0;

  // Alert counts
  const alerts = getAlertCounts(packages);

  // Date filtering
  function isInDateRange(dateStr: string): boolean {
    if (dateRange === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (dateRange === "today") {
      return dateStr.startsWith(today);
    }
    if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    if (dateRange === "month") {
      return dateStr.startsWith(thisMonth);
    }
    if (dateRange === "custom") {
      if (customStart && d < new Date(customStart)) return false;
      if (customEnd && d > new Date(customEnd + "T23:59:59")) return false;
      return true;
    }
    return true;
  }

  // Filter and search
  const filtered = packages.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (carrierFilter !== "all" && p.carrier !== carrierFilter) return false;
    if (recipientTypeFilter !== "all" && p.recipient_type !== recipientTypeFilter) return false;
    if (!isInDateRange(p.received_at)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.recipient_name?.toLowerCase().includes(q) ||
        p.tracking_number?.toLowerCase().includes(q) ||
        p.room_number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = [
    { label: "Packages Today", value: packagesToday },
    { label: "Awaiting Pickup", value: awaitingPickup },
    { label: "Delivered Today", value: deliveredToday },
    { label: "Total This Month", value: totalThisMonth },
  ];

  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Received", value: "received" },
    { label: "Notified", value: "notified" },
    { label: "Picked Up", value: "picked_up" },
    { label: "Returned", value: "returned" },
    { label: "Missing", value: "missing" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
      </div>
    );
  }

  if (noProperty) {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-lg font-medium text-foreground">No property assigned</p>
        <p className="text-sm text-text-muted">Contact your administrator.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Packages</h1>
        <Link
          href="/dashboard/scan"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple px-5 text-sm font-medium text-white transition-colors hover:bg-purple-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Package
        </Link>
      </div>

      {/* Alert Badges */}
      {(alerts.over24 > 0 || alerts.over48 > 0 || alerts.checkoutToday > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {alerts.checkoutToday > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white animate-pulse">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {alerts.checkoutToday} checking out today with packages
            </div>
          )}
          {alerts.over48 > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {alerts.over48} unclaimed &gt; 48hrs
            </div>
          )}
          {alerts.over24 > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {alerts.over24} unclaimed &gt; 24hrs
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Storage Fee Stat */}
      {property?.storage_fee_enabled && (
        <div className="mb-6 rounded-xl border border-foreground/5 bg-white p-4 shadow-sm">
          <p className="text-sm text-text-muted">
            Storage fees this month: <span className="font-semibold text-foreground">${storageFeeTotal.toFixed(2)}</span> ({storageFeePackages} packages)
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-surface-alt p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? "bg-white text-foreground shadow-sm"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/40"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search name, tracking, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-72 rounded-lg border border-foreground/10 bg-white pl-9 pr-4 text-sm text-foreground placeholder-text-muted/40 outline-none transition-colors focus:border-purple"
            />
          </div>
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === "custom" && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm outline-none focus:border-purple" />
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm outline-none focus:border-purple" />
            </>
          )}

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple"
          >
            <option value="all">All Carriers</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={recipientTypeFilter}
            onChange={(e) => setRecipientTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple"
          >
            <option value="all">All Types</option>
            {RECIPIENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Packages */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-foreground/5 bg-white py-16 shadow-sm">
          <svg className="mb-4 h-12 w-12 text-foreground/10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          <p className="mb-1 text-sm font-medium text-text-muted">
            {packages.length === 0 ? "No packages logged yet" : "No packages match your filters"}
          </p>
          <p className="text-xs text-text-muted/60">
            {packages.length === 0 ? "Scan your first package to get started." : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((pkg) => {
              const badge = STATUS_BADGES[pkg.status] || STATUS_BADGES.received;
              const esc = getEscalation(pkg);
              return (
                <div
                  key={pkg.id}
                  onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                  className="cursor-pointer rounded-xl border border-foreground/5 bg-white p-4 shadow-sm transition-colors hover:bg-surface-alt/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pkg.recipient_name}</p>
                      {pkg.room_number && (
                        <p className="text-xs text-text-muted">Room {pkg.room_number}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {esc.level !== "none" && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${esc.className}`}>
                          {esc.label}
                        </span>
                      )}
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-text-muted">
                    {pkg.carrier && <p>{pkg.carrier}{pkg.tracking_number ? ` -- ${pkg.tracking_number}` : ""}</p>}
                    {!pkg.carrier && pkg.tracking_number && <p className="font-mono">{pkg.tracking_number}</p>}
                    {pkg.storage_location && <p>Location: {pkg.storage_location}</p>}
                    {pkg.received_at && (
                      <p>
                        {new Date(pkg.received_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-foreground/5 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/5">
                    {["Tracking #", "Recipient", "Carrier", "Type", "Status", "Received", "Storage", ""].map(
                      (col) => (
                        <th key={col} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filtered.map((pkg) => {
                    const badge = STATUS_BADGES[pkg.status] || STATUS_BADGES.received;
                    const esc = getEscalation(pkg);
                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                        className="cursor-pointer hover:bg-surface-alt/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-foreground/70">
                          {pkg.tracking_number || "---"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">{pkg.recipient_name}</div>
                          {pkg.room_number && (
                            <div className="text-xs text-text-muted">Room {pkg.room_number}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{pkg.carrier || "---"}</td>
                        <td className="px-6 py-4 text-sm text-text-muted capitalize">{pkg.recipient_type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                              {badge.label}
                            </span>
                            {esc.level !== "none" && (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${esc.className}`}>
                                {esc.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {pkg.received_at
                            ? new Date(pkg.received_at).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })
                            : "---"}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{pkg.storage_location || "---"}</td>
                        <td className="px-6 py-4">
                          <svg className="h-4 w-4 text-text-muted/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
