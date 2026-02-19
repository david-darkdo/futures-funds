import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Set to true to bypass 60-minute throttle during testing
const FORCE_SEND_FOR_TESTING = false;
const THROTTLE_MINUTES = 60;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[login-alert] No Authorization header present");
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Decode JWT to extract user ID
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      userId = payload.sub;
      console.log("[login-alert] Token decoded, userId:", userId);
    } catch (e) {
      console.error("[login-alert] Failed to decode JWT:", e);
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user exists via service-role admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error("[login-alert] User verification failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: { device?: string; ip?: string } = {};
    try {
      body = await req.json();
    } catch (_) {
      // body is optional
    }
    const { device, ip } = body;

    // Get profile with last_login_at
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, last_login_at")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[login-alert] Profile not found for userId:", userId, profileError?.message);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[login-alert] Profile found:", profile.email);
    console.log("[login-alert] last_login_at from DB:", profile.last_login_at);

    const now = new Date();
    console.log("[login-alert] Current timestamp:", now.toISOString());

    // Determine whether to send alert based on time gap
    let shouldSendAlert = false;
    let diffMinutes = 0;

    if (FORCE_SEND_FOR_TESTING) {
      shouldSendAlert = true;
      console.log("[login-alert] FORCE_SEND_FOR_TESTING=true — sending alert unconditionally");
    } else if (!profile.last_login_at) {
      // First login ever — no previous session to compare
      shouldSendAlert = false;
      console.log("[login-alert] First login ever — skipping alert (no prior last_login_at)");
    } else {
      const lastLogin = new Date(profile.last_login_at);
      const diffMs = now.getTime() - lastLogin.getTime();
      diffMinutes = diffMs / (1000 * 60);
      shouldSendAlert = diffMinutes > THROTTLE_MINUTES;
      console.log(
        `[login-alert] Last login: ${lastLogin.toISOString()} | Diff: ${diffMinutes.toFixed(1)} minutes | Threshold: ${THROTTLE_MINUTES} min | Should send: ${shouldSendAlert}`
      );
    }

    // Update last_login_at BEFORE sending email
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ last_login_at: now.toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("[login-alert] Failed to update last_login_at:", updateError.message);
    } else {
      console.log("[login-alert] last_login_at updated to:", now.toISOString());
    }

    if (shouldSendAlert && profile.email) {
      console.log("[login-alert] Sending login alert email to:", profile.email);

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
        ip: ip || "Detected by server",
      };

      let emailResult: string;
      let emailStatus: number;
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(emailPayload),
        });
        emailStatus = emailRes.status;
        emailResult = await emailRes.text();

        if (emailRes.ok) {
          console.log("[login-alert] Email sent successfully. Status:", emailStatus, "Result:", emailResult);
        } else {
          console.error("[login-alert] Email send FAILED. Status:", emailStatus, "Response:", emailResult);
        }
      } catch (emailErr) {
        console.error("[login-alert] Email fetch threw an exception:", emailErr);
        emailResult = `Exception: ${emailErr}`;
      }
    } else {
      console.log("[login-alert] Alert NOT sent. shouldSendAlert:", shouldSendAlert, "| email:", profile.email);
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertSent: shouldSendAlert,
        diffMinutes: diffMinutes.toFixed(1),
        forceMode: FORCE_SEND_FOR_TESTING,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[login-alert] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

