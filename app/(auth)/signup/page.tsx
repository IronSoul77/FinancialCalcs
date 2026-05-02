import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full space-y-4">
        <AuthForm mode="signup" error={params.error} />
        <p className="text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-teal-700">Log in</Link></p>
      </div>
    </main>
  );
}
