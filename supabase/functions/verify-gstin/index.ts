import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

async function lookupGstin(gstin: string, apiKey: string, includeProfile: boolean): Promise<Response> {
  const url = `https://www.gstinapi.in/v1/gstin/${gstin}${includeProfile ? "?include=profile" : ""}`;

  const maxRetries = 3;
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "x-api-key": apiKey },
      });

      const body = await res.json();

      if (res.status === 429 || res.status === 502) {
        lastError = body?.error || `Server temporarily unavailable (HTTP ${res.status})`;
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return new Response(JSON.stringify({ success: false, error: lastError }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (res.status === 200 && body?.success) {
        console.log(`[GSTIN] ${gstin} verified. Credits remaining: ${body.credits_remaining}`);
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorMsg = body?.error || `Verification failed (HTTP ${res.status})`;
      console.log(`[GSTIN] ${gstin} failed: ${errorMsg}`);
      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  return new Response(JSON.stringify({ success: false, error: lastError || "Failed after 3 retries" }), {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GSTIN_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "API key not configured on server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const gstinRaw = pathParts[pathParts.length - 1] || "";

    let gstin = "";
    let includeProfile = false;

    if (req.method === "POST") {
      const body = await req.json();
      gstin = (body.gstin || "").toUpperCase().trim();
      includeProfile = body.include_profile === true;
    } else {
      gstin = gstinRaw.toUpperCase().trim();
      includeProfile = url.searchParams.get("include") === "profile";
    }

    if (!gstin) {
      return new Response(JSON.stringify({ success: false, error: "GSTIN is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GSTIN_REGEX.test(gstin)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid GSTIN format. Expected 15 characters: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return await lookupGstin(gstin, apiKey, includeProfile);
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
