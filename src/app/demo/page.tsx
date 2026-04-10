"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ────────────────────────────────────────────────────────────────────────────
// Types (mirror real types but no imports needed)
// ────────────────────────────────────────────────────────────────────────────
type PackageStatus = "received" | "notified" | "picked_up" | "returned" | "missing";
type CarrierType = "FedEx" | "UPS" | "USPS" | "Amazon" | "DHL";
type RecipientType = "guest" | "employee" | "vendor";
type NotificationStatus = "pending" | "sent" | "failed" | "no_contact";

interface DemoPackage {
  id: string;
  tracking_number: string | null;
  carrier: CarrierType;
  recipient_name: string;
  recipient_type: RecipientType;
  room_number: string | null;
  status: PackageStatus;
  storage_location: string | null;
  notes: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  checkout_date: string | null;
  notification_status: NotificationStatus;
  notified_at: string | null;
  storage_fee_charged: boolean;
  received_at: string;
  picked_up_at: string | null;
  picked_up_by: string | null;
}

interface DemoEvent {
  id: string;
  package_id: string;
  event_type: string;
  details: Record<string, string> | null;
  created_at: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Fake Data Generation
// ────────────────────────────────────────────────────────────────────────────
function daysAgo(n: number, hour = 9, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const today = new Date().toISOString().split("T")[0];

const FAKE_PACKAGES: DemoPackage[] = [
  // ── Received (12) ──
  { id: "d001", tracking_number: "1Z999AA10123456784", carrier: "UPS", recipient_name: "James Rodriguez", recipient_type: "guest", room_number: "1204", status: "received", storage_location: "Shelf A-1", notes: null, guest_email: "j.rodriguez@gmail.com", guest_phone: "(312) 555-0147", checkout_date: daysFromNow(2), notification_status: "sent", notified_at: daysAgo(0, 9, 20), storage_fee_charged: true, received_at: daysAgo(0, 9, 14), picked_up_at: null, picked_up_by: null },
  { id: "d002", tracking_number: "9400111899223100012345", carrier: "USPS", recipient_name: "Sarah Mitchell", recipient_type: "guest", room_number: "803", status: "received", storage_location: "Shelf B-3", notes: "Guest requested hold until Friday", guest_email: "sarah.m@outlook.com", guest_phone: null, checkout_date: daysFromNow(3), notification_status: "sent", notified_at: daysAgo(0, 8, 55), storage_fee_charged: true, received_at: daysAgo(0, 8, 47), picked_up_at: null, picked_up_by: null },
  { id: "d003", tracking_number: "794644790138", carrier: "FedEx", recipient_name: "Michael Chen", recipient_type: "guest", room_number: "1501", status: "received", storage_location: "Back Room", notes: "Fragile - handle with care", guest_email: "mchen88@yahoo.com", guest_phone: "(415) 555-0293", checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(0, 8, 30), storage_fee_charged: true, received_at: daysAgo(0, 8, 22), picked_up_at: null, picked_up_by: null },
  { id: "d004", tracking_number: "TBA123456789000", carrier: "Amazon", recipient_name: "Emily Washington", recipient_type: "guest", room_number: "612", status: "received", storage_location: "Front Desk", notes: null, guest_email: null, guest_phone: "(317) 555-0188", checkout_date: today, notification_status: "sent", notified_at: daysAgo(0, 7, 58), storage_fee_charged: true, received_at: daysAgo(0, 7, 55), picked_up_at: null, picked_up_by: null },
  { id: "d005", tracking_number: "1Z999AA10987654321", carrier: "UPS", recipient_name: "David Thompson", recipient_type: "guest", room_number: "945", status: "received", storage_location: "Shelf A-2", notes: null, guest_email: "dthompson@icloud.com", guest_phone: null, checkout_date: daysFromNow(4), notification_status: "sent", notified_at: daysAgo(1, 14, 10), storage_fee_charged: true, received_at: daysAgo(1, 14, 5), picked_up_at: null, picked_up_by: null },
  { id: "d006", tracking_number: "9400111899223100098765", carrier: "USPS", recipient_name: "Rachel Kim", recipient_type: "guest", room_number: "1108", status: "received", storage_location: "Shelf C-1", notes: null, guest_email: null, guest_phone: null, checkout_date: daysFromNow(2), notification_status: "no_contact", notified_at: null, storage_fee_charged: true, received_at: daysAgo(1, 11, 30), picked_up_at: null, picked_up_by: null },
  { id: "d007", tracking_number: "794644790245", carrier: "FedEx", recipient_name: "William Foster", recipient_type: "guest", room_number: "406", status: "received", storage_location: "Back Room", notes: "Multiple boxes (2 of 3)", guest_email: "wfoster@gmail.com", guest_phone: "(212) 555-0311", checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(1, 10, 45), storage_fee_charged: true, received_at: daysAgo(1, 10, 38), picked_up_at: null, picked_up_by: null },
  { id: "d008", tracking_number: "TBA987654321000", carrier: "Amazon", recipient_name: "Jessica Patel", recipient_type: "guest", room_number: "1302", status: "received", storage_location: "Shelf B-1", notes: null, guest_email: "jpatel@hotmail.com", guest_phone: null, checkout_date: daysFromNow(5), notification_status: "sent", notified_at: daysAgo(2, 16, 20), storage_fee_charged: true, received_at: daysAgo(2, 16, 12), picked_up_at: null, picked_up_by: null },
  { id: "d009", tracking_number: "5432167890123456", carrier: "DHL", recipient_name: "Robert Garcia", recipient_type: "guest", room_number: "718", status: "received", storage_location: "Shelf A-3", notes: null, guest_email: null, guest_phone: "(555) 123-4567", checkout_date: today, notification_status: "sent", notified_at: daysAgo(2, 9, 5), storage_fee_charged: true, received_at: daysAgo(2, 9, 0), picked_up_at: null, picked_up_by: null },
  { id: "d010", tracking_number: "1Z999AA10555666777", carrier: "UPS", recipient_name: "Amanda Turner", recipient_type: "employee", room_number: null, status: "received", storage_location: "Back Office", notes: "Office supplies - accounting dept", guest_email: "aturner@grandmetropolitan.com", guest_phone: null, checkout_date: null, notification_status: "sent", notified_at: daysAgo(3, 10, 15), storage_fee_charged: false, received_at: daysAgo(3, 10, 8), picked_up_at: null, picked_up_by: null },
  { id: "d011", tracking_number: "794644790367", carrier: "FedEx", recipient_name: "Christopher Lee", recipient_type: "guest", room_number: "1015", status: "received", storage_location: "Front Desk", notes: null, guest_email: "chrislee@gmail.com", guest_phone: "(773) 555-0422", checkout_date: daysFromNow(3), notification_status: "sent", notified_at: daysAgo(3, 8, 50), storage_fee_charged: true, received_at: daysAgo(3, 8, 44), picked_up_at: null, picked_up_by: null },
  { id: "d012", tracking_number: "9400111899223100055555", carrier: "USPS", recipient_name: "Catering Plus Inc", recipient_type: "vendor", room_number: null, status: "received", storage_location: "Receiving Dock", notes: "Event supplies for Grand Ballroom - Apr 12", guest_email: "orders@cateringplus.com", guest_phone: null, checkout_date: null, notification_status: "sent", notified_at: daysAgo(0, 10, 30), storage_fee_charged: false, received_at: daysAgo(0, 10, 22), picked_up_at: null, picked_up_by: null },

  // ── Notified (5) ──
  { id: "d013", tracking_number: "TBA111222333000", carrier: "Amazon", recipient_name: "Nicole Adams", recipient_type: "guest", room_number: "520", status: "notified", storage_location: "Shelf B-2", notes: null, guest_email: "nicole.a@gmail.com", guest_phone: null, checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(0, 11, 5), storage_fee_charged: true, received_at: daysAgo(0, 11, 0), picked_up_at: null, picked_up_by: null },
  { id: "d014", tracking_number: "1Z999AA10333444555", carrier: "UPS", recipient_name: "Brian Jackson", recipient_type: "guest", room_number: "1422", status: "notified", storage_location: "Shelf A-4", notes: null, guest_email: "bjackson@proton.me", guest_phone: "(469) 555-0277", checkout_date: daysFromNow(2), notification_status: "sent", notified_at: daysAgo(1, 15, 30), storage_fee_charged: true, received_at: daysAgo(1, 15, 22), picked_up_at: null, picked_up_by: null },
  { id: "d015", tracking_number: "794644790489", carrier: "FedEx", recipient_name: "Laura Martinez", recipient_type: "guest", room_number: "901", status: "notified", storage_location: "Shelf C-2", notes: null, guest_email: null, guest_phone: "(305) 555-0199", checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(2, 13, 40), storage_fee_charged: true, received_at: daysAgo(2, 13, 35), picked_up_at: null, picked_up_by: null },
  { id: "d016", tracking_number: "5432167890987654", carrier: "DHL", recipient_name: "Kevin Wright", recipient_type: "guest", room_number: "1106", status: "notified", storage_location: "Front Desk", notes: "International package - customs cleared", guest_email: "kwright@company.co.uk", guest_phone: null, checkout_date: daysFromNow(4), notification_status: "sent", notified_at: daysAgo(3, 9, 15), storage_fee_charged: true, received_at: daysAgo(3, 9, 10), picked_up_at: null, picked_up_by: null },
  { id: "d017", tracking_number: "9400111899223100077777", carrier: "USPS", recipient_name: "Megan Taylor", recipient_type: "guest", room_number: "315", status: "notified", storage_location: "Shelf B-4", notes: null, guest_email: "megtaylor@live.com", guest_phone: "(614) 555-0355", checkout_date: today, notification_status: "sent", notified_at: daysAgo(1, 7, 50), storage_fee_charged: true, received_at: daysAgo(1, 7, 45), picked_up_at: null, picked_up_by: null },

  // ── Picked Up (8) ──
  { id: "d018", tracking_number: "TBA444555666000", carrier: "Amazon", recipient_name: "Andrew Scott", recipient_type: "guest", room_number: "1208", status: "picked_up", storage_location: "Shelf A-1", notes: null, guest_email: "ascott@gmail.com", guest_phone: null, checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(0, 9, 30), storage_fee_charged: true, received_at: daysAgo(0, 9, 22), picked_up_at: daysAgo(0, 12, 15), picked_up_by: "Andrew Scott" },
  { id: "d019", tracking_number: "1Z999AA10777888999", carrier: "UPS", recipient_name: "Lisa Nguyen", recipient_type: "guest", room_number: "607", status: "picked_up", storage_location: "Shelf B-3", notes: null, guest_email: "lnguyen@yahoo.com", guest_phone: "(404) 555-0188", checkout_date: today, notification_status: "sent", notified_at: daysAgo(1, 10, 10), storage_fee_charged: true, received_at: daysAgo(1, 10, 5), picked_up_at: daysAgo(0, 8, 30), picked_up_by: "Lisa Nguyen" },
  { id: "d020", tracking_number: "794644790512", carrier: "FedEx", recipient_name: "Daniel Park", recipient_type: "guest", room_number: "1340", status: "picked_up", storage_location: "Back Room", notes: null, guest_email: "dpark@outlook.com", guest_phone: null, checkout_date: daysFromNow(-1), notification_status: "sent", notified_at: daysAgo(2, 14, 20), storage_fee_charged: true, received_at: daysAgo(2, 14, 15), picked_up_at: daysAgo(1, 18, 0), picked_up_by: "Daniel Park" },
  { id: "d021", tracking_number: "9400111899223100033333", carrier: "USPS", recipient_name: "Karen Wilson", recipient_type: "guest", room_number: "428", status: "picked_up", storage_location: "Front Desk", notes: null, guest_email: null, guest_phone: "(317) 555-0266", checkout_date: daysFromNow(-2), notification_status: "sent", notified_at: daysAgo(3, 11, 30), storage_fee_charged: true, received_at: daysAgo(3, 11, 22), picked_up_at: daysAgo(2, 15, 45), picked_up_by: "Karen Wilson" },
  { id: "d022", tracking_number: "TBA777888999000", carrier: "Amazon", recipient_name: "Steven Brown", recipient_type: "guest", room_number: "915", status: "picked_up", storage_location: "Shelf C-1", notes: null, guest_email: "sbrown@gmail.com", guest_phone: null, checkout_date: daysFromNow(0), notification_status: "sent", notified_at: daysAgo(0, 7, 40), storage_fee_charged: true, received_at: daysAgo(0, 7, 35), picked_up_at: daysAgo(0, 10, 0), picked_up_by: "Steven Brown" },
  { id: "d023", tracking_number: "1Z999AA10222333444", carrier: "UPS", recipient_name: "Maria Gonzalez", recipient_type: "guest", room_number: "1120", status: "picked_up", storage_location: "Shelf A-2", notes: null, guest_email: "mgonzalez@icloud.com", guest_phone: "(956) 555-0411", checkout_date: daysFromNow(-1), notification_status: "sent", notified_at: daysAgo(4, 13, 5), storage_fee_charged: true, received_at: daysAgo(4, 13, 0), picked_up_at: daysAgo(3, 16, 30), picked_up_by: "Maria Gonzalez" },
  { id: "d024", tracking_number: "794644790634", carrier: "FedEx", recipient_name: "Thomas Harris", recipient_type: "employee", room_number: null, status: "picked_up", storage_location: "Back Office", notes: "Uniform shipment", guest_email: "tharris@grandmetropolitan.com", guest_phone: null, checkout_date: null, notification_status: "sent", notified_at: daysAgo(5, 9, 45), storage_fee_charged: false, received_at: daysAgo(5, 9, 40), picked_up_at: daysAgo(5, 11, 0), picked_up_by: "Thomas Harris" },
  { id: "d025", tracking_number: "5432167890555666", carrier: "DHL", recipient_name: "Jennifer Clark", recipient_type: "guest", room_number: "706", status: "picked_up", storage_location: "Front Desk", notes: null, guest_email: "jclark@gmail.com", guest_phone: null, checkout_date: daysFromNow(-3), notification_status: "sent", notified_at: daysAgo(5, 8, 20), storage_fee_charged: true, received_at: daysAgo(5, 8, 15), picked_up_at: daysAgo(4, 9, 30), picked_up_by: "Jennifer Clark" },

  // ── Returned (2) ──
  { id: "d026", tracking_number: "9400111899223100099999", carrier: "USPS", recipient_name: "Patricia Moore", recipient_type: "guest", room_number: "502", status: "returned", storage_location: "Shelf B-1", notes: "Guest checked out, package returned to sender", guest_email: null, guest_phone: null, checkout_date: daysFromNow(-4), notification_status: "no_contact", notified_at: null, storage_fee_charged: true, received_at: daysAgo(6, 10, 0), picked_up_at: null, picked_up_by: null },
  { id: "d027", tracking_number: "TBA555666777000", carrier: "Amazon", recipient_name: "Gregory Lewis", recipient_type: "guest", room_number: "1019", status: "returned", storage_location: "Front Desk", notes: "Refused by guest - wrong item", guest_email: "glewis@yahoo.com", guest_phone: "(502) 555-0133", checkout_date: daysFromNow(-2), notification_status: "sent", notified_at: daysAgo(4, 15, 0), storage_fee_charged: true, received_at: daysAgo(4, 14, 50), picked_up_at: null, picked_up_by: null },

  // ── Missing (1) ──
  { id: "d028", tracking_number: "794644790756", carrier: "FedEx", recipient_name: "Mark Robinson", recipient_type: "guest", room_number: "1403", status: "missing", storage_location: "Shelf A-3", notes: "Last seen in storage room, investigating", guest_email: "mrobinson@proton.me", guest_phone: "(317) 555-0498", checkout_date: daysFromNow(1), notification_status: "sent", notified_at: daysAgo(3, 14, 30), storage_fee_charged: true, received_at: daysAgo(3, 14, 22), picked_up_at: null, picked_up_by: null },
];

// Audit trails for select packages
const FAKE_EVENTS: DemoEvent[] = [
  { id: "e001", package_id: "d001", event_type: "created", details: { recipient_name: "James Rodriguez", carrier: "UPS", scanned: "true" }, created_at: daysAgo(0, 9, 14) },
  { id: "e002", package_id: "d001", event_type: "notification_sent", details: { method: "email", contact: "j.rodriguez@gmail.com" }, created_at: daysAgo(0, 9, 20) },
  { id: "e003", package_id: "d018", event_type: "created", details: { recipient_name: "Andrew Scott", carrier: "Amazon" }, created_at: daysAgo(0, 9, 22) },
  { id: "e004", package_id: "d018", event_type: "notification_sent", details: { method: "email", contact: "ascott@gmail.com" }, created_at: daysAgo(0, 9, 30) },
  { id: "e005", package_id: "d018", event_type: "status_change", details: { from: "notified", to: "picked_up", picked_up_by: "Andrew Scott" }, created_at: daysAgo(0, 12, 15) },
  { id: "e006", package_id: "d028", event_type: "created", details: { recipient_name: "Mark Robinson", carrier: "FedEx" }, created_at: daysAgo(3, 14, 22) },
  { id: "e007", package_id: "d028", event_type: "notification_sent", details: { method: "email", contact: "mrobinson@proton.me" }, created_at: daysAgo(3, 14, 30) },
  { id: "e008", package_id: "d028", event_type: "status_change", details: { from: "notified", to: "missing" }, created_at: daysAgo(1, 16, 0) },
  { id: "e009", package_id: "d003", event_type: "created", details: { recipient_name: "Michael Chen", carrier: "FedEx", scanned: "true" }, created_at: daysAgo(0, 8, 22) },
  { id: "e010", package_id: "d003", event_type: "notification_sent", details: { method: "email", contact: "mchen88@yahoo.com" }, created_at: daysAgo(0, 8, 30) },
  { id: "e011", package_id: "d003", event_type: "edited", details: { note: "Added fragile handling note" }, created_at: daysAgo(0, 8, 35) },
];

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────
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

const CARRIERS: CarrierType[] = ["FedEx", "UPS", "USPS", "Amazon", "DHL"];
const RECIPIENT_TYPES: RecipientType[] = ["guest", "employee", "vendor"];
const CHART_COLORS = ["#6000da", "#7a2ffc", "#22c55e", "#f59e0b", "#ef4444", "#6b7280"];

type DemoView = "dashboard" | "scan" | "reports" | "settings";
type StatusFilter = "all" | "received" | "picked_up" | "missing" | "notified" | "returned";
type DateRange = "today" | "week" | "month" | "all";

// ────────────────────────────────────────────────────────────────────────────
// Escalation logic (mirrored from real app)
// ────────────────────────────────────────────────────────────────────────────
function getEscalation(pkg: DemoPackage) {
  if (pkg.status !== "received" && pkg.status !== "notified") {
    return { level: "none" as const, label: "", className: "", hoursUnclaimed: 0 };
  }
  const hoursUnclaimed = (Date.now() - new Date(pkg.received_at).getTime()) / (1000 * 60 * 60);
  if (pkg.checkout_date) {
    const todayStr = new Date().toISOString().split("T")[0];
    if (pkg.checkout_date === todayStr) {
      return { level: "checkout" as const, label: "CHECKOUT TODAY", className: "bg-red-600 text-white animate-pulse", hoursUnclaimed };
    }
  }
  if (hoursUnclaimed > 72) return { level: "critical" as const, label: "> 72hrs", className: "bg-red-100 text-red-700", hoursUnclaimed };
  if (hoursUnclaimed > 48) return { level: "orange" as const, label: "> 48hrs", className: "bg-orange-100 text-orange-700", hoursUnclaimed };
  if (hoursUnclaimed > 24) return { level: "warning" as const, label: "> 24hrs", className: "bg-yellow-100 text-yellow-700", hoursUnclaimed };
  return { level: "none" as const, label: "", className: "", hoursUnclaimed };
}

// ────────────────────────────────────────────────────────────────────────────
// Toast Component
// ────────────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 right-6 z-[100] animate-[slideUp_0.3s_ease-out] rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-white shadow-xl md:bottom-8">
      {message}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Demo Page
// ────────────────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [activeView, setActiveView] = useState<DemoView>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DemoPackage | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const navItems: { label: string; view: DemoView; icon: React.ReactNode }[] = [
    {
      label: "Dashboard", view: "dashboard",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
    },
    {
      label: "Scan", view: "scan",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>,
    },
    {
      label: "Reports", view: "reports",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    },
    {
      label: "Settings", view: "settings",
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-400 px-4 text-sm font-medium text-white">
        <span>You&apos;re viewing a demo</span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold transition-colors hover:bg-white/30"
        >
          Start Free Trial
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-foreground/5 bg-white pt-10 md:flex">
        <div className="flex h-16 items-center border-b border-foreground/5 px-6">
          <span className="text-lg font-bold tracking-tight text-foreground">Received</span>
        </div>

        {/* Property name */}
        <div className="px-3 pt-4 pb-2">
          <div className="rounded-lg bg-surface-alt px-3 py-2">
            <p className="text-xs font-medium text-text-muted">Property</p>
            <p className="truncate text-sm font-medium text-foreground">The Grand Metropolitan Hotel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setActiveView(item.view); setSelectedPackage(null); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeView === item.view
                  ? "bg-purple/10 text-purple font-medium"
                  : "text-text-muted hover:bg-surface-alt hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Demo badge */}
        <div className="border-t border-foreground/5 p-4">
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-amber-700">Demo Mode</p>
            <p className="text-[10px] text-amber-600">No data is saved</p>
          </div>
          <div className="mt-3 flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">
              DM
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">Demo Manager</p>
              <p className="text-[10px] capitalize text-text-muted">admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="fixed inset-x-0 top-10 z-40 flex h-14 items-center justify-between border-b border-foreground/5 bg-white px-4 md:hidden">
        <span className="text-lg font-bold tracking-tight text-foreground">Received</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">DEMO</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">
            DM
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-foreground/5 bg-white md:hidden">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { setActiveView(item.view); setSelectedPackage(null); }}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              activeView === item.view ? "text-purple" : "text-text-muted"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="md:pl-64">
        <div className="px-4 pb-20 pt-[96px] md:p-8 md:pb-8 md:pt-[72px]">
          {selectedPackage ? (
            <PackageDetail
              pkg={selectedPackage}
              events={FAKE_EVENTS.filter(e => e.package_id === selectedPackage.id)}
              onBack={() => setSelectedPackage(null)}
              showToast={showToast}
            />
          ) : activeView === "dashboard" ? (
            <DashboardView onSelectPackage={setSelectedPackage} />
          ) : activeView === "scan" ? (
            <ScanView showToast={showToast} />
          ) : activeView === "reports" ? (
            <ReportsView />
          ) : (
            <SettingsView showToast={showToast} />
          )}
        </div>
      </main>

      {/* Floating CTA */}
      <Link
        href="/signup"
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-br from-purple to-purple-light px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple/25 transition-all hover:brightness-110 active:scale-95 md:bottom-6 md:right-6"
      >
        Start Free Trial
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Dashboard View
// ════════════════════════════════════════════════════════════════════════════
function DashboardView({ onSelectPackage }: { onSelectPackage: (p: DemoPackage) => void }) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>("all");

  const todayStr = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const packagesToday = FAKE_PACKAGES.filter(p => p.received_at.startsWith(todayStr)).length;
  const awaitingPickup = FAKE_PACKAGES.filter(p => p.status === "received" || p.status === "notified").length;
  const deliveredToday = FAKE_PACKAGES.filter(p => p.status === "picked_up" && p.picked_up_at?.startsWith(todayStr)).length;
  const totalThisMonth = FAKE_PACKAGES.filter(p => p.received_at.startsWith(thisMonth)).length;

  // Alerts — use lazy initializer to avoid Date.now() on every render
  const [dashNow] = useState(() => Date.now());
  const unclaimed = FAKE_PACKAGES.filter(p => p.status === "received" || p.status === "notified");
  const over24 = unclaimed.filter(p => (dashNow - new Date(p.received_at).getTime()) / 3600000 > 24).length;
  const over48 = unclaimed.filter(p => (dashNow - new Date(p.received_at).getTime()) / 3600000 > 48).length;
  const checkoutToday = unclaimed.filter(p => p.checkout_date === todayStr).length;

  // Date filtering
  function isInDateRange(dateStr: string): boolean {
    if (dateRange === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (dateRange === "today") return dateStr.startsWith(todayStr);
    if (dateRange === "week") return d >= new Date(now.getTime() - 7 * 86400000);
    if (dateRange === "month") return dateStr.startsWith(thisMonth);
    return true;
  }

  const filtered = FAKE_PACKAGES.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (carrierFilter !== "all" && p.carrier !== carrierFilter) return false;
    if (recipientTypeFilter !== "all" && p.recipient_type !== recipientTypeFilter) return false;
    if (!isInDateRange(p.received_at)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.recipient_name.toLowerCase().includes(q) ||
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Packages</h1>
        <button
          onClick={() => {}}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple px-5 text-sm font-medium text-white transition-colors hover:bg-purple-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Package
        </button>
      </div>

      {/* Alert Badges */}
      {(over24 > 0 || over48 > 0 || checkoutToday > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {checkoutToday > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white animate-pulse">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {checkoutToday} checking out today with packages
            </div>
          )}
          {over48 > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {over48} unclaimed &gt; 48hrs
            </div>
          )}
          {over24 > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {over24} unclaimed &gt; 24hrs
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

      {/* Storage fee summary */}
      <div className="mb-6 rounded-xl border border-foreground/5 bg-white p-4 shadow-sm">
        <p className="text-sm text-text-muted">
          Storage fees this month: <span className="font-semibold text-foreground">${(totalThisMonth * 5).toFixed(2)}</span> ({totalThisMonth} packages)
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
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
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
        <div className="flex flex-wrap gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple">
            <option value="all">All Carriers</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={recipientTypeFilter} onChange={(e) => setRecipientTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-foreground/10 bg-white px-3 text-sm text-foreground outline-none focus:border-purple">
            <option value="all">All Types</option>
            {RECIPIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Package list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-foreground/5 bg-white py-16 shadow-sm">
          <svg className="mb-4 h-12 w-12 text-foreground/10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          <p className="mb-1 text-sm font-medium text-text-muted">No packages match your filters</p>
          <p className="text-xs text-text-muted/60">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((pkg) => {
              const badge = STATUS_BADGES[pkg.status];
              const esc = getEscalation(pkg);
              return (
                <div
                  key={pkg.id}
                  onClick={() => onSelectPackage(pkg)}
                  className="cursor-pointer rounded-xl border border-foreground/5 bg-white p-4 shadow-sm transition-colors hover:bg-surface-alt/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pkg.recipient_name}</p>
                      {pkg.room_number && <p className="text-xs text-text-muted">Room {pkg.room_number}</p>}
                    </div>
                    <div className="flex gap-1">
                      {esc.level !== "none" && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${esc.className}`}>{esc.label}</span>
                      )}
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-text-muted">
                    {pkg.carrier && <p>{pkg.carrier}{pkg.tracking_number ? ` -- ${pkg.tracking_number}` : ""}</p>}
                    {pkg.storage_location && <p>Location: {pkg.storage_location}</p>}
                    <p>{new Date(pkg.received_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
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
                    {["Tracking #", "Recipient", "Carrier", "Type", "Status", "Received", "Storage", ""].map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted/60">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {filtered.map((pkg) => {
                    const badge = STATUS_BADGES[pkg.status];
                    const esc = getEscalation(pkg);
                    return (
                      <tr key={pkg.id} onClick={() => onSelectPackage(pkg)} className="cursor-pointer hover:bg-surface-alt/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-foreground/70">{pkg.tracking_number || "---"}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">{pkg.recipient_name}</div>
                          {pkg.room_number && <div className="text-xs text-text-muted">Room {pkg.room_number}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{pkg.carrier}</td>
                        <td className="px-6 py-4 text-sm text-text-muted capitalize">{pkg.recipient_type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                            {esc.level !== "none" && (
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${esc.className}`}>{esc.label}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {new Date(pkg.received_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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

// ════════════════════════════════════════════════════════════════════════════
// Package Detail View
// ════════════════════════════════════════════════════════════════════════════
function PackageDetail({ pkg, events, onBack, showToast }: {
  pkg: DemoPackage;
  events: DemoEvent[];
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const badge = STATUS_BADGES[pkg.status];
  const notifBadge = NOTIFICATION_BADGES[pkg.notification_status];
  const escalation = getEscalation(pkg);

  function printSlip() {
    setShowPrintSlip(true);
    setTimeout(() => {
      window.print();
      setShowPrintSlip(false);
    }, 100);
  }

  function demoAction(action: string) {
    showToast(`Demo mode -- "${action}" is not available in the demo`);
  }

  if (showPrintSlip) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-8 print:p-0">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold">Package Pickup Slip</h1>
          <div className="flex justify-center">
            <QRCodeSVG value={`https://app.receivedhq.com/demo/packages/${pkg.id}`} size={200} />
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
          <button onClick={onBack} className="text-text-muted hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-foreground">{pkg.recipient_name}</h1>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
          {escalation.level !== "none" && (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${escalation.className}`}>{escalation.label}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(pkg.status === "received" || pkg.status === "notified") && (
            <button onClick={() => demoAction("Mark Picked Up")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              Mark Picked Up
            </button>
          )}
          {pkg.status !== "missing" && pkg.status !== "picked_up" && (
            <button onClick={() => demoAction("Mark Missing")} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
              Mark Missing
            </button>
          )}
          <button onClick={printSlip} className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors">
            Print Pickup Slip
          </button>
          <button onClick={() => demoAction("Edit")} className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors">
            Edit
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Package Details Card */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Package Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Tracking Number" value={pkg.tracking_number} mono />
              <DetailField label="Carrier" value={pkg.carrier} />
              <DetailField label="Recipient Type" value={pkg.recipient_type} capitalize />
              <DetailField label="Room Number" value={pkg.room_number} />
              <DetailField label="Checkout Date" value={pkg.checkout_date ? new Date(pkg.checkout_date + "T12:00:00").toLocaleDateString() : null} />
              <DetailField label="Storage Location" value={pkg.storage_location} />
              <DetailField label="Email" value={pkg.guest_email} />
              <DetailField label="Phone" value={pkg.guest_phone} />
              <div className="sm:col-span-2">
                <DetailField label="Notes" value={pkg.notes} />
              </div>
            </div>
          </div>

          {/* Status Details */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Status Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-text-muted/60 uppercase tracking-wider">Notification</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${notifBadge.className}`}>{notifBadge.label}</span>
              </div>
              {pkg.notified_at && <DetailField label="Notified At" value={new Date(pkg.notified_at).toLocaleString()} />}
              <DetailField label="Received At" value={new Date(pkg.received_at).toLocaleString()} />
              {pkg.picked_up_at && (
                <>
                  <DetailField label="Picked Up At" value={new Date(pkg.picked_up_at).toLocaleString()} />
                  <DetailField label="Picked Up By" value={pkg.picked_up_by} />
                </>
              )}
              {pkg.storage_fee_charged && <DetailField label="Storage Fee" value="$5.00" />}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Activity Timeline</h3>
            {events.length === 0 ? (
              <p className="text-sm text-text-muted">No activity recorded.</p>
            ) : (
              <div className="space-y-4">
                {events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple/40" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium capitalize">{event.event_type.replace(/_/g, " ")}</span>
                        {event.details?.from && (
                          <span className="text-text-muted"> from {event.details.from} to {event.details.to}</span>
                        )}
                        {event.details?.picked_up_by && (
                          <span className="text-text-muted"> by {event.details.picked_up_by}</span>
                        )}
                        {event.details?.method && (
                          <span className="text-text-muted"> via {event.details.method} to {event.details.contact}</span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted/60">{new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm text-center">
            <h3 className="mb-4 text-base font-semibold text-foreground">QR Code</h3>
            <div className="flex justify-center mb-3">
              <QRCodeSVG value={`https://app.receivedhq.com/demo/packages/${pkg.id}`} size={160} />
            </div>
            <p className="text-xs text-text-muted">Scan to view this package</p>
            <button onClick={printSlip} className="mt-3 w-full rounded-lg border border-foreground/10 py-2 text-sm font-medium text-foreground hover:bg-surface-alt transition-colors">
              Print Pickup Slip
            </button>
          </div>
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-foreground">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">ID</span>
                <span className="font-mono text-xs text-foreground/60">{pkg.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Received</span>
                <span className="text-foreground">{new Date(pkg.received_at).toLocaleDateString()}</span>
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

function DetailField({ label, value, mono, capitalize }: { label: string; value: string | null | undefined; mono?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted/60 uppercase tracking-wider">{label}</p>
      <p className={`mt-0.5 text-sm text-foreground ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>{value || "---"}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Scan Demo View
// ════════════════════════════════════════════════════════════════════════════
function ScanView({ showToast }: { showToast: (msg: string) => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "scanned" | "success">("idle");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [carrier, setCarrier] = useState("");
  const [recipientType, setRecipientType] = useState("guest");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  function startScan() {
    setPhase("scanning");
    setTimeout(() => {
      setTrackingNumber("1Z999AA10456789012");
      setRecipientName("Alexandra Bennett");
      setCarrier("UPS");
      setPhase("scanned");
    }, 2000);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPhase("success");
    showToast("Package logged successfully (demo)");
  }

  function resetForm() {
    setPhase("idle");
    setTrackingNumber("");
    setRecipientName("");
    setCarrier("");
    setRecipientType("guest");
    setRoomNumber("");
    setCheckoutDate("");
    setGuestEmail("");
    setGuestPhone("");
    setStorageLocation("");
    setNotes("");
  }

  if (phase === "success") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center rounded-2xl border border-foreground/5 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Package Logged</h2>
          <p className="mb-6 text-sm text-text-muted">
            {recipientName || "Alexandra Bennett"}&apos;s package has been recorded successfully.
          </p>
          <div className="flex gap-3">
            <button onClick={resetForm} className="rounded-lg bg-purple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-hover">
              Scan Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Log a Package</h1>
        <p className="mt-1 text-sm text-text-muted">Scan a label or enter details manually.</p>
      </div>

      {/* Scan area */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-foreground/5 bg-white shadow-sm">
        {phase === "scanning" ? (
          <div className="relative flex h-56 items-center justify-center bg-foreground/5">
            {/* Fake scanning animation */}
            <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-purple" />
            <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-[scanLine_2s_ease-in-out_infinite] rounded-full bg-purple/60" style={{ animationDelay: '0.5s' }} />
            <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple border-t-transparent" />
              <span className="text-sm font-medium text-foreground">AI scanning label...</span>
            </div>
          </div>
        ) : phase === "scanned" ? (
          <div className="relative">
            <div className="flex h-56 items-center justify-center bg-foreground/5">
              <div className="text-center">
                <div className="mb-2 flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Label scanned successfully</p>
                <p className="text-xs text-text-muted">AI extracted: UPS, 1Z999AA10456789012, Alexandra Bennett</p>
              </div>
            </div>
            <button onClick={resetForm} className="absolute right-3 top-3 rounded-full bg-foreground/60 p-1.5 text-white transition-colors hover:bg-foreground/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-8 text-center sm:p-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple/10">
              <svg className="h-10 w-10 text-purple" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Scan a Package Label</h2>
            <p className="mb-6 text-sm text-text-muted">Take a photo of the shipping label and AI will extract the details automatically.</p>
            <button onClick={startScan} className="inline-flex items-center gap-2 rounded-lg bg-purple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-hover">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Simulate Scan
            </button>
          </div>
        )}
      </div>

      {/* Enrichment Form */}
      <div className="rounded-2xl border border-foreground/5 bg-white p-5 shadow-sm sm:p-8">
        <h3 className="mb-6 text-base font-semibold text-foreground">Package Details</h3>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Recipient Name <span className="text-red-500">*</span></label>
              <input type="text" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Guest name"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Tracking Number</label>
              <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="1Z999AA10123456784"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Carrier</label>
              <select value={carrier} onChange={(e) => setCarrier(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground outline-none transition-colors focus:border-purple">
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
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Recipient Type</label>
              <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground outline-none transition-colors focus:border-purple">
                <option value="guest">Guest</option>
                <option value="employee">Employee</option>
                <option value="vendor">Vendor</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Room Number</label>
              <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="1204"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Guest Checkout Date</label>
              <input type="date" value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground outline-none transition-colors focus:border-purple" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Guest Email</label>
              <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="guest@example.com"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Guest Phone</label>
              <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="(555) 123-4567"
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Storage Location</label>
            <input type="text" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="Shelf B-3, Back office, etc."
              className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Fragile, oversized, multiple boxes..."
              className="w-full resize-none rounded-lg border border-foreground/10 bg-surface-alt px-4 py-3 text-sm text-foreground placeholder-foreground/30 outline-none transition-colors focus:border-purple" />
          </div>
          <button type="submit" disabled={!recipientName.trim()}
            className="h-11 w-full rounded-lg bg-purple text-sm font-medium text-white transition-colors hover:bg-purple-hover disabled:opacity-50">
            Log Package
          </button>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Reports Demo View
// ════════════════════════════════════════════════════════════════════════════
function ReportsView() {
  const [reportNow] = useState(() => Date.now());

  // Daily volume (last 7 days)
  const volumeData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(reportNow);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const count = FAKE_PACKAGES.filter(p => p.received_at.startsWith(dayStr)).length;
      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: count || (i % 3) + 2, // Deterministic fallback for demo visual
      });
    }
    return data;
  }, [reportNow]);

  // Carrier distribution
  const carrierCounts: Record<string, number> = {};
  FAKE_PACKAGES.forEach(p => { carrierCounts[p.carrier] = (carrierCounts[p.carrier] || 0) + 1; });
  const carrierData = Object.entries(carrierCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Recipient type
  const typeCounts: Record<string, number> = {};
  FAKE_PACKAGES.forEach(p => { typeCounts[p.recipient_type] = (typeCounts[p.recipient_type] || 0) + 1; });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Unclaimed aging
  const unclaimed = FAKE_PACKAGES.filter(p => p.status === "received" || p.status === "notified");
  const aging: Record<string, number> = { "< 12hrs": 0, "12-24hrs": 0, "24-48hrs": 0, "48-72hrs": 0, "> 72hrs": 0 };
  unclaimed.forEach(p => {
    const hours = (reportNow - new Date(p.received_at).getTime()) / 3600000; // stable via useState initializer
    if (hours < 12) aging["< 12hrs"]++;
    else if (hours < 24) aging["12-24hrs"]++;
    else if (hours < 48) aging["24-48hrs"]++;
    else if (hours < 72) aging["48-72hrs"]++;
    else aging["> 72hrs"]++;
  });
  const agingData = Object.entries(aging).map(([name, value]) => ({ name, value }));

  // Stats
  const pickedUp = FAKE_PACKAGES.filter(p => p.status === "picked_up" && p.picked_up_at);
  const avgPickupHours = pickedUp.length > 0
    ? pickedUp.reduce((sum, p) => sum + (new Date(p.picked_up_at!).getTime() - new Date(p.received_at).getTime()) / 3600000, 0) / pickedUp.length
    : 0;

  // Monthly totals (fake 3 months)
  const monthlyData = [
    { month: "April 2026", received: FAKE_PACKAGES.length, picked_up: pickedUp.length, missing: 1 },
    { month: "March 2026", received: 312, picked_up: 298, missing: 2 },
    { month: "February 2026", received: 287, picked_up: 279, missing: 0 },
  ];

  function exportCSV() {
    const headers = ["Received At", "Recipient", "Type", "Room", "Tracking #", "Carrier", "Status", "Storage Location", "Notification", "Checkout Date", "Notes"];
    const rows = FAKE_PACKAGES.map(p => [
      p.received_at, p.recipient_name, p.recipient_type, p.room_number || "",
      p.tracking_number || "", p.carrier, p.status, p.storage_location || "",
      p.notification_status, p.checkout_date || "", p.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `received-demo-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <button onClick={exportCSV}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-foreground/10 px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt">
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
          <p className="mt-1 text-3xl font-bold text-foreground">{FAKE_PACKAGES.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Avg Pickup Time</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{avgPickupHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Currently Unclaimed</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{unclaimed.length}</p>
        </div>
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <p className="text-sm text-text-muted">Pickup Rate</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{((pickedUp.length / FAKE_PACKAGES.length) * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Package Volume (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6000da" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Packages by Carrier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={carrierData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {carrierData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Packages by Recipient Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
                  {agingData.map((_, i) => <Cell key={i} fill={["#22c55e", "#a3e635", "#f59e0b", "#f97316", "#ef4444"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Totals */}
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
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-surface-alt/50">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{row.month}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{row.received}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{row.picked_up}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{row.missing}</td>
                  <td className="px-6 py-3 text-sm text-text-muted">{((row.picked_up / row.received) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Settings Demo View
// ════════════════════════════════════════════════════════════════════════════
function SettingsView({ showToast }: { showToast: (msg: string) => void }) {
  const [activeTab, setActiveTab] = useState<"team" | "property" | "notifications" | "storage">("team");

  // Team state
  const fakeTeam = [
    { id: "s1", name: "Sarah Mitchell", role: "admin", initials: "SM" },
    { id: "s2", name: "James Rodriguez", role: "manager", initials: "JR" },
    { id: "s3", name: "Emily Chen", role: "clerk", initials: "EC" },
  ];

  // Property state
  const [propName, setPropName] = useState("The Grand Metropolitan Hotel");
  const [propAddress, setPropAddress] = useState("350 West Market Street, Indianapolis, IN 46204");
  const [propPhone, setPropPhone] = useState("(317) 555-0100");

  // Notifications state
  const DEFAULT_TEMPLATE = "Hello {{guest_name}}, your package from {{carrier}} has arrived at {{property_name}}. {{pickup_location}} Tracking: {{tracking_number}}";
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [instructions, setInstructions] = useState("Please visit the front desk for pickup.");

  // Storage state
  const [storageEnabled, setStorageEnabled] = useState(true);
  const [storageAmount, setStorageAmount] = useState("5.00");

  function renderPreview() {
    let preview = template;
    preview = preview.replace(/\{\{guest_name\}\}/g, "John Smith");
    preview = preview.replace(/\{\{property_name\}\}/g, propName);
    preview = preview.replace(/\{\{carrier\}\}/g, "FedEx");
    preview = preview.replace(/\{\{tracking_number\}\}/g, "1Z999AA10123456784");
    preview = preview.replace(/\{\{pickup_location\}\}/g, instructions);
    return preview;
  }

  const tabs = [
    { label: "Team", value: "team" as const },
    { label: "Property", value: "property" as const },
    { label: "Notifications", value: "notifications" as const },
    { label: "Storage Fees", value: "storage" as const },
  ];

  const variables = [
    { key: "{{guest_name}}", desc: "Recipient name" },
    { key: "{{property_name}}", desc: "Property name" },
    { key: "{{carrier}}", desc: "Carrier (FedEx, UPS, etc.)" },
    { key: "{{tracking_number}}", desc: "Tracking number" },
    { key: "{{pickup_location}}", desc: "Pickup instructions" },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-foreground">Settings</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-surface-alt p-1">
        {tabs.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value ? "bg-white text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Invite Team Member</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input type="email" placeholder="colleague@hotel.com"
                className="h-10 flex-1 rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
              <select className="h-10 rounded-lg border border-foreground/10 bg-surface-alt px-3 text-sm outline-none focus:border-purple">
                <option value="clerk">Clerk</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={() => showToast('Demo mode -- invites are not sent')}
                className="h-10 rounded-lg bg-purple px-5 text-sm font-medium text-white hover:bg-purple-hover">
                Send Invite
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">Team Members</h3>
            <div className="space-y-3">
              {fakeTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg bg-surface-alt p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple/10 text-xs font-medium text-purple">{member.initials}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name} {member.id === "s1" && <span className="text-text-muted">(you)</span>}</p>
                      <p className="text-xs capitalize text-text-muted">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      )}

      {/* Property Tab */}
      {activeTab === "property" && (
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Property Information</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Property Name</label>
              <input type="text" value={propName} onChange={e => setPropName(e.target.value)}
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Address</label>
              <input type="text" value={propAddress} onChange={e => setPropAddress(e.target.value)}
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/70">Phone</label>
              <input type="tel" value={propPhone} onChange={e => setPropPhone(e.target.value)}
                className="h-11 w-full rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
            </div>
            <button onClick={() => showToast('Demo mode -- changes are not saved')}
              className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
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
              <button onClick={() => showToast('Demo mode -- template not saved')}
                className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover">
                Save Template
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-foreground">Preview</h3>
            <div className="rounded-lg border border-foreground/10 bg-surface-alt p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{renderPreview()}</p>
            </div>
            <p className="mt-2 text-xs text-text-muted">This is how the notification will appear to guests.</p>
          </div>
        </div>
      )}

      {/* Storage Fees Tab */}
      {activeTab === "storage" && (
        <div className="rounded-xl border border-foreground/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Storage Fee Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Enable Storage Fees</p>
                <p className="text-xs text-text-muted">When enabled, each logged package gets a fee recorded.</p>
              </div>
              <button onClick={() => setStorageEnabled(!storageEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${storageEnabled ? "bg-purple" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${storageEnabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {storageEnabled && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/70">Fee Amount per Package ($)</label>
                <input type="number" step="0.01" min="0" value={storageAmount} onChange={(e) => setStorageAmount(e.target.value)}
                  className="h-11 w-40 rounded-lg border border-foreground/10 bg-surface-alt px-4 text-sm outline-none focus:border-purple" />
              </div>
            )}
            <button onClick={() => showToast('Demo mode -- settings not saved')}
              className="h-10 rounded-lg bg-purple px-6 text-sm font-medium text-white hover:bg-purple-hover">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
