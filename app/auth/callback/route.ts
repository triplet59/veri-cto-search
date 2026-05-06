// Auth callback handler for Supabase magic links.
// The magic link sends the user here with a `code` query param;
// we exchange it for a session (which sets the auth cookies) and
// then redirect to the originally-requested page.

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback exchange failed:", error.message);
  }

  // No code or exchange failed — bounce to login with an error indicator.
  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback_failed`);
}
