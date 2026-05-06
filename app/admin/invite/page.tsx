import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { InviteForm } from "@/components/admin/invite-form";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const ssr = await createServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect("/admin/login");
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length > 0 && !adminEmails.includes(user.email?.toLowerCase() || "")) {
    await ssr.auth.signOut();
    redirect("/admin/login");
  }
}

export default async function InvitePage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <p className="veri-eyebrow mb-2">CTO Search</p>
      <h1 className="veri-h1 mb-2">Invite a candidate</h1>
      <p className="text-veri-subtle mb-8">
        Generates a unique application link you can send to a candidate. The candidate's
        details are captured when they apply; nothing is required here beyond an optional name
        and source so you can identify them on the dashboard.
      </p>
      <InviteForm />
    </div>
  );
}
