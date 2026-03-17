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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.2),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(15,76,129,0.18),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#e7f7fd_42%,#dceef8_100%)] px-4 py-10 text-ink sm:px-6">
      <LoginForm ownerEmail={ownerEmail} />
    </main>
  );
}
