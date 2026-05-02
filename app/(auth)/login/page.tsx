import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full space-y-4">
        <AuthForm mode="login" error={params.error} />
        <p className="text-center text-sm text-slate-600">Need an account? <Link href="/signup" className="font-semibold text-teal-700">Sign up</Link></p>
      </div>
    </main>
  );
}
