"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useUserContext, canAccess } from "@/lib/hooks";
import { getEscalation } from "@/lib/escalation";
import type { Package, PackageEvent, PackageStatus } from "@/lib/types";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-blue-50 text-blue-700" },
  notified: { label: "Notified", className: "bg-purple/10 text-purple" },
  picked_up: { label: "Picked Up", className: "bg-emerald-50 text-emerald-700" },
  returned: { label: "Returned", className: "bg-gray-100 text-gray-600" },
  missing: { label: "Missing", className: "bg-red-50 text-red-700" },
};

const NOTIFICATION_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700" },
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  no_contact: { label: "No Contact", className: "bg-gray-100 text-gray-600" },
};

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { staff, property } = useUserContext();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [events, setEvents] = useState<PackageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  // Edit form state
  const [editRecipient, setEditRecipient] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editCarrier, setEditCarrier] = useState("");
  const [editRecipientType, setEditRecipientType] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editCheckout, setEditCheckout] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStorage, setEditStorage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPackage = useCallback(async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const p = data as Package;
    setPkg(p);

    // Load events
    const { data: eventsData } = await supabase
      .from("package_events")
      .select("*")
      .eq("package_id", id)
      .order("created_at", { ascending: false });

    if (eventsData) setEvents(eventsData as PackageEvent[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setPkg(data as Package);

      const { data: eventsData } = await supabase
        .from("package_events")
        .select("*")
        .eq("package_id", id)
        .order("created_at", { ascending: false });

      if (eventsData && !cancelled) setEvents(eventsData as PackageEvent[]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  function startEdit() {
    if (!pkg) return;
    setEditRecipient(pkg.recipient_name);
    setEditTracking(pkg.tracking_number || "");
    setEditCarrier(pkg.carrier || "");
    setEditRecipientType(pkg.recipient_type);
    setEditRoom(pkg.room_number || "");
    setEditCheckout(pkg.checkout_date || "");
    setEditEmail(pkg.guest_email || "");
    setEditPhone(pkg.guest_phone || "");
    setEditStorage(pkg.storage_location || "");
    setEditNotes(pkg.notes || "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!pkg || !staff) return;
    setSaving(true);

    const updates = {
      recipient_name: editRecipient,
      tracking_number: editTracking || null,
      carrier: editCarrier || null,
      recipient_type: editRecipientType,
      room_number: editRoom || null,
      checkout_date: editCheckout || null,
      guest_email: editEmail || null,
      guest_phone: editPhone || null,
      storage_location: editStorage || null,
      notes: editNotes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("packages")
      .update(updates)
      .eq("id", pkg.id);

    if (error) {
      alert(`Failed to save changes: ${error.message}`);
      setSaving(false);
      return;
    }

    await supabase.from("package_events").insert({
      package_id: pkg.id,
      event_type: "edited",
      details: { changes: updates },
      created_by: staff.id,
    });
    setEditing(false);
    await loadPackage();
    setSaving(false);
  }

  async function changeStatus(newStatus: PackageStatus) {
    if (!pkg || !staff) return;

    if (newStatus === "picked_up") {
      const pickerName = prompt("Who is picking up? (Name)");
      if (!pickerName) return;

      const { error } = await supabase
        .from("packages")
        .update({
          status: "picked_up",
          picked_up_at: new Date().toISOString(),
          picked_up_by: pickerName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pkg.id);

      if (error) {
        alert(`Failed to update status: ${error.message}`);
        return;
      }

      await supabase.from("package_events").insert({
        package_id: pkg.id,
        event_type: "status_change",
        details: { from: pkg.status, to: "picked_up", picked_up_by: pickerName },
        created_by: staff.id,
      });
      await loadPackage();
      return;
    }

    const { error } = await supabase
      .from("packages")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", pkg.id);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
      return;
    }

    await supabase.from("package_events").insert({
      package_id: pkg.id,
      event_type: "status_change",
      details: { from: pkg.status, to: newStatus },
      created_by: staff.id,
    });
    await loadPackage();
  }

  async function deletePackage() {
    if (!pkg || !staff || !canAccess(staff.role, "admin")) return;
    if (!confirm("Are you sure you want to delete this package? This cannot be undone.")) return;

    const { error } = await supabase.from("packages").delete().eq("id", pkg.id);
    if (!error) router.push("/dashboard");
  }

  function printSlip() {
    setShowPrintSlip(true);
    setTimeout(() => {
      window.print();
      setShowPrintSlip(false);
    }, 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="mb-4 text-lg font-medium text-foreground">Package not found</p>
        <Link href="/dashboard" className="text-sm text-purple hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const badge = STATUS_BADGES[pkg.status] || STATUS_BADGES.received;
  const notifBadge = NOTIFICATION_BADGES[pkg.notification_status] || NOTIFICATION_BADGES.pending;
  const escalation = getEscalation(pkg);

  // Print slip overlay
  if (showPrintSlip) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-8 print:p-0">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold">Package Pickup Slip</h1>
          <div className="flex justify-center">
            <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/packages/${pkg.id}`} size={200} />
          </div>
          <div className="space-y-2 text-left">
            <p><strong>Recipient:</strong> {pkg.recipient_name}</p>
            {pkg.room_number && <p><strong>Room:</strong> {pkg.room_number}</p>}
            {pkg.tracking_number && <p><strong>Tracking #:</strong> {pkg.tracking_number}</p>}
            {pkg.carrier && <p><strong>Carrier:</strong> {pkg.carrier}</p>}
            <p><strong>Received:</strong> {new Date(pkg.received_at).toLocaleDateString()}</p>
            {pkg.storage_location && <p><strong>Storage:</strong> {pkg.storage_location}</p>}
          </div>
          <p className="text-xs text-gray-500">Scan QR code to view package details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-text-muted hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{pkg.recipient_name}</h1>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
          {escalation.level !== "none" && (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${escalation.className}`}>
              {escalation.label}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(pkg.status === "received" || pkg.status === "notified") && (
            <button
              onClick={() => changeStatus("picked_up")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Mark Picked Up
            </button>
          )}
          {pkg.status !== "missing" && pkg.status !== "picked_up" && (
            <button
              onClick={() => changeStatus("missing")}
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Mark Missing
            </button>
          )}
          {pkg.status !== "returned" && pkg.status !== "picked_up" && (
            <button
              onClick={() => changeStatus("returned")}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Mark Returned
            </button>
          )}
          <button
            onClick={printSlip}
            className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors"
          >
            Print Slip
          </button>
          {staff && canAccess(staff.role, "manager") && (
            <button
              onClick={startEdit}
              className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors"
            >
              Edit
            </button>
          )}
          {staff && canAccess(staff.role, "admin") && (
            <button
              onClick={deletePackage}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          {editing && (
            <div className="rounded-xl border border-purple/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-foreground">Edit Package</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Recipient</label>
                    <input type="text" value={editRecipient} onChange={e => setEditRecipient(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Tracking #</label>
                    <input type="text" value={editTracking} onChange={e => setEditTracking(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Carrier</label>
                    <select value={editCarrier} onChange={e => setEditCarrier(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple">
                      <option value="">None</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="Amazon">Amazon</option>
                      <option value="DHL">DHL</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Recipient Type</label>
                    <select value={editRecipientType} onChange={e => setEditRecipientType(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple">
                      <option value="guest">Guest</option>
                      <option value="employee">Employee</option>
                      <option value="vendor">Vendor</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Room</label>
                    <input type="text" value={editRoom} onChange={e => setEditRoom(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Checkout Date</label>
                    <input type="date" value={editCheckout} onChange={e => setEditCheckout(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Email</label>
                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground/70">Phone</label>
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                      className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Storage Location</label>
                  <input type="text" value={editStorage} onChange={e => setEditStorage(e.target.value)}
                    className="h-10 w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/70">Notes</label>
                  <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    className="w-full rounded-lg border border-foreground/10 bg-surface-alt px-3 py-2 text-sm outline-none focus:border-purple resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={saving}
                    className="rounded-lg bg-purple px-5 py-2 text-sm font-medium text-white hover:bg-purple-hover disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="rounded-lg border border-foreground/10 px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-alt">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Package Details Card */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Package Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Tracking Number" value={pkg.tracking_number} mono />
              <Detail label="Carrier" value={pkg.carrier} />
              <Detail label="Recipient Type" value={pkg.recipient_type} capitalize />
              <Detail label="Room Number" value={pkg.room_number} />
              <Detail label="Checkout Date" value={pkg.checkout_date ? new Date(pkg.checkout_date + "T12:00:00").toLocaleDateString() : null} />
              <Detail label="Storage Location" value={pkg.storage_location} />
              <Detail label="Email" value={pkg.guest_email} />
              <Detail label="Phone" value={pkg.guest_phone} />
              <div className="sm:col-span-2">
                <Detail label="Notes" value={pkg.notes} />
              </div>
            </div>
          </div>

          {/* Status & Notification Info */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Status Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-text-muted/60 uppercase tracking-wider">Notification</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${notifBadge.className}`}>
                  {notifBadge.label}
                </span>
              </div>
              {pkg.notified_at && (
                <Detail label="Notified At" value={new Date(pkg.notified_at).toLocaleString()} />
              )}
              <Detail label="Received At" value={new Date(pkg.received_at).toLocaleString()} />
              {pkg.picked_up_at && (
                <>
                  <Detail label="Picked Up At" value={new Date(pkg.picked_up_at).toLocaleString()} />
                  <Detail label="Picked Up By" value={pkg.picked_up_by} />
                </>
              )}
              {pkg.storage_fee_charged && property && (
                <Detail label="Storage Fee" value={`$${property.storage_fee_amount.toFixed(2)}`} />
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Activity Timeline</h3>
            {events.length === 0 ? (
              <p className="text-sm text-text-muted">No activity recorded.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple/40" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium capitalize">{event.event_type.replace(/_/g, " ")}</span>
                        {event.details && (event.details as Record<string, string>).from && (
                          <span className="text-text-muted">
                            {" "}from {(event.details as Record<string, string>).from} to {(event.details as Record<string, string>).to}
                          </span>
                        )}
                        {event.details && (event.details as Record<string, string>).picked_up_by && (
                          <span className="text-text-muted">
                            {" "}by {(event.details as Record<string, string>).picked_up_by}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted/60">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm text-center">
            <h3 className="mb-4 text-base font-semibold text-foreground">QR Code</h3>
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                value={typeof window !== "undefined" ? `${window.location.origin}/dashboard/packages/${pkg.id}` : pkg.id}
                size={160}
              />
            </div>
            <p className="text-xs text-text-muted">Scan to view this package</p>
            <button
              onClick={printSlip}
              className="mt-3 w-full rounded-lg border border-foreground/10 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors"
            >
              Print Pickup Slip
            </button>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-foreground">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">ID</span>
                <span className="font-mono text-xs text-foreground/60">{pkg.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Created</span>
                <span className="text-foreground">{new Date(pkg.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Updated</span>
                <span className="text-foreground">{new Date(pkg.updated_at).toLocaleDateString()}</span>
              </div>
              {escalation.hoursUnclaimed > 0 && (pkg.status === "received" || pkg.status === "notified") && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Unclaimed</span>
                  <span className="text-foreground">{Math.round(escalation.hoursUnclaimed)}hrs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono, capitalize }: { label: string; value: string | null | undefined; mono?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted/60 uppercase tracking-wider">{label}</p>
      <p className={`mt-0.5 text-sm text-foreground ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value || "---"}
      </p>
    </div>
  );
}
