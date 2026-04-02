"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ScanResult } from "@/lib/types";

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  // Form state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [carrier, setCarrier] = useState("");
  const [recipientType, setRecipientType] = useState("guest");
  const [roomNumber, setRoomNumber] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      setScanError("");
      setScanning(true);

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Scan failed");
        }

        const data: ScanResult = await res.json();

        if (data.tracking_number) setTrackingNumber(data.tracking_number);
        if (data.recipient_name) setRecipientName(data.recipient_name);
        if (data.carrier) {
          // Normalize carrier name
          const normalized = data.carrier.toLowerCase();
          if (normalized.includes("fedex")) setCarrier("FedEx");
          else if (normalized.includes("ups")) setCarrier("UPS");
          else if (normalized.includes("usps")) setCarrier("USPS");
          else if (normalized.includes("amazon")) setCarrier("Amazon");
          else if (normalized.includes("dhl")) setCarrier("DHL");
          else setCarrier("Other");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Scan failed";
        setScanError(message);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientName.trim()) return;

    setSaving(true);
    setSaveError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get property and staff info
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, property_id")
        .eq("user_id", user.id)
        .single();

      if (!staffData) throw new Error("No property found");

      const { error } = await supabase.from("packages").insert({
        property_id: staffData.property_id,
        tracking_number: trackingNumber || null,
        carrier: carrier || null,
        recipient_name: recipientName,
        recipient_type: recipientType,
        room_number: roomNumber || null,
        storage_location: storageLocation || null,
        notes: notes || null,
        received_by: staffData.id,
        label_data: imagePreview ? { scanned: true } : null,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setImagePreview(null);
    setTrackingNumber("");
    setRecipientName("");
    setCarrier("");
    setRecipientType("guest");
    setRoomNumber("");
    setStorageLocation("");
    setNotes("");
    setSuccess(false);
    setSaveError("");
    setScanError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center rounded-2xl border border-foreground/5 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Package Logged</h2>
          <p className="mb-6 text-sm text-text-muted">
            {recipientName}&apos;s package has been recorded successfully.
          </p>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="rounded-lg bg-purple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-hover"
            >
              Scan Another
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-foreground/10 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Log a Package</h1>
        <p className="mt-1 text-sm text-text-muted">
          Scan a label or enter details manually.
        </p>
      </div>

      {/* Camera / Scan Section */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-foreground/5 bg-white shadow-sm">
        {imagePreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Scanned label"
              className="h-56 w-full object-cover"
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-lg">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple border-t-transparent" />
                  <span className="text-sm font-medium text-foreground">
                    AI scanning label...
                  </span>
                </div>
              </div>
            )}
            {scanError && (
              <div className="border-t border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{scanError}</p>
                <p className="text-xs text-red-500">
                  You can still fill in the details manually below.
                </p>
              </div>
            )}
            <button
              onClick={resetForm}
              className="absolute right-3 top-3 rounded-full bg-foreground/60 p-1.5 text-white transition-colors hover:bg-foreground/80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple/10">
              <svg className="h-10 w-10 text-purple" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Scan a Package Label
            </h2>
            <p className="mb-6 text-sm text-text-muted">
              Take a photo of the shipping label and AI will extract the details automatically.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-purple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-hover">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Take Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Manual Entry Form */}
      <div className="rounded-2xl border border-foreground/5 bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-base font-semibold text-foreground">
          Package Details
        </h3>
        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="tracking" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Tracking Number
              </label>
              <input
                id="tracking"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="1Z999AA10123456784"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>
            <div>
              <label htmlFor="recipient" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                id="recipient"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Guest name"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="carrier" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Carrier
              </label>
              <select
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground outline-none transition-colors focus:border-purple"
              >
                <option value="">Select carrier</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="USPS">USPS</option>
                <option value="Amazon">Amazon</option>
                <option value="DHL">DHL</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="recipientType" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Recipient Type
              </label>
              <select
                id="recipientType"
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground outline-none transition-colors focus:border-purple"
              >
                <option value="guest">Guest</option>
                <option value="employee">Employee</option>
                <option value="vendor">Vendor</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="room" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Room Number
              </label>
              <input
                id="room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="1204"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-foreground/70">
                Storage Location
              </label>
              <input
                id="location"
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Shelf A3, Back office, etc."
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-foreground/70">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fragile, oversized, multiple boxes..."
              className="w-full resize-none rounded-lg border border-foreground/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !recipientName.trim()}
            className="h-11 w-full rounded-lg bg-purple text-sm font-medium text-white transition-colors hover:bg-purple-hover disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log Package"}
          </button>
        </form>
      </div>
    </div>
  );
}
