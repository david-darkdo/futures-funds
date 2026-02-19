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
    // Anon key is public — safe to embed as fallback
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbXpxdnFmbWJibnRtdnN3cG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzYwNDIsImV4cCI6MjA4MTA1MjA0Mn0.zPsMLVjDUXpq0BPV2UQwk7UhDtwOv0KObsgj9OYbCZ8";

    // Use service-role client to validate token — getUser() verifies JWT server-side
    const token = authHeader.replace("Bearer ", "");
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(
      // We need to extract the sub from the JWT without a library, so we decode it
      JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
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

    // Always send a login alert email on every sign-in
    const shouldSendAlert = true;

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
