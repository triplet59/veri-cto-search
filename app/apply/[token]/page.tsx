import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ApplicationForm } from "@/components/apply/application-form";
import { VeriLogo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ApplyPage({ params }: PageProps) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, full_name, email, status")
    .eq("apply_token", token)
    .maybeSingle();

  if (error || !candidate) notFound();

  // If they've already applied, send them to the confirmation page.
  if (candidate.status !== "invited") {
    return <AlreadyApplied status={candidate.status} />;
  }

  return (
    <main className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <VeriLogo className="h-10 mb-8" />
          <p className="veri-eyebrow mb-3">Chief Technology Officer Search</p>
          <h1 className="veri-h1 mb-4">Application form</h1>
          <p className="text-veri-subtle leading-relaxed">
            Thank you for accepting our invitation to apply. The information you provide here
            allows us to keep track of your application and helps us pace the process. Your
            details remain confidential and are seen only by Veri's hiring team.
          </p>
        </header>

        <ApplicationForm token={token} candidateId={candidate.id} />
      </div>
    </main>
  );
}

function AlreadyApplied({ status }: { status: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <VeriLogo className="h-10 mx-auto mb-8" />
        <h1 className="veri-h2 mb-3">Application already received</h1>
        <p className="text-veri-subtle">
          Our records show you've already submitted your application. You should have received
          a confirmation email. If you need to amend anything, please reply to that email or
          contact us directly.
        </p>
        <p className="text-veri-mute text-sm mt-6">Status: {status.replace(/_/g, " ")}</p>
      </div>
    </main>
  );
}
