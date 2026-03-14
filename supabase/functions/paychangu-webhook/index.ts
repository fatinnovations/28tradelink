import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Compute HMAC-SHA256 hex digest using Web Crypto API */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WEBHOOK_SECRET = Deno.env.get("PAYCHANGU_WEBHOOK_SECRET") || "";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();

    // --- Signature verification ---
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get("Signature") || req.headers.get("signature") || "";
      if (!signature) {
        console.error("Missing Signature header on webhook request");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const computed = await hmacSha256Hex(WEBHOOK_SECRET, rawBody);
      if (!timingSafeEqual(computed, signature.toLowerCase())) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("PAYCHANGU_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let payload: Record<string, any>;
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data || payload;
    const event = String(payload.event || payload.event_type || data.event || data.event_type || "").toLowerCase();

    const status = String(
      data.status ||
        data.payment_status ||
        payload.status ||
        payload.payment_status ||
        "",
    ).toLowerCase();

    const chargeId = String(data.charge_id || payload.charge_id || "");
    const refId = String(data.ref_id || payload.ref_id || "");
    const txRef = String(data.tx_ref || payload.tx_ref || "");
    const metadataOrderId = String(data.metadata?.order_id || payload.metadata?.order_id || "");

    const trackingCandidates = [chargeId, txRef, refId].filter(Boolean);
    const idCandidates = [metadataOrderId, refId, txRef, chargeId].filter((v) => UUID_REGEX.test(v));

    let order: { id: string; status: string | null; payment_status: string | null } | null = null;

    for (const candidate of trackingCandidates) {
      const { data: found } = await supabase
        .from("orders")
        .select("id, status, payment_status")
        .eq("tracking_number", candidate)
        .maybeSingle();

      if (found) {
        order = found;
        break;
      }
    }

    if (!order) {
      for (const candidate of idCandidates) {
        const { data: found } = await supabase
          .from("orders")
          .select("id, status, payment_status")
          .eq("id", candidate)
          .maybeSingle();

        if (found) {
          order = found;
          break;
        }
      }
    }

    if (!order) {
      console.error("Webhook order lookup failed", {
        event,
        status,
        trackingCandidates,
        idCandidates,
      });

      return new Response(JSON.stringify({ received: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let nextOrderStatus: string | null = null;
    let nextPaymentStatus: string | null = null;

    const isSuccess =
      status === "success" ||
      status === "successful" ||
      status === "completed" ||
      event.includes("success") ||
      event.includes("completed") ||
      event.includes("paid");

    const isFailed =
      status === "failed" ||
      status === "cancelled" ||
      status === "canceled" ||
      status === "declined" ||
      event.includes("failed") ||
      event.includes("cancel") ||
      event.includes("declined");

    if (isSuccess) {
      nextOrderStatus = "confirmed";
      nextPaymentStatus = "paid";
    } else if (isFailed) {
      nextOrderStatus = "cancelled";
      nextPaymentStatus = "failed";
    } else {
      nextPaymentStatus = "pending";
    }

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (nextOrderStatus && order.status !== nextOrderStatus) {
      updateData.status = nextOrderStatus;
    }

    if (nextPaymentStatus && order.payment_status !== nextPaymentStatus) {
      updateData.payment_status = nextPaymentStatus;
    }

    const hasStatusChanges = Object.keys(updateData).length > 1;

    if (hasStatusChanges) {
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ received: true, matched: true, order_id: order.id, updated: hasStatusChanges }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
