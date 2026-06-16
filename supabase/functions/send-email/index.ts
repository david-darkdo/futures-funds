import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GMAIL_USER = Deno.env.get("GMAIL_USER") || "";
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD") || "";
const LOGO_URL =
  "https://ncmzqvqfmbbntmvswpmt.supabase.co/storage/v1/object/public/email-assets/futurefunds-logo.png";
const BANNER_URL =
  "https://ncmzqvqfmbbntmvswpmt.supabase.co/storage/v1/object/public/email-assets/email-banner.jpg";
const DASHBOARD_URL = "https://crypto-bond-vault.lovable.app/dashboard";
const WHATSAPP_URL = "https://wa.me/16232122337";
const COMPANY_EMAIL = "futurefundsrg@gmail.com";

function generateRefCode(userId: string): string {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = userId.slice(0, 8).toUpperCase();
  return `FF-${shortId}-${ts}`;
}

function baseLayout(
  fullName: string,
  subject: string,
  bodyContent: string,
  ctaText: string,
  ctaUrl: string,
  refCode: string
): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1628;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1628;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111d33;border-radius:12px;overflow:hidden;border:1px solid #1e2d47;">

<!-- Logo Header -->
<tr><td style="background:linear-gradient(135deg,#0f1a2e,#162035);padding:24px 30px;text-align:center;border-bottom:2px solid #c9a84c;">
<img src="${LOGO_URL}" alt="Future Funds" width="180" style="max-width:180px;height:auto;" />
<p style="color:#c9a84c;font-size:13px;margin:8px 0 0;letter-spacing:2px;font-weight:600;">BUILDING WEALTH WITH STRUCTURE</p>
</td></tr>

<!-- Banner -->
<tr><td style="padding:0;">
<img src="${BANNER_URL}" alt="Investment Growth" width="600" style="width:100%;height:auto;display:block;" />
</td></tr>

<!-- Body -->
<tr><td style="padding:30px 35px;">
<p style="color:#e8e1d3;font-size:16px;margin:0 0 6px;">Hello,</p>
<h2 style="color:#c9a84c;font-size:22px;margin:0 0 20px;font-weight:700;">${fullName}</h2>
${bodyContent}

<!-- CTA Button -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
<tr><td align="center">
<a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#b8943f);color:#0a1628;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:0.5px;">
${ctaText}
</a>
</td></tr>
</table>
</td></tr>

<!-- Support Section -->
<tr><td style="padding:0 35px 25px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1524;border-radius:8px;padding:20px;border:1px solid #1e2d47;">
<tr><td style="padding:15px;" align="center">
<p style="color:#8899aa;font-size:13px;margin:0 0 12px;">Need help? Contact our support team</p>
<a href="${WHATSAPP_URL}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;font-size:13px;margin-right:10px;">
💬 WhatsApp Support
</a>
<a href="mailto:${COMPANY_EMAIL}" style="display:inline-block;background:#1e2d47;color:#c9a84c;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;font-size:13px;border:1px solid #c9a84c;">
✉️ Email Us
</a>
</td></tr>
</table>
</td></tr>

<!-- Security Notice -->
<tr><td style="padding:0 35px 20px;">
<p style="color:#6b7d94;font-size:12px;line-height:1.6;margin:0;padding:12px;background:#0a1220;border-radius:6px;border-left:3px solid #c9a84c;">
🔒 <strong style="color:#8899aa;">Security Notice:</strong> Future Funds will always address you by your full name. Never share your login credentials with anyone. Future Funds will never ask for your password via email.
</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 35px;border-top:1px solid #1e2d47;text-align:center;">
<p style="color:#4a5d73;font-size:11px;margin:0 0 4px;">Ref: ${refCode}</p>
<p style="color:#4a5d73;font-size:11px;margin:0 0 8px;">© ${year} Future Funds. All rights reserved.</p>
<p style="color:#4a5d73;font-size:10px;margin:0;">
<a href="${DASHBOARD_URL}" style="color:#6b7d94;text-decoration:underline;">Notification Preferences</a> · 
<a href="${DASHBOARD_URL}" style="color:#6b7d94;text-decoration:underline;">Unsubscribe</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function signupEmail(fullName: string, userId: string): { subject: string; html: string } {
  const subject = "Welcome to Future Funds — Your Investment Journey Begins";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
Your Future Funds account has been successfully created.
</p>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
You are now connected to a structured investment ecosystem designed to grow capital with discipline and transparency.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 10px;">What Happens Next:</p>
<p style="color:#8899aa;font-size:13px;line-height:1.8;margin:0;">
• Complete your dashboard setup<br/>
• Fund your investment account<br/>
• Track portfolio growth in real-time
</p>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
We are committed to helping you build long-term wealth through structured investment strategies.
</p>`;
  const refCode = generateRefCode(userId);
  return { subject, html: baseLayout(fullName, subject, body, "Access Your Dashboard", DASHBOARD_URL, refCode) };
}

function loginAlertEmail(
  fullName: string,
  userId: string,
  loginTime: string,
  device: string,
  ip: string
): { subject: string; html: string } {
  const subject = "New Login Detected on Your Future Funds Account";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
We detected a new login to your Future Funds account.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 12px;">Login Details:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Time:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${loginTime}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Device:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${device}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">IP Address:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${ip}</td></tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 8px;">
If this was you, no action is required.
</p>
<p style="color:#e87171;font-size:14px;line-height:1.7;margin:0;font-weight:600;">
If this was NOT you, secure your account immediately and contact support.
</p>`;
  const refCode = generateRefCode(userId);
  return { subject, html: baseLayout(fullName, subject, body, "Secure My Account", DASHBOARD_URL, refCode) };
}

function monthlyReportEmail(
  fullName: string,
  userId: string,
  startingBalance: string,
  currentBalance: string,
  growthPercentage: string,
  netProfit: string
): { subject: string; html: string } {
  const subject = "Your Monthly Investment Performance Report — Future Funds";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
Here is your monthly portfolio performance summary.
</p>
<div style="background:#0d1524;border-radius:8px;padding:22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 14px;">Portfolio Overview</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #1e2d47;">
<p style="color:#6b7d94;font-size:12px;margin:0;">Starting Balance</p>
<p style="color:#c5d0dc;font-size:18px;font-weight:700;margin:4px 0 0;">$${startingBalance}</p>
</td>
<td style="padding:10px 0;border-bottom:1px solid #1e2d47;text-align:right;">
<p style="color:#6b7d94;font-size:12px;margin:0;">Current Balance</p>
<p style="color:#c9a84c;font-size:18px;font-weight:700;margin:4px 0 0;">$${currentBalance}</p>
</td>
</tr>
<tr>
<td style="padding:10px 0;">
<p style="color:#6b7d94;font-size:12px;margin:0;">Growth Rate</p>
<p style="color:#22c55e;font-size:18px;font-weight:700;margin:4px 0 0;">+${growthPercentage}%</p>
</td>
<td style="padding:10px 0;text-align:right;">
<p style="color:#6b7d94;font-size:12px;margin:0;">Net Profit</p>
<p style="color:#22c55e;font-size:18px;font-weight:700;margin:4px 0 0;">+$${netProfit}</p>
</td>
</tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
We continue to apply structured investment strategies to optimize performance. View your dashboard for full breakdown and updated projections.
</p>`;
  const refCode = generateRefCode(userId);
  return { subject, html: baseLayout(fullName, subject, body, "View Full Report", DASHBOARD_URL, refCode) };
}
function depositEmail(fullName: string, userId: string, amount: string, currency?: string): { subject: string; html: string } {
  const subject = "Deposit Received — Future Funds";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
We have received your deposit submission and it is now in review.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 10px;">Deposit Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Amount:</td><td style="color:#c9a84c;font-size:14px;padding:4px 0;font-weight:700;">$${amount}${currency ? " " + currency : ""}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Status:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">Pending verification</td></tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
Our team will verify your payment within 24 hours and your main balance will be credited automatically.
</p>`;
  return { subject, html: baseLayout(fullName, subject, body, "View Dashboard", DASHBOARD_URL, generateRefCode(userId)) };
}

function investmentEmail(fullName: string, userId: string, amount: string, bundleName: string, dailyRate: string): { subject: string; html: string } {
  const subject = "Investment Started — Future Funds";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
Your investment has been successfully started.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 10px;">Investment Summary</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Bundle:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${bundleName}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Principal:</td><td style="color:#c9a84c;font-size:14px;padding:4px 0;font-weight:700;">$${amount}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Daily Target:</td><td style="color:#22c55e;font-size:13px;padding:4px 0;font-weight:700;">${dailyRate}%</td></tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
After the 24-hour cycle your principal returns to your main balance and your accrued profit is credited.
</p>`;
  return { subject, html: baseLayout(fullName, subject, body, "View Portfolio", DASHBOARD_URL, generateRefCode(userId)) };
}

function profitEmail(fullName: string, userId: string, amount: string, bundleName: string): { subject: string; html: string } {
  const subject = "Profit Credited — Future Funds";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
Your 24-hour investment cycle has completed and profits have been credited.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 10px;">Cycle Result</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Bundle:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${bundleName}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Profit:</td><td style="color:#22c55e;font-size:16px;padding:4px 0;font-weight:700;">+$${amount}</td></tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
You can reinvest from your main balance or request a withdrawal at any time.
</p>`;
  return { subject, html: baseLayout(fullName, subject, body, "View Portfolio", DASHBOARD_URL, generateRefCode(userId)) };
}

function withdrawalEmail(fullName: string, userId: string, amount: string, currency: string, network: string): { subject: string; html: string } {
  const subject = "Withdrawal Request Received — Future Funds";
  const body = `
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0 0 16px;">
Your withdrawal request has been received and is being processed.
</p>
<div style="background:#0d1524;border-radius:8px;padding:18px 22px;margin:20px 0;border:1px solid #1e2d47;">
<p style="color:#c9a84c;font-size:14px;font-weight:700;margin:0 0 10px;">Withdrawal Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Amount:</td><td style="color:#c9a84c;font-size:14px;padding:4px 0;font-weight:700;">$${amount}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Currency:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${currency}</td></tr>
<tr><td style="color:#6b7d94;font-size:13px;padding:4px 0;">Network:</td><td style="color:#c5d0dc;font-size:13px;padding:4px 0;">${network}</td></tr>
</table>
</div>
<p style="color:#c5d0dc;font-size:15px;line-height:1.7;margin:0;">
Withdrawals are typically processed within 24-48 hours after manual review.
</p>`;
  return { subject, html: baseLayout(fullName, subject, body, "View Dashboard", DASHBOARD_URL, generateRefCode(userId)) };
}

function customEmail(fullName: string, userId: string, subject: string, contentHtml: string, imageDataUrl?: string): { subject: string; html: string } {
  const imgBlock = imageDataUrl
    ? `<div style="margin:0 0 20px;"><img src="${imageDataUrl}" alt="" style="width:100%;max-width:530px;height:auto;border-radius:10px;display:block;" /></div>`
    : "";
  const body = `${imgBlock}<div style="color:#c5d0dc;font-size:15px;line-height:1.75;">${contentHtml}</div>`;
  return { subject, html: baseLayout(fullName, subject, body, "Open Dashboard", DASHBOARD_URL, generateRefCode(userId)) };
}

async function sendGmail(to: string, subject: string, html: string) {

  const smtpHost = "smtp.gmail.com";
  const smtpPort = 465;

  console.log("[send-email] Connecting to SMTP:", smtpHost, smtpPort);
  console.log("[send-email] FROM:", GMAIL_USER, "| TO:", to);
  console.log("[send-email] Subject:", subject);

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD secret is not configured");
  }

  const conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null || n === 0) {
      console.error("[send-email] SMTP connection closed unexpectedly (read returned null)");
      throw new Error("SMTP connection closed unexpectedly");
    }
    const response = decoder.decode(buf.subarray(0, n));
    console.log("[send-email] SMTP <--", response.trim());
    return response;
  }

  async function sendCommand(cmd: string): Promise<string> {
    const logCmd = cmd.startsWith("AUTH") || cmd === btoa(GMAIL_USER) || cmd === btoa(GMAIL_APP_PASSWORD)
      ? "[REDACTED]"
      : cmd;
    console.log("[send-email] SMTP -->", logCmd);
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  // Read greeting
  await readResponse();
  await sendCommand(`EHLO localhost`);

  // AUTH LOGIN
  await sendCommand("AUTH LOGIN");
  await sendCommand(btoa(GMAIL_USER));
  const authResult = await sendCommand(btoa(GMAIL_APP_PASSWORD));
  if (!authResult.startsWith("235")) {
    throw new Error(`SMTP AUTH failed: ${authResult.trim()}`);
  }
  console.log("[send-email] SMTP AUTH successful");

  await sendCommand(`MAIL FROM:<${GMAIL_USER}>`);
  await sendCommand(`RCPT TO:<${to}>`);
  await sendCommand("DATA");

  // SMTP dot-stuffing: any line starting with "." must be escaped to ".."
  // to prevent premature end-of-message
  const dotStuffedHtml = html.replace(/\r?\n\./g, "\r\n..");

  const emailContent = [
    `From: "Future Funds" <${GMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    dotStuffedHtml,
    `.`,
  ].join("\r\n");

  await conn.write(encoder.encode(emailContent + "\r\n"));
  const dataResult = await readResponse();
  if (!dataResult.startsWith("250")) {
    throw new Error(`SMTP DATA send failed: ${dataResult.trim()}`);
  }
  console.log("[send-email] Email body accepted by SMTP server");

  await sendCommand("QUIT");
  conn.close();
  console.log("[send-email] SMTP connection closed — email sent successfully to:", to);
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: require valid user JWT or service role key ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[send-email] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const isServiceCall = token === serviceRoleKey;

    if (!isServiceCall) {
      // Validate as user JWT
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error: claimsError } = await supabase.auth.getUser(token);
      if (claimsError || !data?.user) {
        console.error("[send-email] JWT validation failed:", claimsError?.message);
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[send-email] Authenticated as user:", data.user.id);
    } else {
      console.log("[send-email] Authenticated via service role key");
    }

    const body = await req.json();
    const { type, to, fullName, userId, ...extra } = body;

    console.log("[send-email] Request received — type:", type, "| to:", to, "| fullName:", fullName);

    if (!to) {
      console.error("[send-email] Missing 'to' email address");
      return new Response(
        JSON.stringify({ error: "Missing recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let html: string;

    switch (type) {
      case "signup": {
        const email = signupEmail(fullName, userId);
        subject = email.subject;
        html = email.html;
        break;
      }
      case "login_alert": {
        const email = loginAlertEmail(
          fullName,
          userId,
          extra.loginTime || new Date().toISOString(),
          extra.device || "Unknown",
          extra.ip || "Unknown"
        );
        subject = email.subject;
        html = email.html;
        break;
      }
      case "monthly_report": {
        const email = monthlyReportEmail(
          fullName,
          userId,
          extra.startingBalance || "0.00",
          extra.currentBalance || "0.00",
          extra.growthPercentage || "0.00",
          extra.netProfit || "0.00"
        );
        subject = email.subject;
        html = email.html;
        break;
      }
      case "deposit": {
        const e = depositEmail(fullName, userId, extra.amount || "0.00", extra.currency);
        subject = e.subject; html = e.html; break;
      }
      case "investment": {
        const e = investmentEmail(fullName, userId, extra.amount || "0.00", extra.bundleName || "Investment", extra.dailyRate || "0");
        subject = e.subject; html = e.html; break;
      }
      case "profit": {
        const e = profitEmail(fullName, userId, extra.amount || "0.00", extra.bundleName || "Investment");
        subject = e.subject; html = e.html; break;
      }
      case "withdrawal": {
        const e = withdrawalEmail(fullName, userId, extra.amount || "0.00", extra.currency || "USDT", extra.network || "");
        subject = e.subject; html = e.html; break;
      }
      case "custom": {
        const e = customEmail(fullName, userId, extra.subject || "Future Funds", extra.bodyHtml || "", extra.imageDataUrl);
        subject = e.subject; html = e.html; break;
      }
      default:
        console.error("[send-email] Invalid email type:", type);
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }


    console.log("[send-email] Attempting SMTP send — GMAIL_USER configured:", !!GMAIL_USER);
    await sendGmail(to, subject, html);
    console.log("[send-email] ✅ Email sent successfully to:", to);

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${to}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-email] ❌ Email send FAILED:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
