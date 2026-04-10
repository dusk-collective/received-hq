"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext, canAccess } from "@/lib/hooks";
import type { Package } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6000da", "#7a2ffc", "#22c55e", "#f59e0b", "#ef4444", "#6b7280"];

export default function ReportsPage() {
  const { staff, loading: ctxLoading } = useUserContext();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProperty, setNoProperty] = useState(false);

  const hasAccess = staff ? canAccess(staff.role, "manager") : false;
  const [currentTime] = useState(() => Date.now());

  useEffect(() => {
    if (ctxLoading) return;
    if (!hasAccess) { setLoading(false); return; } // eslint-disable-line react-hooks/set-state-in-effect

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

      const { data } = await supabase
        .from("packages")
        .select("*")
        .eq("property_id", staffData.property_id)
        .order("received_at", { ascending: false });

      if (data && !cancelled) setPackages(data as Package[]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [ctxLoading, hasAccess]);

  if (loading || ctxLoading) {
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

  if (!staff || !canAccess(staff.role, "manager")) {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-lg font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-text-muted">Reports require manager or admin access.</p>
      </div>
    );
  }

  // Package volume by day (last 30 days)
  const last30Days: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    last30Days[d.toISOString().split("T")[0]] = 0;
  }
  packages.forEach((p) => {
    const day = p.received_at.split("T")[0];
    if (day in last30Days) last30Days[day]++;
  });
  const volumeData = Object.entries(last30Days).map(([date, count]) => ({
    date: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count,
  }));

  // Carrier distribution
  const carrierCounts: Record<string, number> = {};
  packages.forEach((p) => {
    const c = p.carrier || "Unknown";
    carrierCounts[c] = (carrierCounts[c] || 0) + 1;
  });
  const carrierData = Object.entries(carrierCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Average time to pickup
  const pickedUp = packages.filter(p => p.status === "picked_up" && p.picked_up_at);
  const avgPickupHours = pickedUp.length > 0
    ? pickedUp.reduce((sum, p) => {
        const received = new Date(p.received_at).getTime();
        const picked = new Date(p.picked_up_at!).getTime();
        return sum + (picked - received) / (1000 * 60 * 60);
      }, 0) / pickedUp.length
    : 0;

  // Recipient type distribution
  const typeCounts: Record<string, number> = {};
  packages.forEach((p) => {
    typeCounts[p.recipient_type] = (typeCounts[p.recipient_type] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Unclaimed aging
  const unclaimed = packages.filter(p => p.status === "received" || p.status === "notified");
  const aging = {
    "< 12hrs": 0, "12-24hrs": 0, "24-48hrs": 0, "48-72hrs": 0, "> 72hrs": 0,
  };
  unclaimed.forEach((p) => {
    const hours = (currentTime - new Date(p.received_at).getTime()) / (1000 * 60 * 60);
    if (hours < 12) aging["< 12hrs"]++;
    else if (hours < 24) aging["12-24hrs"]++;
    else if (hours < 48) aging["24-48hrs"]++;
    else if (hours < 72) aging["48-72hrs"]++;
    else aging["> 72hrs"]++;
  });
  const agingData = Object.entries(aging).map(([name, value]) => ({ name, value }));

  // Monthly totals
  const monthlyTotals: Record<string, { received: number; picked_up: number; missing: number }> = {};
  packages.forEach((p) => {
    const month = p.received_at.slice(0, 7);
    if (!monthlyTotals[month]) monthlyTotals[month] = { received: 0, picked_up: 0, missing: 0 };
    monthlyTotals[month].received++;
    if (p.status === "picked_up") monthlyTotals[month].picked_up++;
    if (p.status === "missing") monthlyTotals[month].missing++;
  });
  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  // CSV export
  function exportCSV() {
    const headers = [
      "Received At", "Recipient", "Type", "Room", "Tracking #", "Carrier",
      "Status", "Storage Location", "Notification", "Checkout Date", "Notes",
      "Picked Up At", "Picked Up By",
    ];
    const rows = packages.map(p => [
      p.received_at, p.recipient_name, p.recipient_type, p.room_number || "",
      p.tracking_number || "", p.carrier || "", p.status, p.storage_location || "",
      p.notification_status, p.checkout_date || "", p.notes || "",
      p.picked_up_at || "", p.picked_up_by || "",
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `packages-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <button
          onClick={exportCSV}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/10 px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Total Packages</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{packages.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Avg Pickup Time</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {avgPickupHours > 0 ? `${avgPickupHours.toFixed(1)}h` : "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Currently Unclaimed</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{unclaimed.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Pickup Rate</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {packages.length > 0 ? `${((pickedUp.length / packages.length) * 100).toFixed(0)}%` : "N/A"}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Volume by Day */}
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Package Volume (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6000da" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Carrier */}
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Packages by Carrier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={carrierData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {carrierData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Recipient Type */}
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Packages by Recipient Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unclaimed Aging */}
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Unclaimed Package Aging</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {agingData.map((_, i) => (
                    <Cell key={i} fill={["#22c55e", "#a3e635", "#f59e0b", "#f97316", "#ef4444"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Totals Table */}
      <div className="mt-6 rounded-xl border border-foreground/5 bg-white shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold text-foreground">Monthly Totals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-foreground/5">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">Month</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">Total Received</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">Picked Up</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">Missing</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">Pickup Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {monthlyData.map(([month, data]) => (
                <tr key={month} className="hover:bg-surface-alt/50">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">
                    {new Date(month + "-15").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3 text-sm text-text-muted">{data.received}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{data.picked_up}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{data.missing}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">
                    {data.received > 0 ? `${((data.picked_up / data.received) * 100).toFixed(0)}%` : "---"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
