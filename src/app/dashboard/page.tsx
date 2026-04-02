"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Package } from "@/lib/types";

type StatusFilter = "all" | "received" | "picked_up" | "missing";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-blue-50 text-blue-700" },
  notified: { label: "Notified", className: "bg-purple/10 text-purple" },
  picked_up: { label: "Picked Up", className: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Returned", className: "bg-gray-100 text-gray-600" },
  missing: { label: "Missing", className: "bg-red-50 text-red-700" },
};

export default function DashboardPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's property
    const { data: staffData } = await supabase
      .from("staff")
      .select("property_id")
      .eq("user_id", user.id)
      .single();

    if (!staffData) return;
    setPropertyId(staffData.property_id);

    // Fetch packages
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("property_id", staffData.property_id)
      .order("received_at", { ascending: false });

    if (!error && data) {
      setPackages(data as Package[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  async function markPickedUp(pkg: Package) {
    const pickedUpBy = prompt("Who is picking up? (Name)");
    if (!pickedUpBy) return;

    const { error } = await supabase
      .from("packages")
      .update({
        status: "picked_up",
        picked_up_at: new Date().toISOString(),
        picked_up_by: pickedUpBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pkg.id);

    if (!error) {
      loadPackages();
    }
  }

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const packagesToday = packages.filter(
    (p) => p.received_at?.startsWith(today)
  ).length;
  const awaitingPickup = packages.filter(
    (p) => p.status === "received" || p.status === "notified"
  ).length;
  const deliveredToday = packages.filter(
    (p) => p.status === "picked_up" && p.picked_up_at?.startsWith(today)
  ).length;
  const totalThisMonth = packages.filter(
    (p) => p.received_at?.startsWith(thisMonth)
  ).length;

  // Filter and search
  const filtered = packages.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.recipient_name?.toLowerCase().includes(q) ||
        p.tracking_number?.toLowerCase().includes(q)
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
    { label: "Picked Up", value: "picked_up" },
    { label: "Missing", value: "missing" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
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

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <p className="text-sm text-text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-surface-alt p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
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
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or tracking #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-72 rounded-lg border border-foreground/10 bg-white pl-9 pr-4 text-sm text-foreground placeholder-text-muted/40 outline-none transition-colors focus:border-purple"
          />
        </div>
      </div>

      {/* Packages Table */}
      <div className="overflow-hidden rounded-xl border border-foreground/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/5">
                {["Tracking #", "Recipient", "Carrier", "Status", "Received", "Storage", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <svg
                        className="mb-4 h-12 w-12 text-foreground/10"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                        />
                      </svg>
                      <p className="mb-1 text-sm font-medium text-text-muted">
                        {packages.length === 0
                          ? "No packages logged yet"
                          : "No packages match your filters"}
                      </p>
                      <p className="text-xs text-text-muted/60">
                        {packages.length === 0
                          ? "Scan your first package to get started."
                          : "Try adjusting your search or filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => {
                  const badge = STATUS_BADGES[pkg.status] || STATUS_BADGES.received;
                  return (
                    <tr key={pkg.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-foreground/70">
                        {pkg.tracking_number || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {pkg.recipient_name}
                        </div>
                        {pkg.room_number && (
                          <div className="text-xs text-text-muted">
                            Room {pkg.room_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {pkg.carrier || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {pkg.received_at
                          ? new Date(pkg.received_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {pkg.storage_location || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {(pkg.status === "received" || pkg.status === "notified") && (
                          <button
                            onClick={() => markPickedUp(pkg)}
                            className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Mark Picked Up
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
