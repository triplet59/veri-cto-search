import { LoginForm } from "@/components/admin/login-form";
import { VeriLogo } from "@/components/brand/logo";

export const metadata = { title: "Sign in — Veri Hiring" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md veri-card p-8">
        <VeriLogo className="h-10 mb-8" />
        <p className="veri-eyebrow mb-2">Hiring Console</p>
        <h1 className="veri-h2 mb-2">Administrator sign-in</h1>
        <p className="text-veri-subtle text-sm mb-6">
          Enter the admin email address. We'll send a one-time sign-in link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
