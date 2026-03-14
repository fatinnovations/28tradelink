import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYCHANGU_API_BASE = "https://api.paychangu.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYCHANGU_SECRET_KEY = Deno.env.get("PAYCHANGU_SECRET_KEY");
    if (!PAYCHANGU_SECRET_KEY) throw new Error("PAYCHANGU_SECRET_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const {
      orderId,
      amount,
      currency,
      firstName,
      lastName,
      phone,
      operator,
      callbackUrl,
      returnUrl,
    } = await req.json();

    if (!orderId || !amount || !phone || !operator) {
      throw new Error("Missing required fields: orderId, amount, phone, operator");
    }

    // Normalize phone to international format (265XXXXXXXXX)
    let cleanPhone = String(phone).replace(/[\s\-\(\)\+]/g, "");
    // Convert local format (0XXXXXXXXX) to international (265XXXXXXXXX)
    if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
      cleanPhone = "265" + cleanPhone.slice(1);
    }
    // If already has country code with +
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error("Invalid phone number format");
    }

    const cleanAmount = Number(amount);
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      throw new Error("Invalid amount");
    }

    const operatorCode = String(operator).toLowerCase();
    if (!["airtel", "tnm"].includes(operatorCode)) {
      throw new Error("Invalid operator. Must be 'airtel' or 'tnm'");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, payment_status, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found or not owned by current user");

    const authToken = `Bearer ${PAYCHANGU_SECRET_KEY}`;

    const operatorResponse = await fetch(`${PAYCHANGU_API_BASE}/mobile-money`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: authToken,
      },
    });

    const operatorData = await operatorResponse.json();

    if (!operatorResponse.ok) {
      throw new Error(`Failed to fetch operators: ${JSON.stringify(operatorData)}`);
    }

    const selectedOperator = operatorData.data?.find(
      (op: any) => op.short_code?.toLowerCase() === operatorCode,
    );

    if (!selectedOperator) {
      throw new Error(`Operator "${operator}" not found`);
    }

    const chargeId = crypto.randomUUID();

    const momoPayload = {
      mobile_money_operator_ref_id: selectedOperator.ref_id,
      mobile: cleanPhone,
      amount: Math.round(cleanAmount),
      charge_id: chargeId,
      tx_ref: orderId,
      ref_id: orderId,
      first_name: String(firstName || "Customer").slice(0, 50),
      last_name: String(lastName || "").slice(0, 50),
      email: user.email || "customer@28tradelink.com",
      currency: currency || "MWK",
      ...(callbackUrl && { callback_url: callbackUrl }),
      ...(returnUrl && { return_url: returnUrl }),
    };

    console.log("MoMo payload:", JSON.stringify(momoPayload));

    const momoResponse = await fetch(`${PAYCHANGU_API_BASE}/mobile-money/payments/initialize`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify(momoPayload),
    });

    const momoText = await momoResponse.text();
    console.log("MoMo response status:", momoResponse.status, "body:", momoText);

    let momoData: any;
    try {
      momoData = JSON.parse(momoText);
    } catch {
      throw new Error(`PayChangu returned non-JSON: ${momoText.slice(0, 200)}`);
    }

    if (momoData.status === "failed" || !momoResponse.ok) {
      const errorMsg =
        typeof momoData.message === "object"
          ? Object.values(momoData.message).flat().join(", ")
          : momoData.message || momoText.slice(0, 200) || "Payment initialization failed";
      throw new Error(`PayChangu MoMo error: ${errorMsg}`);
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: chargeId,
        payment_status: "pending",
        status: order.status === "cancelled" ? "pending" : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        charge_id: chargeId,
        tx_ref: orderId,
        transaction_id: momoData.data?.trans_id,
        status: momoData.data?.status || "pending",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PayChangu payment error:", message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
