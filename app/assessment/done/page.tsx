import { VeriLogo } from "@/components/brand/logo";

export default function AssessmentDonePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <VeriLogo className="h-10 mx-auto mb-10" />
        <p className="veri-eyebrow mb-3">Senior Technical Officer Search</p>
        <h1 className="veri-h1 mb-4">Assessment received</h1>
        <p className="text-veri-subtle leading-relaxed mb-6">
          Thank you for the time you've put into the assessment. Our team will
          review it carefully and come back to you with next steps within a few
          working days. Shortlisted candidates will be invited to a live finalist
          conversation.
        </p>
        <p className="text-veri-mute text-xs mt-10">
          Veri / Gravitas Finance LLC · Mauritius
        </p>
      </div>
    </main>
  );
}
