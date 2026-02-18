import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { device, ip } = await req.json();

    // Get profile with last_login_at
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, last_login_at")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let shouldSendAlert = false;

    if (profile.last_login_at) {
      const lastLogin = new Date(profile.last_login_at);
      const diffMs = now.getTime() - lastLogin.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      shouldSendAlert = diffMinutes > 60;
    }
    // First login ever - no alert needed, just update timestamp

    // Update last_login_at
    await supabase
      .from("profiles")
      .update({ last_login_at: now.toISOString() })
      .eq("id", userId);

    if (shouldSendAlert && profile.email) {
      const emailPayload = {
        type: "login_alert",
        to: profile.email,
        fullName: profile.full_name || "Investor",
        userId: userId,
        loginTime: now.toLocaleString("en-US", {
          timeZone: "UTC",
          dateStyle: "full",
          timeStyle: "long",
        }),
        device: device || "Unknown Device",
        ip: ip || "Unknown",
      };

      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailRes.text();
      console.log("Login alert email result:", emailResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertSent: shouldSendAlert,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login alert error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
