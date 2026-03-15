import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser, isOwnerEmail } from "@/lib/auth";
import { ownerEmail } from "@/lib/supabase/env";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (isOwnerEmail(user?.email)) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,238,227,0.88),transparent_30%),linear-gradient(180deg,#f7f3ea_0%,#f1e8d8_38%,#eee2cf_100%)] px-4 py-10 text-ink sm:px-6">
      <LoginForm ownerEmail={ownerEmail} />
    </main>
  );
}
