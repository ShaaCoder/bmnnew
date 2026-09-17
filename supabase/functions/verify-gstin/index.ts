// supabase/functions/verify-gstin/index.ts
// @ts-nocheck

// tumhara existing code yahan se start hoga
// ============================================================
// CORS CONFIGURATION
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
};

// ============================================================
// GSTIN VALIDATION
// ============================================================

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ============================================================
// GST API RESPONSE TYPE
// ============================================================

type GstApiResponse = {
  success?: boolean;
  error?: string;
  credits_remaining?: number;
  data?: unknown;
  [key: string]: unknown;
};

// ============================================================
// JSON RESPONSE HELPER
// ============================================================

function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

// ============================================================
// GSTIN API LOOKUP
// ============================================================

async function lookupGstin(
  gstin: string,
  apiKey: string,
  includeProfile: boolean
): Promise<Response> {
  const url =
    `https://www.gstinapi.in/v1/gstin/${encodeURIComponent(gstin)}` +
    `${includeProfile ? "?include=profile" : ""}`;

  const maxRetries = 3;
  let lastError = "";

  for (
    let attempt = 0;
    attempt < maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `[GSTIN] API request attempt ${
          attempt + 1
        }/${maxRetries}`
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
      });

      // ========================================================
      // READ API RESPONSE
      // ========================================================

      let body: GstApiResponse;

      try {
        body = await response.json();
      } catch {
        body = {
          success: false,
          error:
            `GST API returned invalid JSON ` +
            `(HTTP ${response.status})`,
        };
      }

      // ========================================================
      // TEMPORARY ERROR / RATE LIMIT
      // ========================================================

      if (
        response.status === 429 ||
        response.status === 502 ||
        response.status === 503
      ) {
        lastError =
          body?.error ||
          `GST service temporarily unavailable ` +
          `(HTTP ${response.status})`;

        console.warn(
          `[GSTIN] Temporary error: ${lastError}`
        );

        if (attempt < maxRetries - 1) {
          const delay =
            Math.pow(2, attempt) * 1000;

          console.log(
            `[GSTIN] Retrying after ${delay}ms`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        return jsonResponse(
          {
            success: false,
            error: lastError,
          },
          response.status
        );
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      if (
        response.status === 200 &&
        body?.success
      ) {
        console.log(
          `[GSTIN] ${gstin} verified successfully`
        );

        console.log(
          `[GSTIN] Credits remaining: ${
            body.credits_remaining ?? "unknown"
          }`
        );

        return jsonResponse(
          body,
          200
        );
      }

      // ========================================================
      // GST API RETURNED AN ERROR
      // ========================================================

      const errorMessage =
        body?.error ||
        `Verification failed ` +
        `(HTTP ${response.status})`;

      console.error(
        `[GSTIN] ${gstin} verification failed:`,
        errorMessage
      );

      return jsonResponse(
        {
          success: false,
          error: errorMessage,
        },
        response.status >= 400
          ? response.status
          : 400
      );
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Network error";

      console.error(
        `[GSTIN] Attempt ${
          attempt + 1
        } failed:`,
        lastError
      );

      // ========================================================
      // RETRY
      // ========================================================

      if (attempt < maxRetries - 1) {
        const delay =
          Math.pow(2, attempt) * 1000;

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }
  }

  // ==========================================================
  // ALL RETRIES FAILED
  // ==========================================================

  return jsonResponse(
    {
      success: false,
      error:
        lastError ||
        "GST verification failed after 3 retries.",
    },
    502
  );
}

// ============================================================
// MAIN SUPABASE EDGE FUNCTION
// ============================================================

Deno.serve(async (req: Request) => {
  // ==========================================================
  // CORS PREFLIGHT
  // ==========================================================

  if (req.method === "OPTIONS") {
    console.log(
      "[GSTIN] CORS preflight request"
    );

    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ==========================================================
  // ALLOW GET AND POST ONLY
  // ==========================================================

  if (
    req.method !== "GET" &&
    req.method !== "POST"
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed.",
      },
      405
    );
  }

  try {
    console.log(
      `[GSTIN] ${req.method} request received`
    );

    // ========================================================
    // GET API KEY FROM SUPABASE SECRET
    // ========================================================

    const apiKey =
      Deno.env.get("GSTIN_API_KEY");

    if (!apiKey) {
      console.error(
        "[GSTIN] GSTIN_API_KEY is not configured"
      );

      return jsonResponse(
        {
          success: false,
          error:
            "GST API key is not configured on the server.",
        },
        500
      );
    }

    // ========================================================
    // REQUEST VARIABLES
    // ========================================================

    const requestUrl =
      new URL(req.url);

    let gstin = "";
    let includeProfile = false;

    // ========================================================
    // POST REQUEST
    // ========================================================

    if (req.method === "POST") {
      let body: {
        gstin?: string;
        include_profile?: boolean;
      };

      try {
        body = await req.json();
      } catch {
        return jsonResponse(
          {
            success: false,
            error:
              "Invalid JSON request body.",
          },
          400
        );
      }

      gstin =
        (body.gstin || "")
          .toUpperCase()
          .trim();

      includeProfile =
        body.include_profile === true;
    }

    // ========================================================
    // GET REQUEST
    // ========================================================

    else if (req.method === "GET") {
      const pathParts =
        requestUrl.pathname
          .split("/")
          .filter(Boolean);

      gstin =
        pathParts[
          pathParts.length - 1
        ] || "";

      gstin =
        gstin
          .toUpperCase()
          .trim();

      includeProfile =
        requestUrl.searchParams.get(
          "include"
        ) === "profile";
    }

    // ========================================================
    // GSTIN REQUIRED
    // ========================================================

    if (!gstin) {
      return jsonResponse(
        {
          success: false,
          error:
            "GSTIN is required.",
        },
        400
      );
    }

    // ========================================================
    // GSTIN FORMAT VALIDATION
    // ========================================================

    if (!GSTIN_REGEX.test(gstin)) {
      console.warn(
        `[GSTIN] Invalid GSTIN format: ${gstin}`
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Invalid GSTIN format. Expected 15 characters: " +
            "2 digits, 5 letters, 4 digits, 1 letter, " +
            "1 alphanumeric, Z, 1 alphanumeric.",
        },
        400
      );
    }

    // ========================================================
    // LOOKUP
    // ========================================================

    console.log(
      `[GSTIN] Looking up GSTIN. Profile: ${includeProfile}`
    );

    return await lookupGstin(
      gstin,
      apiKey,
      includeProfile
    );
  } catch (error) {
    // ========================================================
    // UNEXPECTED ERROR
    // ========================================================

    console.error(
      "[GSTIN] Unexpected error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      500
    );
  }
});