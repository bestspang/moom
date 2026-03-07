import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://admin.moom.fit",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineVerifyResponse {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce: string;
  amr: string[];
  name: string;
  picture: string;
  email?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return new Response(
        JSON.stringify({ error: "idToken is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lineChannelId = Deno.env.get("LINE_CHANNEL_ID");

    if (!lineChannelId) {
      return new Response(
        JSON.stringify({
          error: "LINE credentials not configured",
          code: "LINE_NOT_CONFIGURED",
          message:
            "LINE_CHANNEL_ID secret is not set. Please configure LINE credentials to enable this feature.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify ID token with LINE API
    const verifyResponse = await fetch(
      "https://api.line.me/oauth2/v2.1/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: lineChannelId,
        }),
      }
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("LINE verify failed:", errorText);
      return new Response(
        JSON.stringify({
          error: "Invalid LINE token",
          code: "INVALID_TOKEN",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const lineProfile: LineVerifyResponse = await verifyResponse.json();
    const lineUserId = lineProfile.sub;
    const displayName = lineProfile.name;
    const pictureUrl = lineProfile.picture;

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up existing LINE user
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from("line_users")
      .select(
        `
        *,
        members(id, first_name, last_name, nickname, member_id, avatar_url, status, email, phone)
      `
      )
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (lookupError) {
      console.error("Lookup error:", lookupError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingUser) {
      await supabaseAdmin
        .from("line_users")
        .update({
          last_login_at: new Date().toISOString(),
          line_display_name: displayName,
          line_picture_url: pictureUrl,
        })
        .eq("id", existingUser.id);

      return new Response(
        JSON.stringify({
          success: true,
          needsLinking: !existingUser.member_id,
          lineProfile: {
            userId: lineUserId,
            displayName,
            pictureUrl,
          },
          member: existingUser.members || null,
          lineUser: {
            id: existingUser.id,
            linkedAt: existingUser.linked_at,
            lastLoginAt: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // New LINE user — create record without member link
    const { data: newLineUser, error: insertError } = await supabaseAdmin
      .from("line_users")
      .insert({
        line_user_id: lineUserId,
        line_display_name: displayName,
        line_picture_url: pictureUrl,
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create LINE user record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        needsLinking: true,
        lineProfile: {
          userId: lineUserId,
          displayName,
          pictureUrl,
        },
        member: null,
        lineUser: {
          id: newLineUser.id,
          linkedAt: newLineUser.linked_at,
          lastLoginAt: newLineUser.last_login_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("line-auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
