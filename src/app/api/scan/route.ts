import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Reject oversized payloads (10MB base64 limit)
    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI scanning not configured" },
        { status: 500 }
      );
    }

    // Strip the data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: 'Extract the following from this shipping label photo: tracking number, carrier name (FedEx, UPS, USPS, Amazon, DHL, or Other), and recipient name. Return ONLY valid JSON with no markdown formatting: {"tracking_number": "...", "carrier": "...", "recipient_name": "..."}. Use null for any field you cannot determine.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: "AI scanning failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      tracking_number: result.tracking_number || null,
      carrier: result.carrier || null,
      recipient_name: result.recipient_name || null,
    });
  } catch (err) {
    console.error("Scan API error:", err);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
