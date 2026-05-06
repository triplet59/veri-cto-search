import { VeriLogo } from "@/components/brand/logo";

export default function DonePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <VeriLogo className="h-10 mx-auto mb-10" />
        <p className="veri-eyebrow mb-3">Chief Technology Officer Search</p>
        <h1 className="veri-h1 mb-4">Application received</h1>
        <p className="text-veri-subtle leading-relaxed mb-6">
          Thank you for completing the first step. We'll review your CV and come back to you
          within a few working days with next steps. If you proceed, you'll receive a separate
          email with a link to the technical assessment.
        </p>
        <p className="text-veri-mute text-sm">
          Please check your inbox (and spam folder, just in case) over the coming days.
        </p>
        <p className="text-veri-mute text-xs mt-10">
          Veri / Gravitas Finance LLC · Mauritius
        </p>
      </div>
    </main>
  );
}
