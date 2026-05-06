import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { VeriLogo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No user signed in → render bare children. The login page is the legitimate
  // case for this. Protected pages (page.tsx, invite/, candidates/) do their
  // own auth redirect at the top, so unauthenticated requests to those will
  // bounce to /admin/login before reaching the rendered output.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-veri-line bg-veri-surface/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <VeriLogo className="h-8" />
            <span className="text-veri-subtle text-sm hidden md:inline">Hiring Console</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-sm text-veri-subtle hover:text-veri-text">Pipeline</Link>
            <Link href="/admin/invite" className="text-sm text-veri-subtle hover:text-veri-text">Send invite</Link>
            <span className="text-xs text-veri-mute hidden md:inline">{user.email}</span>
            <form action="/api/sign-out" method="post">
              <button className="text-xs text-veri-mute hover:text-veri-text">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
