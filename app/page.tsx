import Link from "next/link";
import { VeriLogo } from "@/components/brand/logo";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="flex justify-center mb-10">
          <VeriLogo className="h-12" />
        </div>
        <p className="veri-eyebrow mb-4">Senior Technical Officer Search</p>
        <h1 className="veri-h1 mb-4">By invitation only</h1>
        <p className="text-veri-subtle leading-relaxed">
          This recruitment process is conducted by personal invitation. If you have received
          an invitation link, please use the URL provided to begin your application.
        </p>
        <p className="text-veri-mute text-sm mt-10">
          Veri is a brand of Gravitas Finance LLC, regulated by the Mauritius FSC.
        </p>
        <p className="mt-2 text-xs text-veri-mute">
          <Link href="/admin" className="veri-link">Administrator sign-in</Link>
        </p>
      </div>
    </main>
  );
}
