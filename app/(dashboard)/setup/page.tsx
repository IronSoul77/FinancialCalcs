import Link from "next/link";
import { saveProfile } from "@/app/actions/data";
import { createClient } from "@/lib/supabase/server";
import { EmergencyForm, ExpenseForm, IncomeForm, LoanForm } from "@/components/Forms";
import type { EmergencySettings, Profile } from "@/lib/types/database";

export default async function SetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [profile, emergency] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase.from("emergency_settings").select("*").eq("user_id", user!.id).maybeSingle()
  ]);
  const profileData = profile.data as Profile | null;
  const emergencyData = emergency.data as EmergencySettings | null;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Initial Setup</h1>
        <p className="text-slate-600">Enter the finance details the optimizer needs. You can edit everything later.</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Step 1: Name</h2>
        <form action={saveProfile} className="card flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1"><label>What is your name?</label><input name="name" defaultValue={profileData?.name ?? ""} required /></div>
          <button className="btn-primary" type="submit">Save Name</button>
        </form>
      </section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Step 2: Income</h2><IncomeForm /></section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Step 3: Required Expenses</h2><ExpenseForm /></section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Step 4: Emergency Savings</h2><EmergencyForm settings={emergencyData} /></section>
      <section className="space-y-3"><h2 className="text-xl font-semibold">Step 5: Loans</h2><LoanForm /><p className="text-sm text-slate-600">Use the Loans page to add another loan or debt after saving this one.</p></section>
      <Link href="/dashboard" className="btn-primary">Go to Optimizer Dashboard</Link>
    </div>
  );
}
