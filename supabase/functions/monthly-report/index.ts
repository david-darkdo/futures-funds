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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active investments with user profiles
    const { data: investments, error } = await supabase
      .from("user_investments")
      .select("id, user_id, initial_amount, current_value, growth_percentage")
      .eq("state", "active");

    if (error) {
      throw new Error(`Failed to fetch investments: ${error.message}`);
    }

    if (!investments || investments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active investments to report", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group investments by user
    const userInvestments = new Map<string, typeof investments>();
    for (const inv of investments) {
      const existing = userInvestments.get(inv.user_id) || [];
      existing.push(inv);
      userInvestments.set(inv.user_id, existing);
    }

    let sentCount = 0;

    for (const [userId, userInvs] of userInvestments) {
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (!profile?.email) continue;

      // Aggregate portfolio metrics
      const totalInitial = userInvs.reduce((s, i) => s + Number(i.initial_amount), 0);
      const totalCurrent = userInvs.reduce((s, i) => s + Number(i.current_value), 0);
      const netProfit = totalCurrent - totalInitial;
      const growthPct = totalInitial > 0 ? ((netProfit / totalInitial) * 100) : 0;

      const emailPayload = {
        type: "monthly_report",
        to: profile.email,
        fullName: profile.full_name || "Investor",
        userId,
        startingBalance: totalInitial.toFixed(2),
        currentBalance: totalCurrent.toFixed(2),
        growthPercentage: growthPct.toFixed(2),
        netProfit: netProfit.toFixed(2),
      };

      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(emailPayload),
        });
        const result = await emailRes.text();
        console.log(`Monthly report sent to ${userId}:`, result);
        sentCount++;
      } catch (e) {
        console.error(`Failed to send monthly report to ${userId}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Monthly report error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
