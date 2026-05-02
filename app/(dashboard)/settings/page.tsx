import { EmergencyForm } from "@/components/Forms";
import { createClient } from "@/lib/supabase/server";
import type { EmergencySettings } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("emergency_settings").select("*").eq("user_id", user!.id).maybeSingle();
  const settings = data as EmergencySettings | null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-600">Emergency savings rules used before extra debt payoff is calculated.</p>
      </div>
      <EmergencyForm settings={settings} />
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        This app provides educational financial calculations and planning estimates. It is not professional financial advice.
      </div>
    </div>
  );
}
