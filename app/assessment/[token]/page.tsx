import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import { VeriLogo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AssessmentPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, full_name, status")
    .eq("assessment_token", token)
    .maybeSingle();
  if (error || !candidate) notFound();

  // If they've already submitted, show the confirmation
  if (
    candidate.status === "assessment_submitted" ||
    candidate.status === "scoring" ||
    candidate.status === "scored" ||
    candidate.status === "shortlisted" ||
    candidate.status === "offer" ||
    candidate.status === "declined"
  ) {
    return <AlreadySubmitted />;
  }

  // Mark as started if not already
  if (candidate.status === "assessment_sent") {
    await supabase
      .from("candidates")
      .update({
        status: "assessment_started",
        assessment_started_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);
  }

  // Load any existing draft
  const { data: existingDraft } = await supabase
    .from("assessment_submissions")
    .select("*")
    .eq("candidate_id", candidate.id)
    .maybeSingle();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <VeriLogo className="h-10 mb-8" />
          <p className="veri-eyebrow mb-3">Senior Technical Officer Search</p>
          <h1 className="veri-h1 mb-4">Technical assessment</h1>
          <p className="text-veri-subtle leading-relaxed">
            Welcome, {candidate.full_name ?? "candidate"}. This assessment has five
            sections. Your work auto-saves every minute and on every field blur, so
            you can leave and come back without losing progress. We expect this to
            take around 4 to 5 hours of focused work — please complete it across
            multiple sessions if that suits you better.
          </p>
        </header>

        <AssessmentForm
          candidateId={candidate.id}
          initialDraft={existingDraft}
        />
      </div>
    </main>
  );
}

function AlreadySubmitted() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <VeriLogo className="h-10 mx-auto mb-8" />
        <h1 className="veri-h2 mb-3">Assessment already submitted</h1>
        <p className="text-veri-subtle">
          Our records show you've already submitted your technical assessment. We're
          reviewing it now and will be in touch shortly with next steps. If you need
          to amend anything, please contact us directly.
        </p>
      </div>
    </main>
  );
}
