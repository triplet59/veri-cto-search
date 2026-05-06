import { InviteForm } from "@/components/admin/invite-form";

export default function InvitePage() {
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
