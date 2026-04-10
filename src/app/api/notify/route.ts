import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// TODO: Wire up actual email sending service (Resend, SendGrid, nodemailer, etc.)
// For now, this logs the notification and marks it as "sent" in the database.
// Replace the console.log with your email provider of choice.

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { package_id } = body;

    if (!package_id) {
      return NextResponse.json({ error: "Missing package_id" }, { status: 400 });
    }

    // Get package info
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("*, properties(*)")
      .eq("id", package_id)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const property = (pkg as Record<string, unknown>).properties as Record<string, string> | null;
    const email = pkg.guest_email;
    const phone = pkg.guest_phone;

    if (!email && !phone) {
      return NextResponse.json({ error: "No contact info" }, { status: 400 });
    }

    // Build notification message from template (will be used when email service is wired up)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const notificationBody = (property?.notification_template as string ||
      "Your package from {{carrier}} has arrived at {{property_name}}. {{pickup_location}}")
      .replace(/\{\{guest_name\}\}/g, pkg.recipient_name || "Guest")
      .replace(/\{\{property_name\}\}/g, property?.name || "the hotel")
      .replace(/\{\{carrier\}\}/g, pkg.carrier || "your carrier")
      .replace(/\{\{tracking_number\}\}/g, pkg.tracking_number || "N/A")
      .replace(/\{\{pickup_location\}\}/g, property?.pickup_instructions as string || "Please visit the front desk.");

    // TODO: Actually send the email here
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@receivedhq.com',
    //   to: email,
    //   subject: `Your package has arrived at ${property?.name}`,
    //   text: template,
    // });

    // Verify the requesting user has permission (must be manager/admin or the staff who logged the package)
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, role, property_id")
      .eq("user_id", user.id)
      .single();

    if (!staffData) {
      return NextResponse.json({ error: "No staff record found" }, { status: 403 });
    }

    const isManagerOrAdmin = staffData.role === "manager" || staffData.role === "admin";
    const isPackageLogger = pkg.received_by === staffData.id;
    if (!isManagerOrAdmin && !isPackageLogger) {
      return NextResponse.json({ error: "Not authorized to trigger notifications" }, { status: 403 });
    }

    // Update notification status — keep package status as-is, don't set notified_at until actually delivered
    const { error: updateError } = await supabase
      .from("packages")
      .update({
        notification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", package_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to queue notification" }, { status: 403 });
    }

    // Log audit event
    await supabase.from("package_events").insert({
      package_id: package_id,
      event_type: "notification_queued",
      details: {
        method: email ? "email" : "phone",
        description: "Notification queued for delivery",
        triggered_by: staffData.id,
      },
      created_by: staffData.id,
    });

    return NextResponse.json({ success: true, message: "Notification queued" });
  } catch (err) {
    console.error("Notify API error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
