import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,163,177,0.2),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(15,76,129,0.18),transparent_24%),linear-gradient(180deg,#f9f7f3_0%,#e7f7fd_42%,#dceef8_100%)] px-4 py-10 text-ink sm:px-6">
      <ResetPasswordForm />
    </main>
  );
}
