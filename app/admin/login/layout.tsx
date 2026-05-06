// Override the parent /admin layout so the login page itself doesn't require auth.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
