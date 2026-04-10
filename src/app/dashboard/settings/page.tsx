"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext, canAccess } from "@/lib/hooks";
import type { Staff, StaffInvite, Property } from "@/lib/types";

type Tab = "team" | "property" | "notifications" | "storage";

const DEFAULT_TEMPLATE = "Hello {{guest_name}}, your package from {{carrier}} has arrived at {{property_name}}. {{pickup_location}} Tracking: {{tracking_number}}";

export default function SettingsPage() {
  const { staff, property: initialProperty, loading: ctxLoading } = useUserContext();
  const [activeTab, setActiveTab] = useState<Tab>("team");

  if (ctxLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-lg font-medium text-foreground">No access</p>
      </div>
    );
  }

  if (!canAccess(staff.role, "manager")) {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-lg font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-text-muted">Settings require manager or admin access.</p>
      </div>
    );
  }

  const tabs: { label: string; value: Tab; minRole: Staff["role"] }[] = [
    { label: "Team", value: "team", minRole: "manager" },
    { label: "Property", value: "property", minRole: "manager" },
    { label: "Notifications", value: "notifications", minRole: "manager" },
    { label: "Storage Fees", value: "storage", minRole: "admin" },
  ];

  const visibleTabs = tabs.filter(t => canAccess(staff.role, t.minRole));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-foreground">Settings</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-surface-alt p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-white text-foreground shadow-sm"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "team" && <TeamTab staff={staff} />}
      {activeTab === "property" && <PropertyTab staff={staff} property={initialProperty} />}
      {activeTab === "notifications" && <NotificationsTab staff={staff} property={initialProperty} />}
      {activeTab === "storage" && <StorageTab staff={staff} property={initialProperty} />}
    </div>
  );
}

// ── Team Tab ──
function TeamTab({ staff }: { staff: Staff }) {
  const [members, setMembers] = useState<Staff[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("clerk");
  const [inviting, setInviting] = useState(false);

  const loadTeam = useCallback(async () => {
    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("property_id", staff.property_id)
      .order("created_at");

    if (staffData) setMembers(staffData as Staff[]);

    const { data: inviteData } = await supabase
      .from("staff_invites")
      .select("*")
      .eq("property_id", staff.property_id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (inviteData) setInvites(inviteData as StaffInvite[]);
    setLoading(false);
  }, [staff.property_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("property_id", staff.property_id)
        .order("created_at");

      if (staffData && !cancelled) setMembers(staffData as Staff[]);

      const { data: inviteData } = await supabase
        .from("staff_invites")
        .select("*")
        .eq("property_id", staff.property_id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (inviteData && !cancelled) setInvites(inviteData as StaffInvite[]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [staff.property_id]);

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    const { error } = await supabase.from("staff_invites").insert({
      property_id: staff.property_id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: staff.id,
    });

    if (!error) {
      // TODO: Send actual invite email
      setInviteEmail("");
      await loadTeam();
    }
    setInviting(false);
  }

  async function removeInvite(id: string) {
    await supabase.from("staff_invites").delete().eq("id", id);
    await loadTeam();
  }

  async function updateRole(memberId: string, newRole: string) {
    if (memberId === staff.id) return; // Can't change own role
    await supabase.from("staff").update({ role: newRole }).eq("id", memberId);
    await loadTeam();
  }

  async function removeMember(memberId: string) {
    if (memberId === staff.id) return;
    if (!confirm("Remove this team member?")) return;
    await supabase.from("staff").delete().eq("id", memberId);
    await loadTeam();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">Invite Team Member</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@hotel.com"
            className="h-10 flex-1 rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-10 rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple"
          >
            <option value="clerk">Clerk</option>
            <option value="manager">Manager</option>
            {canAccess(staff.role, "admin") && <option value="admin">Admin</option>}
          </select>
          <button
            onClick={sendInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="h-10 rounded-lg bg-purple px-5 text-sm font-medium text-white hover:bg-purple-hover disabled:opacity-50"
          >
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Pending Invites</h3>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg bg-surface-alt p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs capitalize text-text-muted">{inv.role}</p>
                </div>
                <button onClick={() => removeInvite(inv.id)} className="text-sm text-red-500 hover:text-red-700">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Team */}
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">Team Members</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg bg-surface-alt p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">
                  {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.name} {member.id === staff.id && <span className="text-text-muted">(you)</span>}
                  </p>
                  <p className="text-xs capitalize text-text-muted">{member.role}</p>
                </div>
              </div>
              {member.id !== staff.id && canAccess(staff.role, "admin") && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value)}
                    className="h-8 rounded border border-foreground/10 bg-white px-2 text-xs outline-none focus:border-purple"
                  >
                    <option value="clerk">Clerk</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => removeMember(member.id)} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role Legend */}
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Role Permissions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-3">
            <span className="w-20 flex-shrink-0 font-medium text-foreground">Clerk</span>
            <span className="text-text-muted">Scan packages, view packages, mark picked up</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-20 flex-shrink-0 font-medium text-foreground">Manager</span>
            <span className="text-text-muted">All clerk abilities + view reports, edit packages, manage team</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-20 flex-shrink-0 font-medium text-foreground">Admin</span>
            <span className="text-text-muted">Everything + delete packages, edit settings, billing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property Tab ──
function PropertyTab({ property }: { staff: Staff; property: Property | null }) {
  const [name, setName] = useState(property?.name || "");
  const [address, setAddress] = useState(property?.address || "");
  const [phone, setPhone] = useState(property?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!property) return;
    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({ name, address: address || null, phone: phone || null })
      .eq("id", property.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-foreground">Property Information</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Property Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
        </div>
        <button onClick={save} disabled={saving}
          className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Notifications Tab ──
function NotificationsTab({ property }: { staff: Staff; property: Property | null }) {
  const [template, setTemplate] = useState(property?.notification_template || DEFAULT_TEMPLATE);
  const [instructions, setInstructions] = useState(property?.pickup_instructions || "Please visit the front desk for pickup.");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const variables = [
    { key: "{{guest_name}}", desc: "Recipient name" },
    { key: "{{property_name}}", desc: "Property name" },
    { key: "{{carrier}}", desc: "Carrier (FedEx, UPS, etc.)" },
    { key: "{{tracking_number}}", desc: "Tracking number" },
    { key: "{{pickup_location}}", desc: "Pickup instructions" },
  ];

  function renderPreview() {
    let preview = template;
    preview = preview.replace(/\{\{guest_name\}\}/g, "John Smith");
    preview = preview.replace(/\{\{property_name\}\}/g, property?.name || "Your Hotel");
    preview = preview.replace(/\{\{carrier\}\}/g, "FedEx");
    preview = preview.replace(/\{\{tracking_number\}\}/g, "1Z999AA10123456784");
    preview = preview.replace(/\{\{pickup_location\}\}/g, instructions);
    return preview;
  }

  async function save() {
    if (!property) return;
    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({
        notification_template: template,
        pickup_instructions: instructions,
      })
      .eq("id", property.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">Notification Template</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Pickup Instructions</label>
            <input type="text" value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="Please visit the front desk for pickup."
              className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Email Template</label>
            <textarea rows={5} value={template} onChange={e => setTemplate(e.target.value)}
              className="w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 py-3 text-sm outline-none focus:border-purple resize-none font-mono" />
          </div>

          {/* Variables reference */}
          <div className="rounded-lg bg-surface-alt p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted/60">Available Variables</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {variables.map(v => (
                <div key={v.key} className="flex items-center gap-2 text-xs">
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-purple">{v.key}</code>
                  <span className="text-text-muted">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Template"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Preview</h3>
        <div className="rounded-lg border border-foreground/10 bg-surface-alt p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">{renderPreview()}</p>
        </div>
        <p className="mt-2 text-xs text-text-muted">This is how the notification will appear to guests.</p>
      </div>
    </div>
  );
}

// ── Storage Fees Tab ──
function StorageTab({ staff, property }: { staff: Staff; property: Property | null }) {
  const [enabled, setEnabled] = useState(property?.storage_fee_enabled || false);
  const [amount, setAmount] = useState(String(property?.storage_fee_amount || "5.00"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!property) return;
    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({
        storage_fee_enabled: enabled,
        storage_fee_amount: parseFloat(amount) || 5.00,
      })
      .eq("id", property.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (!canAccess(staff.role, "admin")) {
    return (
      <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-text-muted">Only admins can manage storage fees.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-foreground">Storage Fee Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Enable Storage Fees</p>
            <p className="text-xs text-text-muted">When enabled, each logged package gets a fee recorded.</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-purple" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>

        {enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Fee Amount per Package ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 w-40 rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple"
            />
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple border-t-transparent" />
    </div>
  );
}
